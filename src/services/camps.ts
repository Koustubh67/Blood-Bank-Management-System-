import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDB } from '@/store/db'
import type { BloodGroup, CampPledge, DonationCamp } from '@/types'
import { uid } from '@/lib/utils'
import { ApiError, latency } from './api'
import { getCurrentUser } from './auth'

/**
 * Live blood donation camps from e-RaktKosh, the Ministry of Health & Family
 * Welfare's national blood-centre network. Its public camp schedule needs no
 * key. RaktFlow is not affiliated with it; we only read the schedule and send
 * donors to the official page to pre-register.
 */
const ERAKTKOSH = 'https://eraktkosh.mohfw.gov.in/eraktkoshPortal'

/**
 * The API answers with a duplicated CORS header that browsers reject, so calls
 * go through a same-origin proxy (vite.config.ts, vercel.json, _redirects).
 */
const ERAKTKOSH_API = import.meta.env.VITE_ERAKTKOSH_PROXY ?? '/api/eraktkosh'

export const ERAKTKOSH_CAMPS_PAGE = `${ERAKTKOSH}/#/publicPages/campSchedule`

export function campRegistrationUrl(campId: string) {
  return `${ERAKTKOSH}/#/publicPages/donorCampRegister?campid=${encodeURIComponent(campId)}`
}

/** The official search allows a window of one month at most. */
export const MAX_RANGE_DAYS = 30

interface RawCamp {
  campDate?: string | null
  campTime?: string | null
  campName?: string | null
  campVenue?: string | null
  contact?: string | null
  conductedBy?: string | null
  hospName?: string | null
  campReqNo?: number | string | null
  isPortalRegistration?: number | null
  stateName?: string | null
  districtName?: string | null
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** "01-Oct-2026" → "2026-10-01" */
function parseDate(s: string | null | undefined) {
  const m = s?.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase()]
  return month ? `${m[3]}-${month}-${m[1].padStart(2, '0')}` : null
}

/** "9:30-16:30" → ["09:30", "16:30"] */
function parseTimes(s: string | null | undefined): [string | undefined, string | undefined] {
  const parts = (s ?? '').match(/\d{1,2}[:.]\d{2}/g) ?? []
  const fix = (t?: string) => (t ? t.replace('.', ':').padStart(5, '0') : undefined)
  return [fix(parts[0]), fix(parts[1])]
}

