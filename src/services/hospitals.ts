import { useCallback, useEffect, useState } from 'react'
import type { LatLng, RealHospital } from '@/types'
import { HOSPITALS_SNAPSHOT } from '@/data/hospitalsSnapshot'
import { nearestCity } from '@/data/cities'
import { distanceMeters } from '@/lib/utils'

/**
 * Real hospitals from OpenStreetMap via the public Overpass API (no key).
 * Public mirrors can take 30 s or more under load, so the UI shows the bundled
 * Delhi snapshot straight away and swaps in live results when a mirror answers.
 * Mirrors are queried in parallel; the first good answer wins.
 */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const MIRROR_TIMEOUT_MS = 45_000
/** Live results are kept for a day: hospitals rarely move. */
const CACHE_TTL_MS = 24 * 60 * 60_000
const STORAGE_PREFIX = 'rf-hospitals:'
const MAX_RESULTS = 150

export type HospitalSource = 'live' | 'snapshot'

export interface HospitalResult {
  hospitals: RealHospital[]
  source: HospitalSource
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Clinics, labs and diagnostic chains are tagged as hospitals surprisingly often.
const NOT_A_HOSPITAL =
  /\bHOD\b|clinic|diagnost|^dr\.?\s|^doctor\s|path ?lab|dental|\blab\b|physio|polyclinic|urban health|dispensary|ayurved|homo?eo|scan|imaging|\bivf\b|skin|hair|back gate|medcentre/i
const LOOKS_LIKE_HOSPITAL = /hospital|institute|aiims|medical college|chikitsalaya|healthcare|trauma|nursing home|medicity|centre|center/i

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase())
}

function cleanName(raw: string) {
  const name = raw.trim().replace(/\s+/g, ' ')
  return name === name.toUpperCase() || name === name.toLowerCase() ? titleCase(name) : name
}

function areaOf(tags: Record<string, string>) {
  const raw = (tags['addr:suburb'] || tags['addr:district'] || tags['addr:city'] || '').trim().replace(/^,|,$/g, '')
  if (!raw) return ''
  const area = /^(new )?delhi$/i.test(raw) ? raw : raw.replace(/\s+delhi$/i, '')
  return area === area.toUpperCase() || area === area.toLowerCase() ? titleCase(area) : area
}

function normalise(el: OverpassElement): RealHospital | null {
  const tags = el.tags ?? {}
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (!tags.name || lat === undefined || lng === undefined) return null
  if (NOT_A_HOSPITAL.test(tags.name) || !LOOKS_LIKE_HOSPITAL.test(tags.name)) return null
  const phone = (tags['contact:phone'] || tags.phone || tags.mobile)?.split(';')[0].trim()
  const site = tags.website || tags['contact:website']
  const beds = Number(tags.beds)
  const operator = tags['operator:type']
  return {
    id: `osm-${el.type}-${el.id}`,
    name: cleanName(tags.name),
    area: areaOf(tags),
    location: { lat, lng },
    phone: phone || undefined,
    website: site ? (site.startsWith('http') ? site : `https://${site}`) : undefined,
    emergency: tags.emergency === 'yes' || undefined,
    beds: Number.isFinite(beds) && beds > 0 ? beds : undefined,
    ownership: operator === 'government' || operator === 'public' ? 'government' : operator === 'private' ? 'private' : undefined,
  }
}

/** Same hospital is often mapped twice (a node and the building outline): keep the richer one. */
function dedupe(list: RealHospital[]) {
  const byName = new Map<string, RealHospital>()
  const richness = (h: RealHospital) => [h.phone, h.website, h.emergency, h.beds, h.ownership, h.area].filter(Boolean).length
  for (const h of list) {
    const key = h.name.toLowerCase().replace(/[^a-z]/g, '')
    const prev = byName.get(key)
    if (!prev || richness(h) > richness(prev)) byName.set(key, h)
  }
  return [...byName.values()]
}

function byDistance(list: RealHospital[], from: LatLng) {
  return list
    .map((h) => ({ h, d: distanceMeters(from, h.location) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.h)
}

async function queryMirror(url: string, query: string, signal?: AbortSignal) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), MIRROR_TIMEOUT_MS)
  const abort = () => ctrl.abort()
  signal?.addEventListener('abort', abort)
  try {
    // Form-encoded POST is a "simple" request, so there is no CORS preflight.
    const res = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({ data: query }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`Overpass ${res.status}`)
    // Overloaded mirrors sometimes answer 200 with an HTML error page.
    const json = (await res.json()) as { elements?: OverpassElement[] }
    if (!Array.isArray(json.elements)) throw new Error('Overpass: unexpected response')
    return json.elements
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

const memory = new Map<string, { at: number; hospitals: RealHospital[] }>()

function cacheKey(center: LatLng, radiusM: number) {
  return `${center.lat.toFixed(3)},${center.lng.toFixed(3)},${Math.round(radiusM)}`
}

function readCache(key: string): RealHospital[] | null {
  const hit = memory.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.hospitals
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const stored = JSON.parse(raw) as { at: number; hospitals: RealHospital[] }
    if (Date.now() - stored.at > CACHE_TTL_MS) return null
    memory.set(key, stored)
    return stored.hospitals
  } catch {
    return null
  }
}

