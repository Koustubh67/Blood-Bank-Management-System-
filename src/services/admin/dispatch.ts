import type { LatLng } from '@/types'
import type { OpsOrder, OpsStore, RiderReturn, RiderState, StaffMember } from './types'
import { hospitalById } from '@/data/network'
import { distanceMeters, pointAlong } from '@/lib/utils'
import { storeById } from './stores'
import { byScore, isDeferred, isPreDispatch } from './priority'
import { earlierDeliveriesToday } from './staffSeed'
import { HANDOVER_MS, MIN_MS, startOfDay } from './time'

export const RIDER_STATE_LABEL: Record<RiderState, string> = {
  available: 'Available',
  to_pickup: 'To pickup',
  on_the_way: 'On the way',
  returning: 'Returning',
  off_shift: 'Off shift',
  leave: 'On leave',
  inactive: 'Deactivated',
}

export interface RiderView {
  rider: StaffMember
  store: OpsStore
  state: RiderState
  order?: OpsOrder
  /** Time left in the current leg (pickup, ride or ride back) */
  etaMs?: number
  position: LatLng
  /** 0..1 along the current leg, for the map */
  progress: number
  todayCount: number
}

/** Where each rider is and what they are doing, derived from the orders. */
export function riderViews(staff: StaffMember[], orders: OpsOrder[], returns: Record<string, RiderReturn>, now: number): RiderView[] {
  const current = new Map<string, OpsOrder>()
  const deliveredToday = new Map<string, number>()
  const today = startOfDay(now)
  for (const o of orders) {
    if (!o.riderId || o.source !== 'ops') continue
    if (o.stage === 'ready' || o.stage === 'out_for_delivery') current.set(o.riderId, o)
    if (o.stage === 'delivered' && (o.stageAt.delivered ?? 0) >= today) deliveredToday.set(o.riderId, (deliveredToday.get(o.riderId) ?? 0) + 1)
  }
  const out: RiderView[] = []
  for (const rider of staff) {
    if (rider.role !== 'rider') continue
    const store = storeById(rider.storeId)
    if (!store) continue
    const order = current.get(rider.id)
    const todayCount = earlierDeliveriesToday(rider, now) + (deliveredToday.get(rider.id) ?? 0)
    const base = { rider, store, todayCount }
    if (order) {
      const orderStore = storeById(order.storeId) ?? store
      const hospital = hospitalById(order.hospitalId)
      if (order.stage === 'ready') {
        const legStart = order.assignedAt ?? now
        const legEnd = order.pickupAt ?? now
        const progress = legEnd > legStart ? Math.min(1, (now - legStart) / (legEnd - legStart)) : 1
        const position = order.borrowed ? pointAlong([store.location, orderStore.location], progress) : orderStore.location
        out.push({ ...base, state: 'to_pickup', order, etaMs: Math.max(0, legEnd - now), position, progress })
        continue
      }
      const start = order.stageAt.out_for_delivery ?? now
      const rideMs = order.rideMin * MIN_MS
      const progress = Math.min(1, (now - start) / rideMs)
      const position = hospital ? pointAlong([orderStore.location, hospital.location], progress) : orderStore.location
      out.push({ ...base, state: 'on_the_way', order, etaMs: Math.max(0, start + rideMs + HANDOVER_MS - now), position, progress })
      continue
    }
    const ret = returns[rider.id]
    if (ret && ret.until > now && rider.status === 'on_shift') {
      const progress = Math.min(1, (now - ret.start) / (ret.until - ret.start))
      out.push({ ...base, state: 'returning', etaMs: ret.until - now, position: pointAlong([ret.from, store.location], progress), progress })
      continue
    }
    const state: RiderState = rider.status === 'on_shift' ? 'available' : rider.status
    out.push({ ...base, state, position: store.location, progress: 0 })
  }
  return out
}

export interface RiderOption {
  view: RiderView
  distanceM: number
  borrowed: boolean
}

/**
 * Riders who could take an order, best first: free riders at the order's own
 * store (fewest trips today first, to share the load), then, when borrowing
 * is allowed, free riders at other stores in the same city by distance.
 */
