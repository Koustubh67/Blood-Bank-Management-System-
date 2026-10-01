import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useNow } from '@/hooks/useNow'
import { formatINR } from '@/lib/utils'
import { useScope } from '@/services/admin/hooks'
import { ALL_INDIA, scopeLabel, shortStoreName } from '@/services/admin/stores'
import { cityById } from '@/data/cities'
import { Tabs } from '@/components/ui/disclosure'
import { FilterSelect, MoreButton, Page, PageHead, SearchField, StatTile } from '@/components/admin/ui'
import { StoreTable } from '@/components/admin/stores/StoreTable'
import { StoreDrawer } from '@/components/admin/stores/StoreDrawer'
import { useStoreRows, type StoreRow } from '@/components/admin/stores/useStoreRows'

type Kind = 'all' | 'centre' | 'outlet'
type Sort = 'busy' | 'collections' | 'low' | 'name'

const SORTS: Record<Sort, { label: string; fn: (a: StoreRow, b: StoreRow) => number }> = {
  busy: { label: 'Busiest today', fn: (a, b) => b.live - a.live || b.ordersToday - a.ordersToday },
  collections: { label: 'Collections today', fn: (a, b) => b.today - a.today },
  low: { label: 'Lowest stock', fn: (a, b) => b.low.filter((g) => g.level === 'out').length - a.low.filter((g) => g.level === 'out').length || a.units - b.units },
  name: { label: 'Name', fn: (a, b) => shortStoreName(a.store).localeCompare(shortStoreName(b.store)) },
}

export default function Stores() {
  const now = useNow(5000)
  const scope = useScope()
  const rows = useStoreRows(now)
  const [params, setParams] = useSearchParams()
  const [kind, setKind] = useState<Kind>('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(40)
  const sortParam = params.get('sort') as Sort | null
  const sort: Sort = sortParam && sortParam in SORTS ? sortParam : 'busy'
  const openId = params.get('store')

  const setParam = (key: string, value: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter((r) => kind === 'all' || r.store.kind === kind)
      .filter((r) => !needle || [r.store.name, r.store.area, r.store.licenseNo, cityById(r.store.cityId).name].some((s) => s.toLowerCase().includes(needle)))
      .sort(SORTS[sort].fn)
  }, [rows, kind, q, sort])

  const totals = useMemo(
    () => ({
      today: filtered.reduce((s, r) => s + r.today, 0),
      mtd: filtered.reduce((s, r) => s + r.mtd, 0),
      units: filtered.reduce((s, r) => s + r.units, 0),
      fridgeAlarms: filtered.filter((r) => r.fridgeOk === false).length,
      onShift: filtered.reduce((s, r) => s + r.onShift, 0),
    }),
    [filtered],
  )
  const centres = rows.filter((r) => r.store.kind === 'centre').length

  return (
    <Page title="Stores">
      <PageHead
        eyebrow={`Stores · ${scopeLabel(scope)}`}
        title="Blood centres and outlets"
        description={`${centres} licensed blood centres and ${rows.length - centres} outlets. Outlets hold units issued by their mother centre, close to busy hospitals.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Collected today" value={formatINR(totals.today)} sub={`${formatINR(totals.mtd)} this month`} />
        <StatTile label="Units on shelves" value={totals.units.toLocaleString('en-IN')} sub="Across the stores listed" />
        <StatTile label="Staff on shift" value={totals.onShift} sub="Managers, lab, medical, dispatch, riders" />
        <StatTile label="Fridge alarms" value={totals.fridgeAlarms} tone={totals.fridgeAlarms ? 'red' : 'green'} sub="Outside 2–6 °C right now" />
      </div>

      <div className="flex flex-col gap-2 rounded-3xl border border-ink-100 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:p-4">
        <div className="relative -mx-1 overflow-x-auto px-1 no-scrollbar">
          <Tabs<Kind>
            value={kind}
            onChange={setKind}
            className="whitespace-nowrap shadow-none"
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'centre', label: 'Blood centres' },
              { value: 'outlet', label: 'Outlets' },
            ]}
          />
        </div>
        <SearchField value={q} onChange={setQ} label="Search stores" placeholder="Name, area, licence" className="sm:max-w-xs sm:flex-1" />
        <FilterSelect label="Sort stores" value={sort} onChange={(v) => setParam('sort', v === 'busy' ? null : v)} className="sm:ml-auto sm:w-52">
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              Sort: {v.label}
            </option>
          ))}
        </FilterSelect>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">No stores match.</p>
      ) : (
        <div>
          <StoreTable rows={filtered.slice(0, limit)} onOpen={(id) => setParam('store', id)} showCity={scope === ALL_INDIA} />
          <MoreButton shown={Math.min(limit, filtered.length)} total={filtered.length} onMore={() => setLimit((n) => n + 40)} noun="stores" />
        </div>
      )}

      <StoreDrawer storeId={openId} onClose={() => setParam('store', null)} />
    </Page>
  )
}