function writeCache(key: string, hospitals: RealHospital[]) {
  const entry = { at: Date.now(), hospitals }
  memory.set(key, entry)
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* storage full or blocked: the in-memory copy still helps this visit */
  }
}

/** Bundled Delhi snapshot entries within the radius, nearest first. Empty elsewhere. */
export function snapshotNear(center: LatLng, radiusM: number) {
  return byDistance(
    HOSPITALS_SNAPSHOT.filter((h) => distanceMeters(center, h.location) <= radiusM),
    center,
  )
}

// Saved copies for every other city, split per city so each loads only when needed.
const CITY_SNAPSHOTS = import.meta.glob<RealHospital[]>('../data/hospitals/*.json', { import: 'default' })

/** Saved hospitals for the city nearest `center`, within the radius, nearest first. */
export async function citySnapshotNear(center: LatLng, radiusM: number): Promise<RealHospital[]> {
  const load = CITY_SNAPSHOTS[`../data/hospitals/${nearestCity(center).city.id}.json`]
  if (!load) return []
  try {
    const all = await load()
    return byDistance(all.filter((h) => distanceMeters(center, h.location) <= radiusM), center)
  } catch {
    return []
  }
}

/** Live hospitals within `radiusM` of `center`, nearest first. Throws if no mirror answers. */
export async function fetchLiveHospitals(center: LatLng, radiusM = 8000, signal?: AbortSignal): Promise<RealHospital[]> {
  const key = cacheKey(center, radiusM)
  const cached = readCache(key)
  if (cached) return cached

  const query = `[out:json][timeout:40];nwr["amenity"="hospital"]["name"](around:${Math.round(radiusM)},${center.lat},${center.lng});out center tags;`
  const race = new AbortController()
  const stop = () => race.abort()
  signal?.addEventListener('abort', stop)
  try {
    const elements = await Promise.any(OVERPASS_MIRRORS.map((url) => queryMirror(url, query, race.signal)))
    const list = dedupe(elements.map(normalise).filter((h): h is RealHospital => h !== null))
    const hospitals = byDistance(list, center).slice(0, MAX_RESULTS)
    writeCache(key, hospitals)
    return hospitals
  } finally {
    // Cancel the slower mirrors once one has answered.
    race.abort()
    signal?.removeEventListener('abort', stop)
  }
}

/** Live hospitals if any mirror answers, otherwise the bundled snapshot. */
export async function fetchNearbyHospitals(center: LatLng, radiusM = 8000, signal?: AbortSignal): Promise<HospitalResult> {
  try {
    return { hospitals: await fetchLiveHospitals(center, radiusM, signal), source: 'live' }
  } catch (err) {
    if (signal?.aborted) throw err
    const saved = snapshotNear(center, radiusM)
    return { hospitals: saved.length ? saved : await citySnapshotNear(center, radiusM), source: 'snapshot' }
  }
}

export type LoadState = 'loading' | 'ready' | 'error'

/**
 * Hospitals near a point. Returns the snapshot immediately (when the point is
 * in Delhi) with `refreshing: true`, then swaps to live data when it arrives.
 */
export function useNearbyHospitals(center: LatLng, radiusM = 8000) {
  const initial = () => {
    const cached = readCache(cacheKey(center, radiusM))
    if (cached) return { status: 'ready' as LoadState, result: { hospitals: cached, source: 'live' as HospitalSource }, refreshing: false }
    const snap = snapshotNear(center, radiusM)
    return snap.length
      ? { status: 'ready' as LoadState, result: { hospitals: snap, source: 'snapshot' as HospitalSource }, refreshing: true }
      : { status: 'loading' as LoadState, result: null, refreshing: true }
  }
  const [state, setState] = useState<{ status: LoadState; result: HospitalResult | null; refreshing: boolean }>(initial)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    const start = initial()
    setState(start)
    if (!start.refreshing) return
    // Outside Delhi: show the city's saved copy while the live query runs.
    if (!start.result)
      void citySnapshotNear(center, radiusM).then((hospitals) => {
        if (ctrl.signal.aborted || !hospitals.length) return
        setState((s) => (s.result?.source === 'live' ? s : { status: 'ready', result: { hospitals, source: 'snapshot' }, refreshing: true }))
      })
    fetchLiveHospitals(center, radiusM, ctrl.signal)
      .then((hospitals) => setState({ status: 'ready', result: { hospitals, source: 'live' }, refreshing: false }))
      .catch(() => {
        if (ctrl.signal.aborted) return
        // Keep showing the snapshot if we have one; otherwise report the failure.
        setState((s) => (s.result ? { ...s, refreshing: false } : { status: 'error', result: null, refreshing: false }))
      })
    return () => ctrl.abort()
    // Re-query only when the point actually moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, radiusM, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, retry }
}
