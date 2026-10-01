import type { BloodGroup, Priority } from '@/types'
import type { OpsOrder, OpsStage } from './types'

/**
 * Priority score: who gets packed and dispatched first when there are more
 * orders than hands. Higher is sooner. Every part is shown on the board's
 * "How priority works" panel, so the numbers here are the documentation.
 */

export const BASE_SCORE: Record<Priority, number> = { emergency: 100, urgent: 60, scheduled: 20 }

/** Points per minute waiting for dispatch. Steeper for sicker patients so a long wait never outranks a fresh emergency. */
export const WAIT_WEIGHT: Record<Priority, number> = { emergency: 4, urgent: 2, scheduled: 0.5 }

export const RARE_GROUPS: BloodGroup[] = ['O-', 'A-', 'B-', 'AB-']
export const RARE_BONUS = 15
/** Platelets keep only 5 days and must not sit off the agitator */
export const SHELF_BONUS = 10
export const AT_RISK_BONUS = 25
export const BREACH_BONUS = 50

/** Dispatch targets, measured from the moment the order is placed. */
export const SLA_MIN: Record<Priority, number> = { emergency: 10, urgent: 30, scheduled: 120 }
/** An order is "at risk" once less than this share of its target is left. */
export const AT_RISK_SHARE = 0.3

export const PRIORITY_LABEL: Record<Priority, string> = { emergency: 'Emergency', urgent: 'Urgent', scheduled: 'Scheduled' }
export const PRIORITY_ORDER: Priority[] = ['emergency', 'urgent', 'scheduled']

export const STAGE_LABEL: Record<OpsStage, string> = {
  incoming: 'Incoming',
  verifying: 'Verifying',
  packing: 'Packing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const ACTIVE_STAGES: OpsStage[] = ['incoming', 'verifying', 'packing', 'ready', 'out_for_delivery']
const PRE_DISPATCH: OpsStage[] = ['incoming', 'verifying', 'packing', 'ready']

export function isActive(o: OpsOrder) {
  return ACTIVE_STAGES.includes(o.stage)
}

export function isPreDispatch(o: OpsOrder) {
  return PRE_DISPATCH.includes(o.stage)
}

export function isClosed(o: OpsOrder) {
  return o.stage === 'delivered' || o.stage === 'rejected' || o.stage === 'cancelled'
}

export type SlaState = 'ok' | 'risk' | 'breached' | 'met' | 'missed' | 'closed'

export interface SlaInfo {
  state: SlaState
  targetMs: number
  /** Time left to dispatch (negative once late). Frozen at dispatch. */
  leftMs: number
  /** 0..1+ share of the target used */
  used: number
}

export function sla(o: OpsOrder, now: number): SlaInfo {
  const targetMs = SLA_MIN[o.priority] * 60_000
  const dispatchedAt = o.stageAt.out_for_delivery
  if (dispatchedAt) {
    const took = dispatchedAt - o.createdAt
    return { state: took <= targetMs ? 'met' : 'missed', targetMs, leftMs: targetMs - took, used: took / targetMs }
  }
  if (o.stage === 'rejected' || o.stage === 'cancelled') return { state: 'closed', targetMs, leftMs: 0, used: 0 }
  const leftMs = o.createdAt + targetMs - now
  const used = (now - o.createdAt) / targetMs
  return { state: leftMs < 0 ? 'breached' : leftMs < targetMs * AT_RISK_SHARE ? 'risk' : 'ok', targetMs, leftMs, used }
}

export interface ScorePart {
  label: string
  points: number
}

export function scoreParts(o: OpsOrder, now: number): ScorePart[] {
  const end = o.stageAt.out_for_delivery ?? now
  const waitMin = Math.max(0, (end - o.createdAt) / 60_000)
  const parts: ScorePart[] = [
    { label: `${PRIORITY_LABEL[o.priority]} base`, points: BASE_SCORE[o.priority] },
    { label: `${Math.floor(waitMin)} min waiting × ${WAIT_WEIGHT[o.priority]}`, points: Math.round(waitMin * WAIT_WEIGHT[o.priority]) },
  ]
  const rare = o.items.find((i) => RARE_GROUPS.includes(i.group))
  if (rare) parts.push({ label: `Rare group ${rare.group.replace('-', '−')}`, points: RARE_BONUS })
  if (o.items.some((i) => i.component === 'PLT')) parts.push({ label: 'Platelets: short shelf life', points: SHELF_BONUS })
  const s = sla(o, now)
  if (s.state === 'breached') parts.push({ label: 'Dispatch target missed', points: BREACH_BONUS })
  else if (s.state === 'risk') parts.push({ label: 'Close to dispatch target', points: AT_RISK_BONUS })
  return parts
}

export function priorityScore(o: OpsOrder, now: number) {
  return scoreParts(o, now).reduce((s, p) => s + p.points, 0)
}

/** Highest score first; ties go to the older order. */
export function byScore(now: number) {
  return (a: OpsOrder, b: OpsOrder) => priorityScore(b, now) - priorityScore(a, now) || a.createdAt - b.createdAt
}

/**
 * In surge mode, scheduled orders that are nowhere near their target step
 * aside so riders go to emergencies first.
 */
export const DEFER_IF_MORE_THAN_MIN = 45

export function isDeferred(o: OpsOrder, surge: boolean, now: number) {
  if (!surge || o.priority !== 'scheduled' || !isPreDispatch(o)) return false
  return sla(o, now).leftMs > DEFER_IF_MORE_THAN_MIN * 60_000
}
