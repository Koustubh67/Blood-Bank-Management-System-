import { useMemo } from 'react'
import { create } from 'zustand'
import type { OpsOrder } from '@/services/admin/types'
import { useOps } from '@/services/admin/store'
import { appToOps } from '@/services/admin/hooks'
import { useDB } from '@/store/db'

/**
 * Which order drawer or action dialog is open. Kept outside the pages so any
 * screen (board, dispatch, overview, store drawer) can open the same ones.
 */
export type ActionKind = 'verify' | 'assign' | 'deliver' | 'priority' | 'cancel'

interface OrderUi {
  detailId: string | null
  action: { kind: ActionKind; orderId: string } | null
}

export const useOrderUi = create<OrderUi>(() => ({ detailId: null, action: null }))

export const openOrder = (id: string) => useOrderUi.setState({ detailId: id })
export const closeOrder = () => useOrderUi.setState({ detailId: null })
export const openAction = (kind: ActionKind, orderId: string) => useOrderUi.setState({ action: { kind, orderId } })
export const closeAction = () => useOrderUi.setState({ action: null })

/** One order by id from either source, whatever city is selected. */
export function useOrderById(id: string | null | undefined, now: number): OpsOrder | undefined {
  const ops = useOps((s) => (id ? s.orders.find((o) => o.id === id) : undefined))
  const app = useDB((s) => (id && !ops ? s.orders.find((o) => o.id === id) : undefined))
  return useMemo(() => ops ?? (app ? (appToOps(app, now) ?? undefined) : undefined), [ops, app, now])
}
