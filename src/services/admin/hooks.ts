import { useMemo } from 'react'
import type { BloodCentre, BloodGroup, ComponentCode, Inventory, Order, OrderStatus, Outlet } from '@/types'
import type { FridgeExcursion, OpsOrder, OpsStage, OpsStore, StaffMember } from './types'
import { useDB } from '@/store/db'
import { liveStatus } from '@/services/orders'
import { outletTelemetry } from '@/services/outlets'
import { stockLevel, type StockLevel } from '@/services/inventory'
import { hospitalById } from '@/data/network'
import { outletById } from '@/data/outlets'
import { BLOOD_GROUPS, COMPONENT_CODES } from '@/data/blood'
import { hashString } from '@/lib/utils'
import { mergedStaff, useOps } from './store'
import { ALL_INDIA, storeById, storesIn } from './stores'
import { isActive } from './priority'
import { loadInfo, riderViews } from './dispatch'
import { collectionRows } from './collections'
import { MIN_MS, startOfDay } from './time'

// ---------- scope ----------

export function useScope() {
  return useOps((s) => s.cityId)
}

export function inScope(scope: string, cityId: string) {
  return scope === ALL_INDIA || scope === cityId
}

// ---------- orders placed in the app ----------

const APP_STAGE: Partial<Record<OrderStatus, OpsStage>> = {
  placed: 'verifying',
  verified: 'packing',
  packed: 'ready',
  dispatched: 'out_for_delivery',
  arriving: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

/**
 * A real order from the customer app, shown on the ops board. Its stage comes
 * from the same time-based plan the customer's tracking page uses, so the two
 * always agree; the panel can look but not move it.
 */
export function appToOps(o: Order, now: number): OpsOrder | null {
  const paid = o.payments.find((p) => p.status === 'success')
  const hospital = hospitalById(o.hospitalId)
  if (!paid || !o.placedAt || !o.plan || !hospital) return null
  const stage = APP_STAGE[liveStatus(o, now)]
  if (!stage) return null
  const base = o.placedAt - o.simOffsetMs
  const p = o.plan
  const marks: [OpsStage, number][] = [
    ['verifying', o.placedAt],
    ['packing', base + p.verifyAt],
    ['ready', base + p.packAt],
    ['out_for_delivery', base + p.dispatchAt],
    ['delivered', base + p.deliverAt],
  ]
  const stageAt: OpsOrder['stageAt'] = { incoming: o.placedAt }
  for (const [s, at] of marks) if (at <= now && !(o.status === 'cancelled' && o.cancelledAt && at > o.cancelledAt)) stageAt[s] = at
  if (o.status === 'cancelled' && o.cancelledAt) stageAt.cancelled = o.cancelledAt
  const sex = o.patient.gender === 'female' ? 'F' : o.patient.gender === 'male' ? 'M' : 'X'
  const [first, ...rest] = o.patient.name.trim().split(/\s+/)
  return {
    id: o.id,
    source: 'app',
    cityId: hospital.cityId,
    storeId: o.centreId,
    hospitalId: o.hospitalId,
    items: o.items,
    priority: o.priority,
    createdAt: o.placedAt,
    stage,
    stageAt,
    riderName: o.rider?.name,
    rideMin: Math.max(1, Math.round((p.arriveAt - p.dispatchAt) / MIN_MS)),
    distanceM: p.distanceM,
    method: paid.method,
    price: o.price,
    refund: o.status === 'cancelled' ? paid.amount : undefined,
    otp: o.handoverOtp,
    patient: `${rest.length ? `${first[0]}. ${rest[rest.length - 1]}` : first}, ${o.patient.age} ${sex}`,
    ward: o.patient.ward,
    doctor: o.prescriber.doctorName,
    doctorReg: o.prescriber.registrationNo,
    requisition: o.prescriber.requisitionFileName,
    reason: o.cancelReason,
    audit: [
      { at: o.placedAt, actor: o.role === 'hospital' ? 'Hospital (app)' : 'Patient family (app)', action: 'Order placed and paid', detail: paid.instrument },
      ...(o.cancelledAt ? [{ at: o.cancelledAt, actor: 'Customer (app)', action: 'Cancelled', detail: o.cancelReason }] : []),
    ],
  }
}

/** App orders placed today or still on the way. */
function useAppOrders(now: number) {
  const orders = useDB((s) => s.orders)
  return useMemo(() => {
    const today = startOfDay(now)
    const out: OpsOrder[] = []
    for (const o of orders) {
      const v = appToOps(o, now)
      if (v && (v.createdAt >= today || isActive(v))) out.push(v)
    }
    return out
  }, [orders, now])
}

/** Ops queue plus app orders, for the selected city. */
export function useBoardOrders(now: number) {
  const scope = useScope()
  const ops = useOps((s) => s.orders)
  const app = useAppOrders(now)
  return useMemo(() => [...app, ...ops].filter((o) => inScope(scope, o.cityId)), [ops, app, scope])
}

// ---------- staff & riders ----------

export function useStaff(): StaffMember[] {
  const patch = useOps((s) => s.staffPatch)
  const added = useOps((s) => s.staffAdded)
  return useMemo(() => mergedStaff(patch, added), [patch, added])
}

export function useScopedStaff() {
  const scope = useScope()
  const staff = useStaff()
  return useMemo(() => staff.filter((m) => inScope(scope, m.cityId)), [staff, scope])
}

export function useRiderViews(now: number) {
  const staff = useScopedStaff()
  const orders = useOps((s) => s.orders)
  const returns = useOps((s) => s.returns)
  return useMemo(() => riderViews(staff, orders, returns, now), [staff, orders, returns, now])
}

export function useLoad(now: number) {
  const scope = useScope()
  const surge = useOps((s) => s.surge)
  const orders = useOps((s) => s.orders)
  const views = useRiderViews(now)
  return useMemo(() => loadInfo(orders.filter((o) => inScope(scope, o.cityId)), views, surge, now), [orders, views, surge, now, scope])
}

// ---------- stores: stock & fridges ----------

export const FRIDGE_MIN_C = 2
export const FRIDGE_MAX_C = 6

/** The outlet's logger reading, plus any simulated door-open excursion. */
export function fridgeTemp(outlet: Outlet, centre: BloodCentre | undefined, now: number, excursion?: FridgeExcursion) {
  const t = outletTelemetry(outlet, centre, now)
  if (!excursion || now < excursion.start || now > excursion.until) return t
  const phase = (now - excursion.start) / (excursion.until - excursion.start)
  return { ...t, tempC: Math.round((t.tempC + excursion.peak * Math.sin(Math.PI * phase)) * 10) / 10 }
}

export function fridgeOk(tempC: number) {
  return tempC >= FRIDGE_MIN_C && tempC <= FRIDGE_MAX_C
}

/**
 * Units on a store's shelf. Centres use their live inventory; an outlet holds
 * a share of its mother centre's stock (the same share its fridge logger
 * reports), capped at fridge capacity.
 */
export function storeInventory(store: OpsStore, centres: BloodCentre[]): Inventory | null {
  if (store.kind === 'centre') return centres.find((c) => c.id === store.id)?.inventory ?? null
  const mother = centres.find((c) => c.id === store.motherCentreId)
  if (!mother) return null
  const share = 0.18 + (hashString(store.id) % 9) / 100
  let total = 0
  for (const g of BLOOD_GROUPS) for (const c of COMPONENT_CODES) total += Math.round(mother.inventory[g][c] * share)
  const cap = store.capacityUnits ?? total
  const k = total > cap ? cap / total : 1
  const inv = {} as Inventory
  for (const g of BLOOD_GROUPS) {
    inv[g] = {} as Record<ComponentCode, number>
    for (const c of COMPONENT_CODES) inv[g][c] = Math.round(mother.inventory[g][c] * share * k)
  }
  return inv
}

export function inventoryTotal(inv: Inventory | null) {
  if (!inv) return 0
  let n = 0
  for (const g of BLOOD_GROUPS) for (const c of COMPONENT_CODES) n += inv[g][c]
  return n
}

export interface LowGroup {
  group: BloodGroup
  units: number
  level: StockLevel
}

/** Groups whose red cells (the unit most orders ask for) are low or out. Emptiest first. */
export function lowGroups(inv: Inventory | null): LowGroup[] {
  if (!inv) return []
  return BLOOD_GROUPS.map((group) => ({ group, units: inv[group].PRBC, level: stockLevel(inv[group].PRBC) }))
    .filter((g) => g.level === 'low' || g.level === 'out')
    .sort((a, b) => a.units - b.units)
}

/** Groups people ask for most; one of these at 0 on a shelf is worth a call. */
export const COMMON_GROUPS: BloodGroup[] = ['O+', 'B+', 'A+', 'AB+']

export interface CityShortage extends LowGroup {
  cityId: string
  centres: number
}

/**
 * Red-cell groups that are low across a whole city's blood centres. Rare
 * negatives are thin at any single centre; what matters is whether the city
 * as a whole can still supply them.
 */
export function cityShortages(scope: string, centres: BloodCentre[]): CityShortage[] {
  const byCity = new Map<string, BloodCentre[]>()
  for (const c of centres) if (inScope(scope, c.cityId)) byCity.set(c.cityId, [...(byCity.get(c.cityId) ?? []), c])
  const out: CityShortage[] = []
  for (const [cityId, list] of byCity) {
    for (const group of BLOOD_GROUPS) {
      const units = list.reduce((s, c) => s + c.inventory[group].PRBC, 0)
      const level = stockLevel(units)
      if (level === 'low' || level === 'out') out.push({ cityId, group, units, level, centres: list.length })
    }
  }
  return out.sort((a, b) => a.units - b.units)
}

export function outletFor(store: OpsStore) {
  return store.kind === 'outlet' ? outletById(store.id) : undefined
}

// ---------- collections ----------

/** Rows for the scope (optionally one store), refreshed as orders move and once a minute. */
export function useCollectionRows(days: number, now: number, storeId?: string) {
  const scope = useScope()
  const ops = useOps((s) => s.orders)
  const app = useDB((s) => s.orders)
  const minute = Math.floor(now / MIN_MS)
  return useMemo(() => {
    const stores = storeId ? [storeById(storeId)].filter((s): s is OpsStore => !!s) : storesIn(scope)
    return collectionRows(stores, days, minute * MIN_MS, ops, app)
  }, [scope, storeId, days, minute, ops, app])
}
