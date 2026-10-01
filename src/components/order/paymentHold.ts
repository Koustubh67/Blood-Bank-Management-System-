/**
 * Payment session ("units held while you pay") bookkeeping.
 *
 * The deadline lives in sessionStorage per order so a reload, or a round
 * trip through the payment-failed screen, keeps the same countdown.
 * Production: the server would reserve stock and return this expiry.
 */
export const HOLD_MS = 10 * 60_000

const key = (orderId: string) => `rf-pay-hold-${orderId}`

export function readHold(orderId: string): number | null {
  try {
    const v = Number(sessionStorage.getItem(key(orderId)))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

export function startHold(orderId: string, now = Date.now()): number {
  const deadline = now + HOLD_MS
  try {
    sessionStorage.setItem(key(orderId), String(deadline))
  } catch {
    /* storage blocked: the countdown just won't survive a reload */
  }
  return deadline
}

/** Existing deadline (even if already expired) or a fresh one. */
export function ensureHold(orderId: string): number {
  return readHold(orderId) ?? startHold(orderId)
}

export function clearHold(orderId: string) {
  try {
    sessionStorage.removeItem(key(orderId))
  } catch {
    /* ignore */
  }
}
