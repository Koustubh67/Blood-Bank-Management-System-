import { useMemo, useState } from 'react'
import { Bot } from 'lucide-react'
import type { BloodGroup, Priority } from '@/types'
import type { OpsOrder, OpsStage } from '@/services/admin/types'
import { useNow } from '@/hooks/useNow'
import { BLOOD_GROUPS } from '@/data/blood'
import { cn } from '@/lib/utils'
import { useBoardOrders, useRiderViews, useScope, useStaff } from '@/services/admin/hooks'
import { useOps, hospitalName } from '@/services/admin/store'
import { setAutopilot } from '@/services/admin/actions'
import { byScore, isPreDispatch, PRIORITY_LABEL, PRIORITY_ORDER, sla } from '@/services/admin/priority'
import { scopeLabel, shortStoreName, storeById, storesIn } from '@/services/admin/stores'
import { Tabs } from '@/components/ui/disclosure'
import { FilterSelect, Page, PageHead, PRIORITY_STYLE, SearchField } from '@/components/admin/ui'
import { PriorityHelp } from '@/components/admin/PriorityHelp'
import { OrderCard, type CardContext } from '@/components/admin/orders/OrderCard'

type ColumnKey = 'incoming' | 'verifying' | 'packing' | 'ready' | 'out_for_delivery' | 'closed'

const COLUMNS: { key: ColumnKey; label: string; hint: string; stages: OpsStage[] }[] = [
  { key: 'incoming', label: 'Incoming', hint: 'New, not yet opened', stages: ['incoming'] },
  { key: 'verifying', label: 'Verifying', hint: 'Requisition check', stages: ['verifying'] },
  { key: 'packing', label: 'Packing', hint: 'Cross-match and cold box', stages: ['packing'] },
  { key: 'ready', label: 'Ready', hint: 'Packed, rider needed', stages: ['ready'] },
  { key: 'out_for_delivery', label: 'Out for delivery', hint: 'Rider on the road', stages: ['out_for_delivery'] },
  { key: 'closed', label: 'Closed today', hint: 'Delivered, rejected, cancelled', stages: ['delivered', 'rejected', 'cancelled'] },
]

const PER_COLUMN = 25

function closedAt(o: OpsOrder) {
  return o.stageAt.delivered ?? o.stageAt.rejected ?? o.stageAt.cancelled ?? o.createdAt
}

function Column({ col, orders, now, ctx, className }: { col: (typeof COLUMNS)[number]; orders: OpsOrder[]; now: number; ctx: CardContext; className?: string }) {
  const [limit, setLimit] = useState(PER_COLUMN)
  const risk = col.key !== 'closed' ? orders.filter((o) => isPreDispatch(o) && ['risk', 'breached'].includes(sla(o, now).state)).length : 0
  return (
    <section aria-labelledby={`col-${col.key}`} className={cn('flex min-w-0 flex-col rounded-3xl bg-ink-100/50 p-2', className)}>
      <header className="flex items-start justify-between gap-2 px-2 pt-1.5 pb-2.5">
        <div className="min-w-0">
          <h2 id={`col-${col.key}`} className="flex items-center gap-2 font-sans text-sm font-semibold text-ink-950">
            {col.label}
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-700 tabular shadow-soft">{orders.length}</span>
          </h2>
          <p className="truncate text-[11px] text-ink-500">{col.hint}</p>
        </div>
        {risk > 0 && <span className="shrink-0 rounded-full bg-blood-600 px-2 py-0.5 text-[11px] font-bold text-white">{risk} at risk</span>}
      </header>
      {orders.length === 0 ? (
        <p className="mx-1 mb-1 rounded-2xl border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-400">Nothing here</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {orders.slice(0, limit).map((o, i) => (
            <li key={o.id}>
              <OrderCard order={o} now={now} ctx={ctx} rank={col.key === 'closed' ? undefined : i + 1} />
            </li>
          ))}
        </ol>
      )}
      {orders.length > limit && (
        <button type="button" onClick={() => setLimit((n) => n + PER_COLUMN)} className="mt-2 rounded-full py-2 text-xs font-semibold text-ink-700 hover:bg-white">
          Show {Math.min(PER_COLUMN, orders.length - limit)} more
        </button>
      )}
    </section>
  )
}

