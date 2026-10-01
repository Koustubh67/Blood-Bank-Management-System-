import type { BloodGroup, ComponentCode, OrderItem, PaymentMethod, PartnerHospital, Priority } from '@/types'
import type { OpsOrder, OpsStage, RiderReturn, StaffMember } from './types'
import { CITIES } from '@/data/cities'
import { hospitalById, hospitalsInCity } from '@/data/network'
import { quote, rideMinutes } from '@/services/orders'
import { distanceMeters, hashString, seeded } from '@/lib/utils'
import { ALL_INDIA, storesIn } from './stores'
import { patientLabel, staffName } from './names'
import { AUTO_MS, HANDOVER_MS, MIN_MS, PICKUP_MS, RETURN_FACTOR, isoDay } from './time'

type Rand = () => number

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function opsId(rand: Rand) {
  let s = 'RF-'
  for (let i = 0; i < 6; i++) s += ID_ALPHABET[Math.floor(rand() * ID_ALPHABET.length)]
  return s
}

/** Weighted towards common groups, with rare negatives a little over-represented (they are what hospitals call about). */
const GROUP_WEIGHTS: [BloodGroup, number][] = [
  ['O+', 0.3],
  ['B+', 0.26],
  ['A+', 0.19],
  ['AB+', 0.07],
  ['O-', 0.06],
  ['B-', 0.045],
  ['A-', 0.04],
  ['AB-', 0.035],
]

function weighted<T>(rand: Rand, list: [T, number][]): T {
  let r = rand() * list.reduce((s, [, w]) => s + w, 0)
  for (const [v, w] of list) {
    r -= w
    if (r <= 0) return v
  }
  return list[list.length - 1][0]
}

function basket(rand: Rand, priority: Priority): OrderItem[] {
  const group = weighted(rand, GROUP_WEIGHTS)
  const line = (component: ComponentCode, units: number, g: BloodGroup = group): OrderItem => ({ component, group: g, units })
  const r = rand()
  if (priority === 'emergency') {
    if (r < 0.55) return [line('PRBC', 1 + Math.floor(rand() * 3))]
    if (r < 0.8) return [line('PRBC', 2), line('FFP', 2)]
    return [line('WB', 1 + Math.floor(rand() * 2))]
  }
  if (priority === 'urgent') {
    if (r < 0.4) return [line('PLT', 4 + Math.floor(rand() * 3))]
    if (r < 0.85) return [line('PRBC', 1 + Math.floor(rand() * 2))]
    return [line('FFP', 2 + Math.floor(rand() * 3))]
  }
  if (r < 0.5) return [line('PRBC', 2), line('FFP', 2)]
  if (r < 0.75) return [line('CRYO', 4 + Math.floor(rand() * 4))]
  return [line('PRBC', 1 + Math.floor(rand() * 2))]
}

const METHODS: [PaymentMethod, number][] = [
  ['credit', 0.42],
  ['upi', 0.28],
  ['netbanking', 0.18],
  ['card', 0.12],
]

const WARDS = ['ICU', 'Emergency', 'OT', 'Labour room', 'Oncology', 'Paediatrics', 'Ward']
const SURNAME_INITIAL = 'ABCDGHJKMNPRSTV'

export interface NewOrderOptions {
  createdAt: number
  priority?: Priority
  /** Send the order to this hospital (rush-hour hotspots) */
  hospital?: PartnerHospital
  rush?: boolean
}

/**
 * One realistic hospital order: the nearest store to the hospital (sometimes
 * the second nearest, as when the first is short of a group), a basket that
 * fits the priority, and the real price from `quote`.
 */
export function makeOrder(rand: Rand, cityId: string, opts: NewOrderOptions): OpsOrder {
  const hospitals = hospitalsInCity(cityId)
  const hospital = opts.hospital ?? hospitals[Math.floor(rand() * hospitals.length)]
  const ranked = storesIn(cityId)
    .map((s) => ({ s, d: distanceMeters(s.location, hospital.location) }))
    .sort((a, b) => a.d - b.d)
  const store = (rand() < 0.75 || ranked.length < 2 ? ranked[0] : ranked[1]).s
  const priority = opts.priority ?? weighted<Priority>(rand, [['emergency', 0.3], ['urgent', 0.42], ['scheduled', 0.28]])
  const items = basket(rand, priority)
  const age = 4 + Math.floor(rand() * 80)
  const sex = rand() < 0.5 ? 'F' : 'M'
  const id = opsId(rand)
  return {
    id,
    source: 'ops',
    cityId,
    storeId: store.id,
    hospitalId: hospital.id,
    items,
    priority,
    createdAt: opts.createdAt,
    stage: 'incoming',
    stageAt: { incoming: opts.createdAt },
    rideMin: rideMinutes(store.location, hospital.location, priority),
    distanceM: Math.round(distanceMeters(store.location, hospital.location) * 1.35),
    method: weighted(rand, METHODS),
    price: quote(items),
    otp: String(1000 + Math.floor(rand() * 9000)),
    patient: `${patientLabel(rand, cityId)}, ${age} ${sex}`,
    ward: `${WARDS[Math.floor(rand() * WARDS.length)]}-${1 + Math.floor(rand() * 9)}`,
    doctor: `Dr. ${staffName(rand, cityId).replace(/ \S+$/, ` ${SURNAME_INITIAL[Math.floor(rand() * SURNAME_INITIAL.length)]}.`)}`,
    doctorReg: `${store.rto}MC/R/${10000 + Math.floor(rand() * 89999)} (demo)`,
    requisition: `requisition-${id.slice(3).toLowerCase()}.pdf`,
    rush: opts.rush,
    audit: [{ at: opts.createdAt, actor: 'Hospital desk', action: 'Order placed', detail: hospital.name }],
  }
}