export function riderOptions(order: OpsOrder, views: RiderView[], allowBorrow: boolean): RiderOption[] {
  const store = storeById(order.storeId)
  if (!store) return []
  const free = views.filter((v) => v.state === 'available' && v.store.cityId === order.cityId)
  const own = free
    .filter((v) => v.store.id === store.id)
    .sort((a, b) => a.todayCount - b.todayCount || (b.rider.onTimePct ?? 0) - (a.rider.onTimePct ?? 0))
    .map((view) => ({ view, distanceM: 0, borrowed: false }))
  if (!allowBorrow) return own
  const others = free
    .filter((v) => v.store.id !== store.id)
    .map((view) => ({ view, distanceM: distanceMeters(view.position, store.location), borrowed: true }))
    .sort((a, b) => a.distanceM - b.distanceM)
  return [...own, ...others]
}

export interface Assignment {
  orderId: string
  riderId: string
  borrowed: boolean
  distanceM: number
}

/**
 * Greedy auto-dispatch. Packed orders are taken highest priority score first;
 * each gets the best free rider from `riderOptions`. With surge mode on,
 * riders can be borrowed across stores in the city and non-urgent scheduled
 * orders wait. Orders left over show "waiting for rider".
 */
export function planAssignments(orders: OpsOrder[], views: RiderView[], surge: boolean, now: number): Assignment[] {
  const queue = orders
    .filter((o) => o.source === 'ops' && o.stage === 'ready' && !o.riderId && !isDeferred(o, surge, now))
    .sort(byScore(now))
  const taken = new Set<string>()
  const pool = views.filter((v) => v.state === 'available')
  const plan: Assignment[] = []
  for (const o of queue) {
    const best = riderOptions(o, pool.filter((v) => !taken.has(v.rider.id)), surge)[0]
    if (!best) continue
    taken.add(best.view.rider.id)
    plan.push({ orderId: o.id, riderId: best.view.rider.id, borrowed: best.borrowed, distanceM: best.distanceM })
  }
  return plan
}

export type LoadLevel = 'normal' | 'busy' | 'surge'

export interface LoadInfo {
  level: LoadLevel
  /** Orders not yet dispatched that have no rider */
  demand: number
  /** On-shift riders free right now */
  available: number
  /** Imminent orders (packed, packing or emergency) that free riders can't cover under the current rules */
  waiting: number
  ratio: number
  offShift: number
}

/**
 * Load = orders not yet dispatched and without a rider ÷ riders free now.
 * Every one of them needs a rider within minutes (an emergency is packed in
 * about three), so a rush shows up as soon as orders land, not when they're
 * packed. Without surge mode a store can only use its own riders, so the
 * orders nobody can cover are counted store by store.
 */
export function loadInfo(orders: OpsOrder[], views: RiderView[], surge: boolean, now: number): LoadInfo {
  const need = orders.filter((o) => o.source === 'ops' && isPreDispatch(o) && !o.riderId && !isDeferred(o, surge, now))
  const free = views.filter((v) => v.state === 'available')
  const offShift = views.filter((v) => v.state === 'off_shift').length
  // Only orders that will want a rider before one comes back count as uncovered:
  // anything packed or packing, and every emergency.
  const imminent = need.filter((o) => o.stage === 'packing' || o.stage === 'ready' || o.priority === 'emergency')
  const key = (cityId: string, storeId: string) => (surge ? cityId : storeId)
  const pool = new Map<string, { d: number; a: number }>()
  for (const o of imminent) {
    const k = key(o.cityId, o.storeId)
    pool.set(k, { d: (pool.get(k)?.d ?? 0) + 1, a: 0 })
  }
  for (const v of free) {
    const p = pool.get(key(v.store.cityId, v.store.id))
    if (p) p.a++
  }
  let waiting = 0
  for (const { d, a } of pool.values()) waiting += Math.max(0, d - a)
  const ratio = need.length / Math.max(1, free.length)
  const level: LoadLevel = waiting >= 3 || ratio > 1.5 ? 'surge' : waiting >= 1 || ratio > 0.75 ? 'busy' : 'normal'
  return { level, demand: need.length, available: free.length, waiting, ratio, offShift }
}