export default function PriorityBoard() {
  const now = useNow(1000)
  const scope = useScope()
  const orders = useBoardOrders(now)
  const surge = useOps((s) => s.surge)
  const autopilot = useOps((s) => s.autopilot)
  const views = useRiderViews(now)
  const staff = useStaff()

  const [storeId, setStoreId] = useState('all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [group, setGroup] = useState<'all' | BloodGroup>('all')
  const [q, setQ] = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [mobileChoice, setMobileCol] = useState<ColumnKey | null>(null)

  const stores = useMemo(() => storesIn(scope), [scope])
  const store = stores.some((s) => s.id === storeId) ? storeId : 'all'

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return orders.filter((o) => {
      if (store !== 'all' && o.storeId !== store) return false
      if (priority !== 'all' && o.priority !== priority) return false
      if (group !== 'all' && !o.items.some((i) => i.group === group)) return false
      if (!needle) return true
      return [o.id, hospitalName(o), o.patient, shortStoreName(storeById(o.storeId)), o.riderName ?? ''].some((s) => s.toLowerCase().includes(needle))
    })
  }, [orders, store, priority, group, q])

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => {
        const list = filtered.filter((o) => col.stages.includes(o.stage))
        list.sort(col.key === 'closed' ? (a, b) => closedAt(b) - closedAt(a) : byScore(now))
        return { col, orders: list }
      }),
    [filtered, now],
  )

  const ctx = useMemo<CardContext>(() => {
    const freeStores = new Set<string>()
    const freeCities = new Set<string>()
    for (const v of views) {
      if (v.state !== 'available') continue
      freeStores.add(v.store.id)
      freeCities.add(v.store.cityId)
    }
    const names = new Map(staff.map((m) => [m.id, m.name]))
    return {
      surge,
      riderFree: (o) => freeStores.has(o.storeId) || (surge && freeCities.has(o.cityId)),
      riderName: (id) => (id ? names.get(id) : undefined),
    }
  }, [views, staff, surge])

  const live = filtered.filter((o) => isPreDispatch(o) || o.stage === 'out_for_delivery')
  const atRisk = filtered.filter((o) => isPreDispatch(o) && ['risk', 'breached'].includes(sla(o, now).state)).length
  const shown = columns.filter((c) => showClosed || c.col.key !== 'closed')
  // Phones open on the earliest stage that has work in it.
  const mobileCol = mobileChoice ?? columns.find((c) => c.col.key !== 'closed' && c.orders.length)?.col.key ?? 'incoming'
  const mobile = columns.find((c) => c.col.key === mobileCol) ?? columns[0]

  return (
    <Page title="Priority board">
      <PageHead
        eyebrow={`Priority board · ${scopeLabel(scope)}`}
        title="Every order, most urgent first"
        description="Columns follow an order from intake to handover. Within each column, cards are sorted by priority score; the ring counts down to the dispatch target."
        actions={
          <>
            <button
              type="button"
              aria-pressed={autopilot}
              onClick={() => setAutopilot(!autopilot)}
              title="Autopilot advances orders nobody on the panel has touched in the last 3 minutes"
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold',
                autopilot ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
              )}
            >
              <Bot className="size-4" aria-hidden /> Autopilot {autopilot ? 'on' : 'off'}
            </button>
            <PriorityHelp />
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-ink-100 bg-white p-3 shadow-soft sm:p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <SearchField value={q} onChange={setQ} label="Search orders" placeholder="Order, hospital, patient, rider" className="col-span-2 md:col-span-1" />
          <FilterSelect label="Store" value={store} onChange={setStoreId} className="col-span-2 sm:col-span-1">
            <option value="all">All stores ({stores.length})</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {shortStoreName(s)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Priority" value={priority} onChange={(v) => setPriority(v as 'all' | Priority)}>
            <option value="all">All priorities</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Blood group" value={group} onChange={(v) => setGroup(v as 'all' | BloodGroup)}>
            <option value="all">All groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </FilterSelect>
          <label className="hidden h-10 cursor-pointer items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-medium whitespace-nowrap text-ink-800 hover:bg-ink-50 md:inline-flex">
            <input type="checkbox" className="size-4 accent-ink-950" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
            Closed today
          </label>
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-ink-500" aria-live="polite">
          <span>
            <span className="font-semibold text-ink-900 tabular">{live.length}</span> live
          </span>
          {PRIORITY_ORDER.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', PRIORITY_STYLE[p].dot)} aria-hidden />
              <span className="font-semibold text-ink-900 tabular">{live.filter((o) => o.priority === p).length}</span> {PRIORITY_LABEL[p].toLowerCase()}
            </span>
          ))}
          <span className={cn(atRisk ? 'font-semibold text-blood-700' : '')}>
            <span className="tabular">{atRisk}</span> near or past target
          </span>
          {surge && <span className="font-semibold text-ink-900">Surge mode on</span>}
        </p>
      </div>

      {/* Phones: one stage at a time */}
      <div className="md:hidden">
        <div className="relative -mx-4 overflow-x-auto px-4 pb-1 no-scrollbar">
          <Tabs<ColumnKey>
            value={mobileCol}
            onChange={setMobileCol}
            className="whitespace-nowrap"
            tabs={columns.map((c) => ({
              value: c.col.key,
              label: (
                <>
                  {c.col.key === 'out_for_delivery' ? 'On the way' : c.col.key === 'closed' ? 'Closed' : c.col.label} <span className="ml-0.5 opacity-70 tabular">{c.orders.length}</span>
                </>
              ),
            }))}
          />
        </div>
        <Column key={mobile.col.key} col={mobile.col} orders={mobile.orders} now={now} ctx={ctx} className="mt-3" />
      </div>

      {/* Tablets and up: the full board, scrolling sideways when it must */}
      <div className="relative -mx-4 hidden snap-x overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:block lg:-mx-8 lg:px-8">
        <div className="grid items-start gap-3" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(210px, 1fr))` }}>
          {shown.map((c) => (
            <Column key={c.col.key} col={c.col} orders={c.orders} now={now} ctx={ctx} className="snap-start" />
          ))}
        </div>
      </div>
    </Page>
  )
}
