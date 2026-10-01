import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ActivityKind, CityScope, FridgeExcursion, OpsActivity, OpsOrder, RiderReturn, StaffMember } from './types'
import { getCurrentUser } from '@/services/auth'
import { hospitalById } from '@/data/network'
import { COMPONENTS } from '@/data/blood'
import { outletsInCity } from '@/data/outlets'
import { seedStaff } from './staffSeed'
import { seedDayOrders } from './orderFactory'
import { shortStoreName, storeById } from './stores'
import { PRIORITY_LABEL } from './priority'
import { MIN_MS, isoDay } from './time'

/**
 * The operations "database": today's order queue, rider returns, staff edits,
 * the activity log and simulator settings. Persisted under its own key so it
 * never collides with the customer DB, and reseeded at the start of each day.
 */
export const OPS_KEY = 'raktflow-ops-v1'
export const MAX_ACTIVITY = 150

export interface OpsState {
  dayKey: string
  cityId: CityScope
  autopilot: boolean
  surge: boolean
  orders: OpsOrder[]
  returns: Record<string, RiderReturn>
  /** Edits on top of the seeded register, keyed by staff id */
  staffPatch: Record<string, Partial<StaffMember>>
  /** People added from the panel */
  staffAdded: StaffMember[]
  activity: OpsActivity[]
  excursions: Record<string, FridgeExcursion>
  lastTickAt: number
}

let seq = 0
export function activity(cityId: string, kind: ActivityKind, text: string, orderId?: string, at = Date.now()): OpsActivity {
  return { id: `A${at.toString(36)}${(seq++).toString(36)}`, at, cityId, kind, text, orderId }
}

/** What an order is, in one short phrase: "2 × O− red cells". */
export function describeItems(o: Pick<OpsOrder, 'items'>) {
  return o.items.map((i) => `${i.units} × ${i.group.replace('-', '−')} ${COMPONENTS[i.component].short.toLowerCase()}`).join(' + ')
}

export function hospitalName(o: Pick<OpsOrder, 'hospitalId'>) {
  return hospitalById(o.hospitalId)?.name ?? 'Partner hospital'
}

/** The last day's story, rebuilt from the seeded orders so the log isn't empty on first open. */
function seedActivity(orders: OpsOrder[]): OpsActivity[] {
  const out: OpsActivity[] = []
  for (const o of orders) {
    const store = shortStoreName(storeById(o.storeId))
    out.push(activity(o.cityId, 'order', `New ${PRIORITY_LABEL[o.priority].toLowerCase()} order ${o.id} · ${describeItems(o)} for ${hospitalName(o)} (${store})`, o.id, o.createdAt))
    if (o.stageAt.out_for_delivery) out.push(activity(o.cityId, 'dispatch', `${o.id} out for delivery from ${store} · ride ${o.rideMin} min`, o.id, o.stageAt.out_for_delivery))
    if (o.stageAt.delivered) out.push(activity(o.cityId, 'deliver', `${o.id} delivered to ${hospitalName(o)}`, o.id, o.stageAt.delivered))
    if (o.stageAt.rejected) out.push(activity(o.cityId, 'reject', `${o.id} rejected: ${o.reason ?? 'requisition issue'}`, o.id, o.stageAt.rejected))
  }
  return out.sort((a, b) => b.at - a.at).slice(0, MAX_ACTIVITY)
}

/** One outlet in the pilot city starts with a door-open excursion so the alert path is visible. */
function seedExcursions(now: number): Record<string, FridgeExcursion> {
  const outlet = outletsInCity('delhi')[3]
  return outlet ? { [outlet.id]: { start: now - 2 * MIN_MS, until: now + 6 * MIN_MS, peak: 3.4 } } : {}
}

export function freshDay(now: number) {
  const { orders, returns } = seedDayOrders(now, seedStaff(now))
  return { dayKey: isoDay(now), orders, returns, activity: seedActivity(orders), excursions: seedExcursions(now), lastTickAt: now }
}

function initialState(): OpsState {
  const user = getCurrentUser()
  return {
    cityId: user?.cityId ?? 'delhi',
    autopilot: true,
    surge: false,
    staffPatch: {},
    staffAdded: [],
    ...freshDay(Date.now()),
  }
}

export const useOps = create<OpsState>()(
  persist(initialState, {
    name: OPS_KEY,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    // A saved board from an earlier day: keep settings and staff edits, start today's queue fresh.
    merge: (persisted, current) => {
      const saved = (persisted ?? {}) as Partial<OpsState>
      if (saved.dayKey === current.dayKey) return { ...current, ...saved }
      return {
        ...current,
        cityId: saved.cityId ?? current.cityId,
        autopilot: saved.autopilot ?? current.autopilot,
        surge: saved.surge ?? current.surge,
        staffPatch: saved.staffPatch ?? {},
        staffAdded: saved.staffAdded ?? [],
      }
    },
  }),
)

// ---------- staff register ----------

let memo: { patch: OpsState['staffPatch']; added: StaffMember[]; base: StaffMember[]; list: StaffMember[] } | null = null

/** Seeded register with the panel's edits applied, plus anyone added. */
export function mergedStaff(patch: OpsState['staffPatch'], added: StaffMember[]): StaffMember[] {
  const base = seedStaff()
  if (memo && memo.patch === patch && memo.added === added && memo.base === base) return memo.list
  const list = [...base.map((s) => (patch[s.id] ? { ...s, ...patch[s.id] } : s)), ...added]
  memo = { patch, added, base, list }
  return list
}

export function currentStaff() {
  const s = useOps.getState()
  return mergedStaff(s.staffPatch, s.staffAdded)
}

/** Name for the audit trail: the signed-in admin. */
export function actorName() {
  return getCurrentUser()?.name ?? 'Operations admin'
}