/** A random city for All India arrivals, weighted by how many stores it has. */
export function randomCity(rand: Rand) {
  const weights = CITIES.map((c): [string, number] => [c.id, storesIn(c.id).length * (c.id === 'delhi' ? 2 : 1)])
  return weighted(rand, weights)
}

export function arrivalCity(scope: string, rand: Rand) {
  return scope === ALL_INDIA ? randomCity(rand) : scope
}

// ---------- today's seed ----------

interface Timeline {
  order: OpsOrder
  /** Rider busy until (delivery + ride back) */
  busyUntil?: number
  ret?: RiderReturn
}

/**
 * Plays one order forward at the normal pace from its creation to `until`,
 * taking a free rider from its store when it is packed.
 */
function playForward(o: OpsOrder, rand: Rand, until: number, freeRider: (at: number) => StaffMember | undefined): Timeline {
  const a = AUTO_MS[o.priority]
  let t = o.createdAt
  const steps: [OpsStage, number][] = [
    ['verifying', a.incoming],
    ['packing', a.verifying],
    ['ready', a.packing],
  ]
  for (const [stage, ms] of steps) {
    t += ms * (0.7 + rand() * 1.3)
    if (t > until) return { order: o }
    o.stage = stage
    o.stageAt[stage] = t
  }
  const rider = freeRider(t)
  if (!rider) return { order: o }
  const assignedAt = t + rand() * MIN_MS
  if (assignedAt > until) return { order: o }
  o.riderId = rider.id
  o.assignedAt = assignedAt
  o.pickupAt = assignedAt + PICKUP_MS
  o.audit.push({ at: assignedAt, actor: 'Autopilot', action: 'Rider assigned', detail: rider.name })
  const rideMs = o.rideMin * MIN_MS
  const back = rideMs * RETURN_FACTOR
  if (o.pickupAt > until) return { order: o, busyUntil: Infinity }
  o.stage = 'out_for_delivery'
  o.stageAt.out_for_delivery = o.pickupAt
  const deliverAt = o.pickupAt + rideMs + HANDOVER_MS
  if (deliverAt > until) return { order: o, busyUntil: Infinity }
  o.stage = 'delivered'
  o.stageAt.delivered = deliverAt
  o.audit.push({ at: deliverAt, actor: 'Autopilot', action: 'Delivered', detail: 'OTP confirmed at the blood bank desk' })
  const hospital = hospitalById(o.hospitalId)
  const ret = hospital && deliverAt + back > until ? { from: hospital.location, start: deliverAt, until: deliverAt + back } : undefined
  return { order: o, busyUntil: deliverAt + back, ret }
}

/**
 * Today's queue for every city: a few delivered earlier, the rest in flight
 * at different stages. Seeded per day and city so a reload shows the same board.
 */
export function seedDayOrders(now: number, staff: StaffMember[]) {
  const orders: OpsOrder[] = []
  const returns: Record<string, RiderReturn> = {}
  const day = isoDay(now)
  const riders = staff.filter((s) => s.role === 'rider' && s.status === 'on_shift')

  for (const city of CITIES) {
    const rand = seeded(hashString(`ops:${day}:${city.id}`))
    const storeCount = storesIn(city.id).length
    const activeCount = city.id === 'delhi' ? 11 : 1 + Math.floor(rand() * Math.min(4, storeCount / 1.5))
    const doneCount = city.id === 'delhi' ? 6 : rand() < 0.7 ? 2 : 1
    const busyUntil = new Map<string, number>()
    const plans: { createdAt: number; priority?: Priority; stuck: boolean; reject: boolean }[] = []

    for (let i = 0; i < doneCount; i++) plans.push({ createdAt: now - (60 + rand() * 300) * MIN_MS, stuck: false, reject: rand() < 0.1 })
    for (let i = 0; i < activeCount; i++) {
      const priority = weighted<Priority>(rand, [['emergency', 0.3], ['urgent', 0.42], ['scheduled', 0.28]])
      const maxAge = priority === 'emergency' ? 9 : priority === 'urgent' ? 26 : 70
      plans.push({ createdAt: now - (0.5 + rand() * maxAge) * MIN_MS, priority, stuck: rand() < 0.18, reject: false })
    }
    plans.sort((x, y) => x.createdAt - y.createdAt)

    for (const p of plans) {
      const o = makeOrder(rand, city.id, { createdAt: Math.round(p.createdAt), priority: p.priority })
      if (p.stuck) {
        // Waiting on a person: the requisition needs a second look.
        orders.push(o)
        continue
      }
      if (p.reject) {
        // A few close without delivery, as on any real day.
        const at = o.createdAt + 2 * MIN_MS
        const reason = 'Requisition unsigned by the treating doctor'
        orders.push({
          ...o,
          stage: 'rejected',
          stageAt: { incoming: o.createdAt, verifying: o.createdAt + MIN_MS, rejected: at },
          reason,
          refund: o.price.total,
          audit: [...o.audit, { at, actor: 'Lab technician', action: 'Requisition rejected', detail: reason }],
        })
        continue
      }
      const storeRiders = riders.filter((r) => r.storeId === o.storeId)
      const t = playForward(o, rand, now, (at) => storeRiders.find((r) => (busyUntil.get(r.id) ?? 0) <= at))
      if (t.order.riderId && t.busyUntil !== undefined) busyUntil.set(t.order.riderId, t.busyUntil)
      if (t.order.riderId && t.ret) returns[t.order.riderId] = t.ret
      orders.push(t.order)
    }
  }
  return { orders, returns }
}
