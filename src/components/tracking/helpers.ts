import type { DeliveryPlan, Order, OrderStatus, User } from '@/types'
import { BRAND } from '@/config/brand'
import { clamp } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'

/** Offset (ms after placedAt, simulated clock) at which a stage begins. */
export function stageOffset(plan: DeliveryPlan, key: OrderStatus): number {
  switch (key) {
    case 'verified':
      return plan.verifyAt
    case 'packed':
      return plan.packAt
    case 'dispatched':
      return plan.dispatchAt
    case 'arriving':
      return plan.dispatchAt + (plan.arriveAt - plan.dispatchAt) * 0.8
    case 'delivered':
      return plan.deliverAt
    default:
      return 0
  }
}

/** Wall-clock time a stage happened, or is expected to happen. */
export function stageClock(order: Order, key: OrderStatus): number | null {
  if (!order.placedAt || !order.plan) return null
  return order.placedAt + stageOffset(order.plan, key) - order.simOffsetMs
}

/** Simulated ms since the order was placed. */
export function elapsedMs(order: Order, now: number) {
  return order.placedAt ? now - order.placedAt + order.simOffsetMs : 0
}

/** ms until the rider reaches the hospital. */
export function etaMs(order: Order, now: number) {
  return order.plan ? Math.max(0, order.plan.arriveAt - elapsedMs(order, now)) : 0
}

/** 0..1 across the whole journey, from payment to handover. */
export function journeyProgress(order: Order, now: number) {
  return order.plan ? clamp(elapsedMs(order, now) / order.plan.deliverAt, 0, 1) : 0
}

/** "Ananya Sharma" -> "A**** S****" */
export function maskName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w.charAt(0).toUpperCase()}****`)
    .join(' ')
}

/** Who may see the handover OTP and cancel: the orderer, or the receiving hospital. */
export function isOrderOwner(order: Order, user: User | null) {
  if (!user) return false
  return order.userId === user.id || (user.role === 'hospital' && user.hospitalId === order.hospitalId)
}

export function paidRecord(order: Order) {
  return [...order.payments].reverse().find((p) => p.status === 'success')
}

export const PRIORITY_META = {
  emergency: { label: 'Emergency', tone: 'red' as const },
  urgent: { label: 'Urgent', tone: 'amber' as const },
  scheduled: { label: 'Scheduled', tone: 'neutral' as const },
}

/** Native share sheet where available, clipboard otherwise. */
export async function shareTrackingLink(orderId: string) {
  const url = `${window.location.origin}/track/${orderId}`
  const data = { title: `${BRAND.name} · ${orderId}`, text: `Live tracking for blood delivery ${orderId}`, url }
  if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data)
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Tracking link copied', 'Anyone with the link can follow the delivery. Patient details stay masked.')
  } catch {
    toast.error('Could not copy the link', url)
  }
}
