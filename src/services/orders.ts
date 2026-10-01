import { useMemo } from 'react'
import { useDB } from '@/store/db'
import type {
  BloodCentre,
  DeliveryPlan,
  LatLng,
  Order,
  OrderItem,
  OrderStatus,
  PatientDetails,
  PaymentRecord,
  PrescriberDetails,
  PriceBreakdown,
  Priority,
  Rider,
} from '@/types'
import { COMPONENTS } from '@/data/blood'
import { hospitalById } from '@/data/network'
import { FEES } from '@/config/brand'
import { distanceMeters, hashString, orderId, otp4 } from '@/lib/utils'
import { ApiError, latency } from './api'
import { getCurrentUser } from './auth'

// ---------- pricing ----------

export function quote(items: OrderItem[]): PriceBreakdown {
  const processing = items.reduce((sum, i) => sum + COMPONENTS[i.component].processingCharge * i.units, 0)
  const logistics = items.length ? FEES.logistics : 0
  const logisticsGst = Math.round(logistics * FEES.logisticsGstRate)
  return { processing, logistics, logisticsGst, total: processing + logistics + logisticsGst }
}

// ---------- centre matching ----------

export interface CentreMatch {
  centre: BloodCentre
  distanceM: number
  /** True when the centre can supply every line in full */
  fulfillable: boolean
  shortages: { item: OrderItem; available: number }[]
}

/** Centres sorted so the nearest one that can fulfil the whole order comes first. */
export function rankCentres(items: OrderItem[], destination: LatLng, centres: BloodCentre[]): CentreMatch[] {
  return centres
    .map((centre) => {
      const shortages = items
        .map((item) => ({ item, available: centre.inventory[item.group][item.component] }))
        .filter((s) => s.available < s.item.units)
      return {
        centre,
        distanceM: distanceMeters(centre.location, destination),
        fulfillable: shortages.length === 0,
        shortages,
      }
    })
    .sort((a, b) => Number(b.fulfillable) - Number(a.fulfillable) || a.distanceM - b.distanceM)
}

// ---------- delivery plan ----------

const ROAD_FACTOR = 1.35
const PLAN_BY_PRIORITY: Record<Priority, { verify: number; pack: number; dispatch: number; kmh: number }> = {
  emergency: { verify: 40_000, pack: 150_000, dispatch: 180_000, kmh: 32 },
  urgent: { verify: 90_000, pack: 360_000, dispatch: 420_000, kmh: 28 },
  scheduled: { verify: 120_000, pack: 600_000, dispatch: 900_000, kmh: 28 },
}
const HANDOVER_MS = 60_000

export function buildPlan(priority: Priority, from: LatLng, to: LatLng): DeliveryPlan {
  const p = PLAN_BY_PRIORITY[priority]
  const distanceM = Math.round(distanceMeters(from, to) * ROAD_FACTOR)
  const rideMs = Math.round((distanceM / 1000 / p.kmh) * 3_600_000)
  const arriveAt = p.dispatch + rideMs
  return {
    distanceM,
    verifyAt: p.verify,
    packAt: p.pack,
    dispatchAt: p.dispatch,
    arriveAt,
    deliverAt: arriveAt + HANDOVER_MS,
  }
}

/** Ride time in whole minutes between two points at the speed used for this priority. */
export function rideMinutes(from: LatLng, to: LatLng, priority: Priority = 'emergency') {
  const km = (distanceMeters(from, to) * ROAD_FACTOR) / 1000
  return Math.max(1, Math.round((km / PLAN_BY_PRIORITY[priority].kmh) * 60))
}

const RIDERS: Rider[] = [
  { name: 'Imran Qureshi', phone: '+91 98•••• 4210', vehicle: 'EV scooter · DL 3S EV 4821', rating: 4.9 },
  { name: 'Priya Nair', phone: '+91 97•••• 1187', vehicle: 'EV scooter · DL 8S EV 1190', rating: 4.95 },
  { name: 'Gurpreet Singh', phone: '+91 99•••• 7702', vehicle: 'Bike · DL 5S AB 7702', rating: 4.8 },
  { name: 'Ananya Das', phone: '+91 96•••• 3349', vehicle: 'EV scooter · DL 1S EV 3349', rating: 4.9 },
  { name: 'Rohit Meena', phone: '+91 95•••• 6615', vehicle: 'Bike · DL 7S CD 6615', rating: 4.85 },
]

// ---------- live status ----------

/**
 * Status as of `now`. Stored status only records payment/cancellation; the
 * delivery stages are derived from the plan so every tab agrees without a
 * background writer.
 */
export function liveStatus(order: Order, now = Date.now()): OrderStatus {
  if (order.status !== 'placed' || !order.placedAt || !order.plan) return order.status
  const t = now - order.placedAt + order.simOffsetMs
  const p = order.plan
  if (t >= p.deliverAt) return 'delivered'
  if (t >= p.dispatchAt + (p.arriveAt - p.dispatchAt) * 0.8) return 'arriving'
  if (t >= p.dispatchAt) return 'dispatched'
  if (t >= p.packAt) return 'packed'
  if (t >= p.verifyAt) return 'verified'
  return 'placed'
}

export const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'verified', 'packed', 'dispatched', 'arriving']

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  payment_failed: 'Payment failed',
  placed: 'Order placed',
  verified: 'Requisition verified',
  packed: 'Packed in cold box',
  dispatched: 'Out for delivery',
  arriving: 'Arriving now',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// ---------- commands ----------

export interface OrderDraft {
  priority: Priority
  items: OrderItem[]
  patient: PatientDetails
  prescriber: PrescriberDetails
  hospitalId: string
  consent: Order['consent']
  notes?: string
}

