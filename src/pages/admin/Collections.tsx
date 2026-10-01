import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { cityById } from '@/data/cities'
import { formatINR } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/disclosure'
import { toast } from '@/components/ui/Toast'
import { useCollectionRows, useScope } from '@/services/admin/hooks'
import { downloadCsv, METHOD_LABEL, METHODS, rowsToCsv, sumRows } from '@/services/admin/collections'
import { ALL_INDIA, scopeLabel, shortStoreName, storeById, storesIn } from '@/services/admin/stores'
import { DAY_MS, isoDay, startOfDay } from '@/services/admin/time'
import { FilterSelect, Page, PageHead, Panel, StatTile } from '@/components/admin/ui'
import { DayBars } from '@/components/admin/DayBars'
import { Breakdown } from '@/components/admin/collections/Breakdown'
import { StoreTotals, type StoreTotal } from '@/components/admin/collections/StoreTotals'

type Range = '1' | '7' | '30'
const RANGE_LABEL: Record<Range, string> = { '1': 'Today', '7': 'Last 7 days', '30': 'Last 30 days' }

/** Compact rupees for axis ticks: ₹1.2L, ₹35K */
function shortINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`
  if (n >= 1e3) return `₹${Math.round(n / 1e3)}K`
  return `₹${n}`
}

export default function Collections() {
  const now = useNow(10_000)
  const scope = useScope()
  const [range, setRange] = useState<Range>('7')
  const [storeId, setStoreId] = useState('all')
  const stores = useMemo(() => storesIn(scope), [scope])
  const store = stores.some((s) => s.id === storeId) ? storeId : 'all'
  const rows = useCollectionRows(30, now, store === 'all' ? undefined : store)

  const days = Number(range)
  const from = startOfDay(now) - (days - 1) * DAY_MS
  const inRange = useMemo(() => rows.filter((r) => r.day >= from), [rows, from])
  const totals = useMemo(() => sumRows(inRange), [inRange])

  const perDay = useMemo(() => {
    const map = new Map<number, typeof rows>()
    for (const r of rows) map.set(r.day, [...(map.get(r.day) ?? []), r])
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([day, list]) => {
        const t = sumRows(list)
        return {
          day,
          value: t.total,
          highlight: day >= from,
          detail: (
            <>
              <span className="block">{t.orders} orders · refunds {formatINR(t.refunds)}</span>
              <span className="block text-ink-500">
                {METHODS.map((m) => `${METHOD_LABEL[m].replace('Hospital ', '')} ${Math.round((t[m] / Math.max(1, t.total)) * 100)}%`).join(' · ')}
              </span>
            </>
          ),
        }
      })
  }, [rows, from])

  const byStore = useMemo<StoreTotal[]>(() => {
    const map = new Map<string, typeof rows>()
    for (const r of inRange) map.set(r.storeId, [...(map.get(r.storeId) ?? []), r])
    return [...map.entries()]
      .map(([id, list]) => ({ store: storeById(id)!, t: sumRows(list) }))
      .filter((x) => x.store)
      .sort((a, b) => b.t.total - a.t.total)
  }, [inRange])

  const previous = useMemo(() => {
    // Same-length window just before, for a simple comparison (30 days has none in the data).
    if (days === 30) return null
    const prevFrom = from - days * DAY_MS
    return sumRows(rows.filter((r) => r.day >= prevFrom && r.day < from)).total
  }, [rows, from, days])

  const exportCsv = () => {
    const where = store !== 'all' ? (storeById(store)?.id ?? store) : scope === ALL_INDIA ? 'all-india' : scope
    downloadCsv(`raktflow-collections-${where}-${RANGE_LABEL[range].toLowerCase().replace(/\s+/g, '-')}-${isoDay(now)}.csv`, rowsToCsv(inRange))
    toast.success('CSV downloaded', `${inRange.length} rows · one per store per day`)
  }

  const avg = totals.orders ? totals.total / totals.orders : 0
  const change = previous ? ((totals.total - previous) / previous) * 100 : null

  return (
    <Page title="Collections">
      <PageHead
        eyebrow={`Collections · ${scopeLabel(scope)}`}
        title="Store-wise takings"
        description="Processing charges, cold-chain logistics and GST on logistics, by store and by day. Today keeps counting as orders are paid and refunded."
        actions={
          <Button variant="dark" icon={<Download className="size-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-2 rounded-3xl border border-ink-100 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:p-4">
        <div className="relative -mx-1 overflow-x-auto px-1 no-scrollbar">
          <Tabs<Range>
            value={range}
            onChange={setRange}
            className="whitespace-nowrap shadow-none"
            tabs={(['1', '7', '30'] as Range[]).map((r) => ({ value: r, label: RANGE_LABEL[r] }))}
          />
        </div>
        <FilterSelect label="Store" value={store} onChange={setStoreId} className="sm:ml-auto sm:w-72">
          <option value="all">All stores ({stores.length})</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {shortStoreName(s)}
              {scope === ALL_INDIA ? ` · ${cityById(s.cityId).name}` : ''}
            </option>
          ))}
        </FilterSelect>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`Collected · ${RANGE_LABEL[range].toLowerCase()}`}
          value={formatINR(totals.total)}
          sub={change === null ? 'Before refunds' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}% vs the ${days === 1 ? 'all of yesterday' : 'previous 7 days'}`}
        />
        <StatTile label="Orders" value={totals.orders.toLocaleString('en-IN')} sub={`${formatINR(avg)} average order`} />
        <StatTile label="Refunds" value={formatINR(totals.refunds)} tone={totals.refunds ? 'amber' : 'ink'} sub="Rejected and cancelled orders" />
        <StatTile label="Net" value={formatINR(totals.net)} sub="Collected minus refunds" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <Panel
          title="Collected per day"
          description={`Last 30 days; ${RANGE_LABEL[range].toLowerCase()} in red. Hover or use arrow keys for each day.`}
          className="lg:col-span-8"
        >
          <DayBars data={perDay} format={formatINR} tickFormat={shortINR} label={`Collections per day, last 30 days, ${scopeLabel(scope)}`} height={300} />
        </Panel>
        <div className="lg:col-span-4">
          <Breakdown t={totals} />
        </div>
      </div>

      <StoreTotals rows={byStore} grand={totals} showCity={scope === ALL_INDIA} />

      <p className="text-center text-xs text-ink-500">
        Simulated figures. Past days are seeded per store; today adds every order on the ops board and every paid order placed in the app.
      </p>
    </Page>
  )
}
