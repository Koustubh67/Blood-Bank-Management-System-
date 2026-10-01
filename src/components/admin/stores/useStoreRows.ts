import { useMemo } from 'react'
import type { OpsStore } from '@/services/admin/types'
import { useCentres } from '@/services/inventory'
import { useOps } from '@/services/admin/store'
import { fridgeOk, fridgeTemp, inventoryTotal, lowGroups, outletFor, storeInventory, useCollectionRows, useScope, useScopedStaff, type LowGroup } from '@/services/admin/hooks'
import { storesIn } from '@/services/admin/stores'
import { startOfDay } from '@/services/admin/time'

export interface StoreRow {
  store: OpsStore
  units: number
  low: LowGroup[]
  tempC?: number
  fridgeOk?: boolean
  ordersToday: number
  today: number
  mtd: number
  onShift: number
  staffTotal: number
  /** Live orders on the ops board right now */
  live: number
}

/** One row per store in the selected city, with stock, fridge, takings and staffing. */
export function useStoreRows(now: number): StoreRow[] {
  const scope = useScope()
  const centres = useCentres()
  const staff = useScopedStaff()
  const orders = useOps((s) => s.orders)
  const excursions = useOps((s) => s.excursions)
  const monthDays = new Date(now).getDate()
  const rows = useCollectionRows(monthDays, now)

  return useMemo(() => {
    const today = startOfDay(now)
    const money = new Map<string, { today: number; orders: number; mtd: number }>()
    for (const r of rows) {
      const m = money.get(r.storeId) ?? { today: 0, orders: 0, mtd: 0 }
      m.mtd += r.total
      if (r.day >= today) {
        m.today += r.total
        m.orders += r.orders
      }
      money.set(r.storeId, m)
    }
    const people = new Map<string, { on: number; all: number }>()
    for (const m of staff) {
      if (m.status === 'inactive') continue
      const p = people.get(m.storeId) ?? { on: 0, all: 0 }
      p.all++
      if (m.status === 'on_shift') p.on++
      people.set(m.storeId, p)
    }
    const live = new Map<string, number>()
    for (const o of orders) if (['incoming', 'verifying', 'packing', 'ready', 'out_for_delivery'].includes(o.stage)) live.set(o.storeId, (live.get(o.storeId) ?? 0) + 1)

    return storesIn(scope).map((store) => {
      const inv = storeInventory(store, centres)
      const outlet = outletFor(store)
      const temp = outlet ? fridgeTemp(outlet, centres.find((c) => c.id === outlet.motherCentreId), now, excursions[store.id]).tempC : undefined
      const m = money.get(store.id)
      const p = people.get(store.id)
      return {
        store,
        units: inventoryTotal(inv),
        low: lowGroups(inv),
        tempC: temp,
        fridgeOk: temp === undefined ? undefined : fridgeOk(temp),
        ordersToday: m?.orders ?? 0,
        today: m?.today ?? 0,
        mtd: m?.mtd ?? 0,
        onShift: p?.on ?? 0,
        staffTotal: p?.all ?? 0,
        live: live.get(store.id) ?? 0,
      }
    })
  }, [scope, centres, staff, orders, excursions, rows, now])
}
