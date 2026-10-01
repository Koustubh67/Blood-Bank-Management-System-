import type { BloodCentre, DonorProfile } from '@/types'
import { BRAND } from '@/config/brand'
import { cityById } from '@/data/cities'

/** Donation slots are booked in the service city's local time (IST). */
const IST_OFFSET = '+05:30'
const DAY_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']
const EVENING_SLOTS = ['18:30', '20:00']
/** Typical visit length: registration, check-up, donation, rest. */
export const VISIT_MINUTES = 45

export function slotsFor(centre: Pick<BloodCentre, 'open24x7'> | undefined) {
  if (!centre) return DAY_SLOTS
  return centre.open24x7 ? [...DAY_SLOTS, ...EVENING_SLOTS] : DAY_SLOTS
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** yyyy-mm-dd in local time */
export function isoDay(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today plus the next six days. */
export function nextDays(count = 7, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    return { iso: isoDay(d), date: d, index: i }
  })
}

/** "2026-10-02T10:00" */
export function makeSlot(day: string, time: string) {
  return `${day}T${time}`
}

export function slotTime(slot: string) {
  return new Date(`${slot}:00${IST_OFFSET}`).getTime()
}

export function isSlotPast(day: string, time: string, now = Date.now(), leadMinutes = 60) {
  return slotTime(makeSlot(day, time)) < now + leadMinutes * 60_000
}

export function formatSlot(slot: string | undefined, opts: { weekday?: boolean } = {}) {
  if (!slot) return 'Slot to be confirmed'
  const t = slotTime(slot)
  if (Number.isNaN(t)) return slot
  const date = new Date(t).toLocaleDateString(BRAND.locale, {
    weekday: opts.weekday === false ? undefined : 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const time = new Date(t).toLocaleTimeString(BRAND.locale, { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  return `${date} · ${time}`
}

export function formatSlotParts(slot: string | undefined) {
  if (!slot) return { day: '—', month: '', weekday: '', time: 'TBC' }
  const t = new Date(slotTime(slot))
  const opt = { timeZone: 'Asia/Kolkata' } as const
  return {
    day: t.toLocaleDateString(BRAND.locale, { ...opt, day: 'numeric' }),
    month: t.toLocaleDateString(BRAND.locale, { ...opt, month: 'short' }),
    weekday: t.toLocaleDateString(BRAND.locale, { ...opt, weekday: 'long' }),
    time: t.toLocaleTimeString(BRAND.locale, { ...opt, hour: 'numeric', minute: '2-digit' }),
  }
}

export function isUpcoming(d: DonorProfile, now = Date.now()) {
  return !!d.slot && slotTime(d.slot) + VISIT_MINUTES * 60_000 > now
}

/** Short human booking reference derived from the donor id. */
export function bookingRef(d: DonorProfile) {
  return `DN-${d.id.slice(-6)}`
}

// ---------- calendar (.ics) ----------

function icsDate(ts: number) {
  return new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsText(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n')
}

export function buildIcs(d: DonorProfile, centre: BloodCentre | undefined) {
  const start = slotTime(d.slot ?? '')
  const end = start + VISIT_MINUTES * 60_000
  const where = centre ? `${centre.name}, ${centre.area}, ${cityById(centre.cityId).name}` : BRAND.name
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${BRAND.name}//Donor booking//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${d.id}@raktflow.example`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(`Blood donation · ${centre?.name ?? BRAND.name}`)}`,
    `LOCATION:${icsText(where)}`,
    `DESCRIPTION:${icsText(
      `Booking ${bookingRef(d)} for ${d.name} (${d.bloodGroup}).\n` +
        'Bring a photo ID. Eat a proper meal 2–3 hours before and drink plenty of water.\n' +
        "The centre's medical officer will confirm eligibility after a short check-up.",
    )}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Blood donation in 2 hours. Eat and hydrate.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadIcs(d: DonorProfile, centre: BloodCentre | undefined) {
  const blob = new Blob([buildIcs(d, centre)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `raktflow-donation-${bookingRef(d)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Google Calendar template link as a no-download alternative. */
export function googleCalendarUrl(d: DonorProfile, centre: BloodCentre | undefined) {
  const start = slotTime(d.slot ?? '')
  const end = start + VISIT_MINUTES * 60_000
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Blood donation · ${centre?.name ?? BRAND.name}`,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: `Booking ${bookingRef(d)}. Bring a photo ID. Eat a meal and drink water beforehand.`,
    location: centre ? `${centre.name}, ${centre.area}, ${cityById(centre.cityId).name}` : BRAND.name,
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
