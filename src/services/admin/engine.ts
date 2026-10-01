import { create } from 'zustand'
import type { Priority } from '@/types'
import type { CityScope, OpsActivity, OpsOrder, OpsStage, RiderReturn } from './types'
import { hospitalById, hospitalsInCity } from '@/data/network'
import { outletsInCity } from '@/data/outlets'
import { MAX_ACTIVITY, activity, currentStaff, describeItems, freshDay, hospitalName, useOps } from './store'
import { arrivalCity, makeOrder } from './orderFactory'
import { returnTrip } from './actions'
import { planAssignments, riderViews } from './dispatch'
import { isActive, PRIORITY_LABEL } from './priority'
import { ALL_INDIA, shortStoreName, storeById } from './stores'
import { shortName } from './names'
import { AUTO_MS, HANDOVER_MS, MIN_MS, PICKUP_MS, isoDay } from './time'
import { rideMinutes } from '@/services/orders'

/**
 * The simulator behind the panel. It only runs while an admin page is open
 * (`OpsEngine` mounts it): a one-second tick that moves riders, lets
 * Autopilot work the stores, and an arrival timer for new hospital orders.
 * Time spent with the panel closed is skipped, as if the city had paused.
 */

const REJECT_REASONS = [
  'Patient name on the requisition does not match the sample label',
  'Requisition missing the treating doctor’s registration number',
  'Cross-match sample haemolysed, fresh sample requested',
]

function step(o: OpsOrder, stage: OpsStage, now: number, action: string, actor: string, detail?: string): OpsOrder {
  return { ...o, stage, stageAt: { ...o.stageAt, [stage]: now }, audit: [...o.audit, { at: now, actor, action, detail }] }
}

interface Advance {
  order: OpsOrder
  log?: OpsActivity
  ret?: { riderId: string; ret: RiderReturn }
}

/** One Autopilot step for an order the panel isn't handling, if it is due. */
function autoAdvance(o: OpsOrder, now: number): Advance | null {
  if (o.source !== 'ops' || !isActive(o)) return null
  if (o.manualUntil && now < o.manualUntil) return null
  const a = AUTO_MS[o.priority]
  const since = now - (o.stageAt[o.stage] ?? o.createdAt)
  const store = shortStoreName(storeById(o.storeId))
  switch (o.stage) {
    case 'incoming':
      return since < a.incoming ? null : { order: step(o, 'verifying', now, 'Requisition check started', 'Lab technician') }
    case 'verifying': {
      if (since < a.verifying) return null
      if (Math.random() < 0.03) {
        const reason = REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)]
        return {
          order: { ...step(o, 'rejected', now, 'Requisition rejected', 'Medical officer', reason), reason, refund: o.price.total },
          log: activity(o.cityId, 'reject', `${o.id} rejected at ${store}: ${reason}`, o.id, now),
        }
      }
      return { order: step(o, 'packing', now, 'Requisition approved', 'Medical officer', `${o.doctor} · ${o.doctorReg}`) }
    }
    case 'packing':
      return since < a.packing ? null : { order: step(o, 'ready', now, 'Packed in validated cold box', 'Lab technician', 'Seal and temperature logger checked') }
    case 'ready':
      if (!o.riderId || !o.pickupAt || now < o.pickupAt) return null
      return {
        order: step(o, 'out_for_delivery', now, 'Picked up by rider', 'Autopilot', `Ride about ${o.rideMin} min`),
        log: activity(o.cityId, 'dispatch', `${o.id} out for delivery from ${store} · ETA ${o.rideMin} min`, o.id, now),
      }
    case 'out_for_delivery': {
      const due = (o.stageAt.out_for_delivery ?? now) + o.rideMin * MIN_MS + HANDOVER_MS
      if (now < due) return null
      const trip = returnTrip(o, now)
      return {
        order: step(o, 'delivered', now, 'Delivered', 'Autopilot', 'OTP confirmed at the blood bank desk'),
        log: activity(o.cityId, 'deliver', `${o.id} delivered to ${hospitalName(o)} · ${Math.round((now - o.createdAt) / MIN_MS)} min order to handover`, o.id, now),
        ret: trip ?? undefined,
      }
    }
    default:
      return null
  }
}