function tidy(s: string | null | undefined) {
  const t = (s ?? '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^[\s,-]+|[\s,-]+$/g, '')
  if (!t || t === '-' || /^null$/i.test(t)) return ''
  // Many entries arrive in ALL CAPS; soften them without touching mixed case.
  return t === t.toUpperCase() && /[A-Z]{3}/.test(t) ? t.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : t
}

/** Venues often repeat the city and district ("Dwarka, Dwarka, South West"); drop repeats. */
function tidyVenue(venue: string, district: string) {
  const seen = new Set<string>()
  const parts = tidy(venue)
    .split(', ')
    .filter((p) => {
      const k = p.toLowerCase()
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  if (parts.length > 1 && district && parts[parts.length - 1].toLowerCase() === district.toLowerCase()) parts.pop()
  return parts.join(', ')
}

function normalise(raw: RawCamp): DonationCamp | null {
  const date = parseDate(raw.campDate)
  const id = raw.campReqNo == null ? '' : String(raw.campReqNo)
  const name = tidy(raw.campName)
  if (!date || !id || !name) return null
  const venueRaw = tidy(raw.campVenue)
  const district = tidy(raw.districtName) || venueRaw.split(', ').pop() || ''
  const [startTime, endTime] = parseTimes(raw.campTime)
  const phone = (raw.contact ?? '').replace(/\D/g, '')
  return {
    id,
    name,
    date,
    startTime,
    endTime,
    venue: tidyVenue(venueRaw, district) || venueRaw,
    district,
    state: tidy(raw.stateName),
    organiser: tidy(raw.conductedBy) || undefined,
    bloodCentre: tidy(raw.hospName) || undefined,
    contact: phone.length >= 8 ? phone : undefined,
    portalRegistration: raw.isPortalRegistration === 1,
  }
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoDay(d)
}

const cache = new Map<string, { at: number; camps: DonationCamp[] }>()
const CACHE_TTL_MS = 10 * 60_000

/** Upcoming camps in a state between two ISO dates (inclusive), soonest first. */
export async function fetchCamps(stateCode: string, from: string, to: string, signal?: AbortSignal): Promise<DonationCamp[]> {
  const key = `${stateCode}|${from}|${to}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.camps

  const params = new URLSearchParams({ stateCode, districtCode: '-1', startDate: from, endDate: to })
  const url = `${ERAKTKOSH_API}/eraktkosh/camps/details?${params}`
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ApiError('Could not reach e-RaktKosh. Check your connection and try again.', 'network')
  }
  if (!res.ok) throw new ApiError('e-RaktKosh did not respond. Please try again in a minute.', 'upstream')
  const data: unknown = await res.json().catch(() => null)
  if (!Array.isArray(data)) throw new ApiError('e-RaktKosh sent an unexpected response.', 'upstream')

  const camps = (data as RawCamp[])
    .map(normalise)
    .filter((c): c is DonationCamp => c !== null && c.date >= from && c.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? '') || a.name.localeCompare(b.name))
  // The same camp is occasionally listed twice.
  const unique = [...new Map(camps.map((c) => [c.id, c])).values()]
  cache.set(key, { at: Date.now(), camps: unique })
  return unique
}

export type CampsStatus = 'loading' | 'ready' | 'error'

export function useCamps(stateCode: string, days: number) {
  const [state, setState] = useState<{ status: CampsStatus; camps: DonationCamp[]; error?: string }>({ status: 'loading', camps: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const from = isoDay(new Date())
    const to = addDays(from, Math.min(Math.max(days, 0), MAX_RANGE_DAYS))
    setState((s) => ({ status: 'loading', camps: s.camps }))
    fetchCamps(stateCode, from, to, ctrl.signal)
      .then((camps) => setState({ status: 'ready', camps }))
      .catch((err) => {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', camps: [], error: err instanceof ApiError ? err.message : 'Could not load camps.' })
      })
    return () => ctrl.abort()
  }, [stateCode, days, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, retry }
}

// ---------- pledges ----------

export interface PledgeInput {
  name: string
  phone: string
  bloodGroup?: BloodGroup
}

/** Records that a donor plans to give at a camp. Counted in the community totals. */
export async function pledgeForCamp(camp: DonationCamp, input: PledgeInput): Promise<CampPledge> {
  await latency()
  const name = input.name.trim()
  const phone = input.phone.replace(/\D/g, '')
  if (name.length < 2) throw new ApiError('Enter your full name.')
  if (!/^[6-9]\d{9}$/.test(phone)) throw new ApiError('Enter a valid 10-digit mobile number.')
  if (camp.date < isoDay(new Date())) throw new ApiError('This camp has already taken place.')
  const { pledges, _set } = useDB.getState()
  if (pledges.some((p) => p.campId === camp.id && p.phone === phone && p.status !== 'cancelled'))
    throw new ApiError('You have already pledged for this camp with this number.')

  const pledge: CampPledge = {
    id: uid('PL'),
    campId: camp.id,
    campName: camp.name,
    campDate: camp.date,
    venue: camp.venue,
    district: camp.district,
    state: camp.state,
    userId: getCurrentUser()?.id,
    name,
    phone,
    bloodGroup: input.bloodGroup,
    status: 'pledged',
    createdAt: Date.now(),
  }
  _set((s) => ({ pledges: [pledge, ...s.pledges] }))
  return pledge
}

function updatePledge(id: string, patch: Partial<CampPledge>) {
  useDB.getState()._set((s) => ({ pledges: s.pledges.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
}

export async function cancelPledge(id: string) {
  await latency(150, 300)
  updatePledge(id, { status: 'cancelled' })
}

/** The donor confirms they gave blood. Only possible on or after the camp day. */
export async function markPledgeDonated(id: string) {
  await latency(150, 300)
  const pledge = useDB.getState().pledges.find((p) => p.id === id)
  if (!pledge) throw new ApiError('Pledge not found.')
  if (pledge.campDate > isoDay(new Date())) throw new ApiError('You can confirm your donation on the day of the camp.')
  updatePledge(id, { status: 'donated', donatedAt: Date.now() })
}

/** Pledges made by the signed-in user, or on this device when signed out. */
export function useMyPledges() {
  const userId = useDB((s) => s.session.userId)
  const pledges = useDB((s) => s.pledges)
  return useMemo(() => pledges.filter((p) => (userId ? p.userId === userId : !p.userId) && p.status !== 'cancelled'), [pledges, userId])
}

/** Active pledges per camp id. */
export function useCampPledgeCounts() {
  const pledges = useDB((s) => s.pledges)
  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of pledges) if (p.status !== 'cancelled') counts[p.campId] = (counts[p.campId] ?? 0) + 1
    return counts
  }, [pledges])
}

/** One donation can be split into red cells, plasma and platelets. */
export const LIVES_PER_DONATION = 3

/** Community totals across every pledge recorded through RaktFlow. */
export function usePledgeStats() {
  const pledges = useDB((s) => s.pledges)
  return useMemo(() => {
    const active = pledges.filter((p) => p.status !== 'cancelled')
    const donated = active.filter((p) => p.status === 'donated').length
    return {
      pledged: active.length,
      donated,
      camps: new Set(active.map((p) => p.campId)).size,
      livesHelped: donated * LIVES_PER_DONATION,
    }
  }, [pledges])
}
