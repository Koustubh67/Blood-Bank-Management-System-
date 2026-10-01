import type { ComponentCode, Order } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { ACTIVE_STATUSES, liveStatus } from '@/services/orders'

export const DAY_MS = 86_400_000

export function startOfDay(ts: number) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function startOfMonth(ts: number) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export function unitsOf(o: Order) {
  return o.items.reduce((s, i) => s + i.units, 0)
}

export function isActive(o: Order, now: number) {
  return ACTIVE_STATUSES.includes(liveStatus(o, now))
}

/** Simulated ms since the order was placed (includes demo fast-forward). */
export function elapsedMs(o: Order, now: number) {
  return o.placedAt ? now - o.placedAt + o.simOffsetMs : 0
}

/** Wall-clock time the order was handed over, or null if not delivered yet. */
export function deliveredAt(o: Order, now: number): number | null {
  if (!o.placedAt || !o.plan || liveStatus(o, now) !== 'delivered') return null
  return Math.min(now, Math.max(o.placedAt, o.placedAt + o.plan.deliverAt - o.simOffsetMs))
}

/** ms until the rider reaches the desk; 0 once there. */
export function etaMs(o: Order, now: number) {
  if (!o.plan) return 0
  return Math.max(0, o.plan.arriveAt - elapsedMs(o, now))
}

export function paidAt(o: Order) {
  return o.payments.find((p) => p.status === 'success')?.paidAt ?? null
}

export function itemLabel(i: { units: number; group: string; component: ComponentCode }) {
  return `${i.units} × ${i.group} ${COMPONENTS[i.component].short.toLowerCase()}`
}

export function itemsSummary(o: Order) {
  return o.items.map(itemLabel).join(', ')
}

// ---------- chart series ----------

export type SeriesKey = 'red' | 'plasma' | 'platelets'

/** Component families for the "units received" chart. Colours validated for CVD separation on white. */
export const SERIES: { key: SeriesKey; label: string; detail: string; color: string; codes: ComponentCode[] }[] = [
  { key: 'red', label: 'Red cells', detail: 'Packed red cells & whole blood', color: '#c8102e', codes: ['PRBC', 'WB'] },
  { key: 'plasma', label: 'Plasma & cryo', detail: 'Fresh frozen plasma & cryoprecipitate', color: '#0891b2', codes: ['FFP', 'CRYO'] },
  { key: 'platelets', label: 'Platelets', detail: 'Random donor platelets', color: '#d97706', codes: ['PLT'] },
]

export function seriesOf(code: ComponentCode): SeriesKey {
  return SERIES.find((s) => s.codes.includes(code))!.key
}

export interface DayBin {
  day: number
  values: Record<SeriesKey, number>
  total: number
}

/** Units received per day for the last `days` days, today last. */
export function unitsPerDay(orders: Order[], now: number, days = 14): DayBin[] {
  const today = startOfDay(now)
  const bins: DayBin[] = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    return { day: d.getTime(), values: { red: 0, plasma: 0, platelets: 0 }, total: 0 }
  })
  const first = bins[0].day
  for (const o of orders) {
    const at = deliveredAt(o, now)
    if (at === null || at < first) continue
    const dayTs = startOfDay(at)
    const bin = bins.find((b) => b.day === dayTs)
    if (!bin) continue
    for (const i of o.items) {
      bin.values[seriesOf(i.component)] += i.units
      bin.total += i.units
    }
  }
  return bins
}
