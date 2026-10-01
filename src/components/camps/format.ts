import type { DonationCamp } from '@/types'
import { BRAND } from '@/config/brand'
import { addDays, campRegistrationUrl, isoDay } from '@/services/camps'

// ---------- date range ----------

export type RangeValue = '0' | '7' | '30'

export const RANGE_OPTIONS: { value: RangeValue; label: string }[] = [
  { value: '0', label: 'Today' },
  { value: '7', label: 'Next 7 days' },
  { value: '30', label: 'Next 30 days' },
]

export const DEFAULT_RANGE_DAYS = 7

/** Only the three ranges we offer are accepted from the URL. */
export function parseRange(v: string | null) {
  return RANGE_OPTIONS.some((o) => o.value === v) ? Number(v) : DEFAULT_RANGE_DAYS
}

/** "today", "in the next 7 days" */
export function rangePhrase(days: number) {
  return days === 0 ? 'today' : `in the next ${days} days`
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString(BRAND.locale)} ${n === 1 ? one : many}`
}

// ---------- dates & times ----------

const dateOf = (iso: string) => new Date(`${iso}T00:00:00`)

/** "09:30" → "9:30 am", "16:00" → "4 pm" */
export function clock12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const h12 = h % 12 || 12
  const suffix = h < 12 ? 'am' : 'pm'
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

export function campTimeRange(camp: Pick<DonationCamp, 'startTime' | 'endTime'>) {
  if (camp.startTime && camp.endTime) return `${clock12(camp.startTime)} – ${clock12(camp.endTime)}`
  if (camp.startTime) return `From ${clock12(camp.startTime)}`
  return 'Timing not listed'
}

/** Group heading: { label: 'Today', detail: 'Thu, 1 Oct' } or { label: 'Saturday', detail: '3 Oct' } */
export function dayHeading(iso: string, today = isoDay(new Date())) {
  const d = dateOf(iso)
  if (iso === today || iso === addDays(today, 1)) {
    return {
      label: iso === today ? 'Today' : 'Tomorrow',
      detail: d.toLocaleDateString(BRAND.locale, { weekday: 'short', day: 'numeric', month: 'short' }),
    }
  }
  return {
    label: d.toLocaleDateString(BRAND.locale, { weekday: 'long' }),
    detail: d.toLocaleDateString(BRAND.locale, { day: 'numeric', month: 'short' }),
  }
}

export function dateParts(iso: string) {
  const d = dateOf(iso)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(BRAND.locale, { month: 'short' }),
    weekday: d.toLocaleDateString(BRAND.locale, { weekday: 'short' }),
    long: d.toLocaleDateString(BRAND.locale, { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export type CampPhase = 'upcoming' | 'live' | 'ended'

/** Whether today's camp is running or over. Only knowable when both times are listed. */
export function campPhase(camp: Pick<DonationCamp, 'date' | 'startTime' | 'endTime'>, now: number): CampPhase {
  const d = new Date(now)
  if (camp.date !== isoDay(d) || !camp.startTime || !camp.endTime) return 'upcoming'
  const m = d.getHours() * 60 + d.getMinutes()
  if (m >= minutes(camp.endTime)) return 'ended'
  return m >= minutes(camp.startTime) ? 'live' : 'upcoming'
}

// ---------- text ----------

/** Venue, district and state without the repeats e-RaktKosh often includes. */
export function campAddress(camp: Pick<DonationCamp, 'venue' | 'district' | 'state'>) {
  const seen = new Set<string>()
  return [camp.venue, camp.district, camp.state]
    .flatMap((p) => p.split(', '))
    .filter((p) => {
      const k = p.trim().toLowerCase()
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
    .join(', ')
}

/** Organiser and blood centre, skipping the organiser when it just repeats the centre. */
export function campHosts(camp: Pick<DonationCamp, 'organiser' | 'bloodCentre'>) {
  const org = camp.organiser?.toLowerCase() ?? ''
  const centre = camp.bloodCentre?.toLowerCase() ?? ''
  const overlaps = !!org && !!centre && (centre.includes(org) || org.includes(centre))
  return { organiser: overlaps ? undefined : camp.organiser, bloodCentre: camp.bloodCentre }
}

const fold = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

/** Every word of the query must appear in the camp's name, venue, hosts or district. */
export function matchesQuery(camp: DonationCamp, query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const hay = fold([camp.name, camp.venue, camp.organiser, camp.bloodCentre, camp.district].filter(Boolean).join(' '))
  return words.every((w) => hay.includes(w))
}

// ---------- links ----------

export function directionsUrl(camp: Pick<DonationCamp, 'venue' | 'district' | 'state'>) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${camp.venue}, ${camp.district}, ${camp.state}`)}`
}

/** tel: link and a readable number. Ten-digit numbers are Indian mobiles or STD + landline. */
export function phoneLink(contact: string) {
  const d = contact.replace(/\D/g, '')
  const national = d.length === 11 && d.startsWith('0') ? d.slice(1) : d
  if (national.length === 10) return { href: `tel:+91${national}`, label: `${national.slice(0, 5)} ${national.slice(5)}` }
  return { href: `tel:${d}`, label: d }
}

const compact = (iso: string) => iso.replace(/-/g, '')

/** Google Calendar template link in India time; all-day when the camp lists no timings. */
export function campCalendarUrl(camp: DonationCamp) {
  let dates: string
  if (camp.startTime) {
    const start = minutes(camp.startTime)
    const listedEnd = camp.endTime ? minutes(camp.endTime) : 0
    // A visit takes about 45 minutes; block an hour when the end time is missing or garbled.
    const end = listedEnd > start ? listedEnd : Math.min(start + 60, 23 * 60 + 59)
    const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`
    dates = `${compact(camp.date)}T${hhmm(start)}/${compact(camp.date)}T${hhmm(end)}`
  } else {
    dates = `${compact(camp.date)}/${compact(addDays(camp.date, 1))}`
  }

  const { organiser, bloodCentre } = campHosts(camp)
  const details = [
    `Blood donation camp listed on e-RaktKosh. I pledged to donate here via ${BRAND.name}.`,
    organiser && `Organiser: ${organiser}`,
    bloodCentre && `Blood centre: ${bloodCentre}`,
    camp.contact && `Contact: ${phoneLink(camp.contact).label}`,
    'Bring a photo ID. Eat a proper meal 2–3 hours before and drink plenty of water.',
    camp.portalRegistration && `Pre-register: ${campRegistrationUrl(camp.id)}`,
  ]
    .filter(Boolean)
    .join('\n')

  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Blood donation · ${camp.name}`,
    dates,
    ctz: 'Asia/Kolkata',
    location: campAddress(camp),
    details,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
