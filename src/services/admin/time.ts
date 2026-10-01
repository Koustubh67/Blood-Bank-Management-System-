import type { Priority } from '@/types'

export const MIN_MS = 60_000
export const DAY_MS = 86_400_000

/**
 * How long each step takes when Autopilot is running the store: a lab
 * technician starting the check, the requisition review, then cross-match
 * and packing into a validated cold box. Faster for emergencies.
 */
export const AUTO_MS: Record<Priority, { incoming: number; verifying: number; packing: number }> = {
  emergency: { incoming: 15_000, verifying: 40_000, packing: 90_000 },
  urgent: { incoming: 30_000, verifying: 90_000, packing: 180_000 },
  scheduled: { incoming: 60_000, verifying: 120_000, packing: 300_000 },
}

/** Rider at the same store collects the box this long after assignment. */
export const PICKUP_MS = 45_000
/** OTP handover at the hospital's blood bank desk */
export const HANDOVER_MS = 45_000
/** The ride back is a little quicker: no box, no siren protocol */
export const RETURN_FACTOR = 0.85
/** Autopilot leaves an order alone this long after an admin acts on it. */
export const MANUAL_HOLD_MS = 3 * MIN_MS

const pad = (n: number) => String(n).padStart(2, '0')

export function startOfDay(ts: number) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Local calendar date, yyyy-mm-dd */
export function isoDay(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isoDaysFrom(days: number, from: number) {
  return isoDay(startOfDay(from) + days * DAY_MS + DAY_MS / 2)
}

/** Whole days from today to an ISO date; negative when it is in the past. */
export function daysUntil(iso: string, now: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  return Math.round((target - startOfDay(now)) / DAY_MS)
}

/** Share of today that has passed, 0..1 */
export function dayFraction(now: number) {
  return (now - startOfDay(now)) / DAY_MS
}