export async function createOrder(draft: OrderDraft): Promise<Order> {
  await latency()
  const user = getCurrentUser()
  if (!user) throw new ApiError('Please sign in to place an order.', 'auth')
  if (!draft.items.length || draft.items.some((i) => i.units < 1))
    throw new ApiError('Add at least one blood component.')
  if (draft.items.some((i) => i.units > 10)) throw new ApiError('For more than 10 units per line, call our hospital desk.')
  if (!draft.consent.prescription || !draft.consent.transfusionAtFacility || !draft.consent.terms)
    throw new ApiError('All declarations must be accepted to continue.')
  if (!draft.prescriber.requisitionFileName) throw new ApiError("Upload the doctor's blood requisition form.")

  const hospital = hospitalById(user.role === 'hospital' && user.hospitalId ? user.hospitalId : draft.hospitalId)
  if (!hospital) throw new ApiError('We deliver only to registered partner hospitals. Please select one.')

  // Units come from centres in the hospital's own city only.
  const match = rankCentres(draft.items, hospital.location, useDB.getState().centres.filter((c) => c.cityId === hospital.cityId))[0]
  if (!match?.fulfillable)
    throw new ApiError('These units are not in stock at any nearby centre right now. Our team will call you.', 'stock')

  const order: Order = {
    id: orderId(),
    userId: user.id,
    role: user.role,
    priority: draft.priority,
    items: draft.items,
    patient: draft.patient,
    prescriber: draft.prescriber,
    hospitalId: hospital.id,
    centreId: match.centre.id,
    consent: draft.consent,
    price: quote(draft.items),
    status: 'pending_payment',
    payments: [],
    handoverOtp: otp4(),
    createdAt: Date.now(),
    simOffsetMs: 0,
    notes: draft.notes,
  }
  useDB.getState()._set((s) => ({ orders: [order, ...s.orders] }))
  return order
}

function patchOrder(id: string, fn: (o: Order) => Order) {
  let updated: Order | undefined
  useDB.getState()._set((s) => ({
    orders: s.orders.map((o) => {
      if (o.id !== id) return o
      updated = fn(o)
      return updated
    }),
  }))
  if (!updated) throw new ApiError('Order not found.', 'not_found')
  return updated
}

export function getOrder(id: string) {
  return useDB.getState().orders.find((o) => o.id === id)
}

/** Called by the payment service after the gateway confirms the charge. */
export function recordPaymentSuccess(id: string, payment: PaymentRecord): Order {
  const existing = getOrder(id)
  if (!existing) throw new ApiError('Order not found.', 'not_found')
  if (existing.status === 'placed') return existing

  const { centres } = useDB.getState()
  const hospital = hospitalById(existing.hospitalId)!
  // Re-match at payment time: stock may have moved while the user was paying.
  const match = rankCentres(existing.items, hospital.location, centres)[0]
  if (!match?.fulfillable) throw new ApiError('Stock changed during payment. You have not been charged twice; contact support.')

  useDB.getState()._set((s) => ({
    centres: s.centres.map((c) => {
      if (c.id !== match.centre.id) return c
      const inventory = structuredClone(c.inventory)
      for (const i of existing.items) inventory[i.group][i.component] -= i.units
      return { ...c, inventory }
    }),
  }))

  return patchOrder(id, (o) => ({
    ...o,
    status: 'placed',
    centreId: match.centre.id,
    placedAt: Date.now(),
    plan: buildPlan(o.priority, match.centre.location, hospital.location),
    rider: RIDERS[hashString(o.id) % RIDERS.length],
    payments: [...o.payments, payment],
  }))
}

export function recordPaymentFailure(id: string, payment: PaymentRecord): Order {
  return patchOrder(id, (o) => ({ ...o, status: 'payment_failed', payments: [...o.payments, payment] }))
}

export function canCancel(order: Order, now = Date.now()) {
  const s = liveStatus(order, now)
  return s === 'pending_payment' || s === 'payment_failed' || s === 'placed' || s === 'verified'
}

export async function cancelOrder(id: string, reason: string): Promise<Order> {
  await latency()
  const order = getOrder(id)
  if (!order) throw new ApiError('Order not found.', 'not_found')
  if (!canCancel(order)) throw new ApiError('This order is already packed or on the way. Please call support to stop it.')

  const wasPaid = order.status === 'placed'
  if (wasPaid) {
    // Units go back to the shelf: they never left the centre's cold storage.
    useDB.getState()._set((s) => ({
      centres: s.centres.map((c) => {
        if (c.id !== order.centreId) return c
        const inventory = structuredClone(c.inventory)
        for (const i of order.items) inventory[i.group][i.component] += i.units
        return { ...c, inventory }
      }),
    }))
  }
  return patchOrder(id, (o) => ({ ...o, status: 'cancelled', cancelledAt: Date.now(), cancelReason: reason }))
}

/** Demo helper: skip the simulated clock forward for one order. */
export function fastForward(id: string, ms: number) {
  patchOrder(id, (o) => ({ ...o, simOffsetMs: o.simOffsetMs + ms }))
}

// ---------- hooks ----------

export function useOrder(id: string | undefined) {
  return useDB((s) => s.orders.find((o) => o.id === id))
}

/** Orders visible to the signed-in user. Hospitals see every order delivered to their facility. */
export function useMyOrders() {
  const userId = useDB((s) => s.session.userId)
  const users = useDB((s) => s.users)
  const orders = useDB((s) => s.orders)
  return useMemo(() => {
    const me = users.find((u) => u.id === userId)
    if (!me) return []
    return orders.filter((o) => o.userId === me.id || (me.role === 'hospital' && o.hospitalId === me.hospitalId))
  }, [orders, users, userId])
}
