import { useDB } from '@/store/db'
import type { DonorProfile, Order, User } from '@/types'
import { BRAND } from '@/config/brand'
import { ApiError, latency } from './api'
import { ACTIVE_STATUSES, liveStatus } from './orders'

/**
 * Data-principal rights under India's Digital Personal Data Protection Act, 2023:
 * access (export) and erasure. A real backend would queue these as requests,
 * verify identity and keep an audit trail; the contract stays the same.
 */

export interface AccountExport {
  exportedAt: string
  service: string
  notice: string
  profile: User
  orders: Order[]
  donorBookings: DonorProfile[]
}

function requireMe() {
  const { session, users } = useDB.getState()
  const me = users.find((u) => u.id === session.userId)
  if (!me) throw new ApiError('Please sign in again.', 'auth')
  return me
}

/** Everything we hold about the signed-in user, minus credentials. */
export async function exportMyData(): Promise<AccountExport> {
  await latency(200, 450)
  const { passwordHash: _secret, ...profile } = requireMe()
  const { orders, donors } = useDB.getState()
  return {
    exportedAt: new Date().toISOString(),
    service: BRAND.name,
    notice:
      'Personal data held about you, exported at your request under the Digital Personal Data Protection Act, 2023. ' +
      'Your password is stored only as a one-way hash and is not included.',
    profile,
    orders: orders.filter((o) => o.userId === profile.id),
    donorBookings: donors.filter((d) => d.userId === profile.id),
  }
}

export interface DeletionSummary {
  removedOrders: number
  /** Orders still on the way; kept until delivery completes */
  keptActiveOrders: number
  removedBookings: number
}

/** What deleting the account would remove right now. */
export function previewDeletion(now = Date.now()): DeletionSummary {
  const { session, orders, donors } = useDB.getState()
  const mine = orders.filter((o) => o.userId === session.userId)
  const active = mine.filter((o) => ACTIVE_STATUSES.includes(liveStatus(o, now))).length
  return {
    removedOrders: mine.length - active,
    keptActiveOrders: active,
    removedBookings: donors.filter((d) => d.userId === session.userId).length,
  }
}

/**
 * Erases the account, its finished/unpaid orders and donor bookings, then signs out.
 * Deliveries in progress are kept so the hospital and rider can complete handover.
 */
export async function deleteMyAccount(): Promise<DeletionSummary> {
  await latency(500, 900)
  const me = requireMe()
  const now = Date.now()
  const summary = previewDeletion(now)
  const keep = new Set(
    useDB
      .getState()
      .orders.filter((o) => o.userId === me.id && ACTIVE_STATUSES.includes(liveStatus(o, now)))
      .map((o) => o.id),
  )
  useDB.getState()._set((s) => ({
    users: s.users.filter((u) => u.id !== me.id),
    orders: s.orders.filter((o) => o.userId !== me.id || keep.has(o.id)),
    donors: s.donors.filter((d) => d.userId !== me.id),
    session: { userId: null },
  }))
  return summary
}

/** Triggers a browser download of a JSON document. */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
