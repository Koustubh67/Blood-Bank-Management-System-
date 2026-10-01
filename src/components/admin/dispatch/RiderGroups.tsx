import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import type { OpsOrder, OpsStore } from '@/services/admin/types'
import type { RiderView } from '@/services/admin/dispatch'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { hospitalName } from '@/services/admin/store'
import { shortStoreName, STORE_KIND_LABEL } from '@/services/admin/stores'
import { shortName } from '@/services/admin/names'
import { Avatar, MoreButton, RiderStateChip, Tag } from '../ui'
import { openOrder } from '../orders/state'

const VEHICLE = { ev_scooter: 'EV scooter', bike: 'Bike' } as const

const AVATAR_TONE: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-700',
  to_pickup: 'bg-amber-50 text-amber-800',
  on_the_way: 'bg-blood-600 text-white',
  returning: 'bg-ice-50 text-ice-700',
}

function RiderRow({ v }: { v: RiderView }) {
  const r = v.rider
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={r.name} tone={AVATAR_TONE[v.state] ?? 'bg-ink-100 text-ink-500'} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-ink-950">{r.name}</span>
            <RiderStateChip state={v.state} />
          </p>
          <p className="truncate text-xs text-ink-500">
            {r.vehicleType ? VEHICLE[r.vehicleType] : 'Rider'} · {r.vehicleReg}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3 pl-12 sm:w-[46%] sm:pl-0">
        <div className="min-w-0 flex-1 text-xs">
          {v.order ? (
            <button type="button" onClick={() => openOrder(v.order!.id)} className="block w-full min-w-0 text-left">
              <span className="block truncate font-medium text-ink-800 hover:text-blood-700">
                <span className="font-mono">{v.order.id}</span> → {hospitalName(v.order)}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                  <span className={cn('block h-full rounded-full transition-[width] duration-1000 ease-linear', v.state === 'on_the_way' ? 'bg-blood-600' : 'bg-amber-500')} style={{ width: `${v.progress * 100}%` }} />
                </span>
                <span className="shrink-0 text-ink-500 tabular">{v.etaMs ? `${v.state === 'to_pickup' ? 'pickup' : 'ETA'} ${formatDuration(v.etaMs)}` : 'at desk'}</span>
              </span>
            </button>
          ) : v.state === 'returning' ? (
            <span className="text-ink-500">Back at the store in {formatDuration(v.etaMs ?? 0)}</span>
          ) : (
            <span className="text-ink-400">No current order</span>
          )}
        </div>
        <div className="w-16 shrink-0 text-right text-xs">
          <span className="block font-semibold text-ink-950 tabular">{v.todayCount} today</span>
          <span className="inline-flex items-center gap-0.5 text-ink-500">
            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden /> {r.rating?.toFixed(2)}
          </span>
        </div>
      </div>
    </li>
  )
}

export interface StoreGroup {
  store: OpsStore
  riders: RiderView[]
  waiting: OpsOrder[]
}

export function groupByStore(views: RiderView[], waiting: OpsOrder[]): StoreGroup[] {
  const map = new Map<string, StoreGroup>()
  for (const v of views) {
    const g = map.get(v.store.id) ?? { store: v.store, riders: [], waiting: [] }
    g.riders.push(v)
    map.set(v.store.id, g)
  }
  for (const o of waiting) map.get(o.storeId)?.waiting.push(o)
  const busy = (g: StoreGroup) => g.riders.filter((v) => v.state === 'to_pickup' || v.state === 'on_the_way').length
  return [...map.values()].sort((a, b) => b.waiting.length - a.waiting.length || busy(b) - busy(a) || a.store.name.localeCompare(b.store.name))
}

const ORDER = ['on_the_way', 'to_pickup', 'returning', 'available']

function StoreBlock({ g }: { g: StoreGroup }) {
  const active = g.riders.filter((v) => ORDER.includes(v.state)).sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state))
  const off = g.riders.filter((v) => !ORDER.includes(v.state))
  const free = active.filter((v) => v.state === 'available').length
  return (
    <section aria-label={shortStoreName(g.store)} className="rounded-3xl border border-ink-100 bg-white px-4 py-3 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-2.5">
        <div className="min-w-0">
          <h3 className="truncate font-sans text-sm font-semibold text-ink-950">{shortStoreName(g.store)}</h3>
          <p className="text-xs text-ink-500">
            {STORE_KIND_LABEL[g.store.kind]} · {active.length} on shift{off.length ? ` · ${off.length} off` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {g.waiting.length > 0 && <Tag className="bg-amber-100 text-amber-900">{g.waiting.length} waiting</Tag>}
          <Tag className={free ? 'bg-emerald-50 text-emerald-700' : 'bg-blood-50 text-blood-700'}>{free} free</Tag>
        </div>
      </header>
      {active.length ? (
        <ul className="divide-y divide-ink-100">
          {active.map((v) => (
            <RiderRow key={v.rider.id} v={v} />
          ))}
        </ul>
      ) : (
        <p className="py-3 text-sm text-ink-500">No riders on shift.</p>
      )}
      {off.length > 0 && (
        <p className="border-t border-ink-100 pt-2 text-xs text-ink-500">
          <span className="font-medium text-ink-700">Off shift or leave:</span> {off.map((v) => `${shortName(v.rider.name)}${v.state === 'leave' ? ' (leave)' : ''}`).join(', ')}
        </p>
      )}
    </section>
  )
}

export function RiderGroups({ groups }: { groups: StoreGroup[] }) {
  const [limit, setLimit] = useState(10)
  const shown = useMemo(() => groups.slice(0, limit), [groups, limit])
  if (!groups.length) return <p className="rounded-3xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">No riders match.</p>
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
        {shown.map((g) => (
          <StoreBlock key={g.store.id} g={g} />
        ))}
      </div>
      <MoreButton shown={shown.length} total={groups.length} onMore={() => setLimit((n) => n + 10)} noun="stores" />
    </div>
  )
}