const MAX_ORDERS = 400

/** Advance the simulated world to `now`. Writes to the store only when something changed. */
export function tick(now: number) {
  const s = useOps.getState()
  if (s.dayKey !== isoDay(now)) {
    useOps.setState(freshDay(now))
    return
  }
  let orders = s.orders
  let returns = s.returns
  let excursions = s.excursions
  const logs: OpsActivity[] = []
  let changed = now - s.lastTickAt > 15_000

  if (Object.values(returns).some((r) => r.until <= now)) {
    returns = Object.fromEntries(Object.entries(returns).filter(([, r]) => r.until > now))
    changed = true
  }
  if (Object.values(excursions).some((e) => e.until <= now)) {
    excursions = Object.fromEntries(Object.entries(excursions).filter(([, e]) => e.until > now))
    changed = true
  }
  // Now and then a fridge door is left open somewhere in the city being watched.
  if (Math.random() < 1 / 480) {
    const cityId = s.cityId === ALL_INDIA ? 'delhi' : s.cityId
    const outlets = outletsInCity(cityId).filter((o) => !excursions[o.id])
    const outlet = outlets[Math.floor(Math.random() * outlets.length)]
    if (outlet) {
      excursions = { ...excursions, [outlet.id]: { start: now, until: now + (4 + Math.random() * 3) * MIN_MS, peak: 2.6 + Math.random() * 0.9 } }
      logs.push(activity(cityId, 'alert', `Fridge temperature rising at ${shortStoreName(storeById(outlet.id))}: door-open alarm`, undefined, now))
      changed = true
    }
  }

  if (s.autopilot) {
    let moved = false
    const next = orders.map((o) => {
      const r = autoAdvance(o, now)
      if (!r) return o
      moved = true
      if (r.log) logs.push(r.log)
      if (r.ret) returns = { ...returns, [r.ret.riderId]: r.ret.ret }
      return r.order
    })
    if (moved) {
      orders = next
      changed = true
    }
    // Greedy dispatch for packed orders nobody on the panel is handling.
    const views = riderViews(currentStaff(), orders, returns, now)
    const plan = planAssignments(
      orders.filter((o) => !(o.manualUntil && o.manualUntil > now)),
      views,
      s.surge,
      now,
    )
    if (plan.length) {
      const byOrder = new Map(plan.map((p) => [p.orderId, p]))
      const riders = new Map(views.map((v) => [v.rider.id, v]))
      orders = orders.map((o) => {
        const p = byOrder.get(o.id)
        const v = p && riders.get(p.riderId)
        if (!p || !v) return o
        const store = storeById(o.storeId)
        const pickupMs = p.borrowed && store ? rideMinutes(v.store.location, store.location, 'emergency') * MIN_MS : PICKUP_MS
        if (p.borrowed) logs.push(activity(o.cityId, 'assign', `${shortName(v.rider.name)} borrowed from ${shortStoreName(v.store)} for ${o.id}`, o.id, now))
        return {
          ...o,
          riderId: p.riderId,
          borrowed: p.borrowed,
          assignedAt: now,
          pickupAt: now + pickupMs,
          audit: [...o.audit, { at: now, actor: 'Autopilot', action: 'Rider assigned', detail: `${v.rider.name}${p.borrowed ? ` · borrowed from ${shortStoreName(v.store)}` : ''}` }],
        }
      })
      changed = true
    }
  }

  if (!changed) return
  if (orders.length > MAX_ORDERS) {
    const closed = orders.filter((o) => !isActive(o)).sort((a, b) => a.createdAt - b.createdAt)
    const drop = new Set(closed.slice(0, orders.length - MAX_ORDERS).map((o) => o.id))
    orders = orders.filter((o) => !drop.has(o.id))
  }
  useOps.setState({
    orders,
    returns,
    excursions,
    lastTickAt: now,
    activity: logs.length ? [...logs.reverse(), ...s.activity].slice(0, MAX_ACTIVITY) : s.activity,
  })
}

/** Skip the time the panel was closed, so a reopened board picks up where it left off. */
export function resumeAfterPause(now: number) {
  const s = useOps.getState()
  if (s.dayKey !== isoDay(now)) {
    useOps.setState(freshDay(now))
    return
  }
  const gap = now - s.lastTickAt
  if (gap < 90_000) return
  const shift = (t: number | undefined) => (t === undefined ? undefined : t + gap)
  useOps.setState({
    lastTickAt: now,
    orders: s.orders.map((o) =>
      isActive(o)
        ? {
            ...o,
            createdAt: o.createdAt + gap,
            stageAt: Object.fromEntries(Object.entries(o.stageAt).map(([k, v]) => [k, v + gap])),
            assignedAt: shift(o.assignedAt),
            pickupAt: shift(o.pickupAt),
            manualUntil: shift(o.manualUntil),
            audit: o.audit.map((e) => ({ ...e, at: e.at + gap })),
          }
        : o,
    ),
    returns: Object.fromEntries(Object.entries(s.returns).map(([k, r]) => [k, { ...r, start: r.start + gap, until: r.until + gap }])),
    excursions: {},
  })
}

export function spawnOrder(scope: CityScope, opts: { priority?: Priority; hospitalId?: string; rush?: boolean } = {}) {
  const now = Date.now()
  const cityId = arrivalCity(scope, Math.random)
  const hospital = opts.hospitalId ? hospitalById(opts.hospitalId) : undefined
  const o = makeOrder(Math.random, cityId, { createdAt: now, priority: opts.priority, hospital: hospital?.cityId === cityId ? hospital : undefined, rush: opts.rush })
  const text = `New ${PRIORITY_LABEL[o.priority].toLowerCase()} order ${o.id} · ${describeItems(o)} for ${hospitalName(o)} (${shortStoreName(storeById(o.storeId))})`
  useOps.setState((st) => ({ orders: [...st.orders, o], activity: [activity(cityId, 'order', text, o.id, now), ...st.activity].slice(0, MAX_ACTIVITY) }))
  return o
}

// ---------- rush hour ----------

interface RushState {
  running: boolean
  spawned: number
  total: number
  cityId?: string
}

export const useRush = create<RushState>(() => ({ running: false, spawned: 0, total: 0 }))
let rushTimers: number[] = []

/**
 * A burst of ~12 orders over ~30 s, most of them aimed at two hospitals (a
 * road accident, a dengue ward filling up), so the nearest stores run out of
 * riders and surge handling can be shown.
 */
export function simulateRush(scope: CityScope, onOrder: (o: OpsOrder) => void, onDone?: (total: number) => void, total = 12, spanMs = 30_000) {
  if (useRush.getState().running) return
  const cityId = scope === ALL_INDIA ? 'delhi' : scope
  const hospitals = hospitalsInCity(cityId)
  const hot = [...hospitals].sort(() => Math.random() - 0.5).slice(0, 2)
  useRush.setState({ running: true, spawned: 0, total, cityId })
  for (let i = 0; i < total; i++) {
    const at = (i / (total - 1)) * spanMs + Math.random() * 600
    rushTimers.push(
      window.setTimeout(() => {
        const r = Math.random()
        const priority: Priority = r < 0.5 ? 'emergency' : r < 0.85 ? 'urgent' : 'scheduled'
        const hospital = Math.random() < 0.75 ? hot[Math.floor(Math.random() * hot.length)] : undefined
        onOrder(spawnOrder(cityId, { priority, hospitalId: hospital?.id, rush: true }))
        const spawned = useRush.getState().spawned + 1
        if (spawned >= total) {
          rushTimers = []
          useRush.setState({ running: false, spawned, total })
          onDone?.(total)
        } else useRush.setState({ spawned })
      }, at),
    )
  }
}

export function cancelRush() {
  for (const t of rushTimers) clearTimeout(t)
  rushTimers = []
  useRush.setState({ running: false })
}
