import { Clock3, Snowflake, Thermometer } from 'lucide-react'
import { cityById } from '@/data/cities'
import { cn, formatINR } from '@/lib/utils'
import { shortStoreName, STORE_KIND_LABEL } from '@/services/admin/stores'
import { Tag } from '../ui'
import type { StoreRow } from './useStoreRows'

function Fridge({ row }: { row: StoreRow }) {
  if (row.tempC === undefined) return <span className="text-ink-300">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold tabular', row.fridgeOk ? 'text-ink-800' : 'text-blood-700')}>
      <Thermometer className={cn('size-3.5', row.fridgeOk ? 'text-ice-600' : 'text-blood-600')} aria-hidden />
      {row.tempC.toFixed(1)} °C
      {!row.fridgeOk && <span className="sr-only">(outside 2–6 °C)</span>}
    </span>
  )
}

function LowGroups({ row }: { row: StoreRow }) {
  if (!row.low.length) return <span className="text-xs font-medium text-emerald-700">All stocked</span>
  return (
    <span className="flex flex-wrap gap-1">
      {row.low.slice(0, 4).map((g) => (
        <span key={g.group} className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular', g.level === 'out' ? 'bg-blood-50 text-blood-700' : 'bg-amber-50 text-amber-800')} title={`${g.group} red cells: ${g.units}`}>
          {g.group.replace('-', '−')} {g.units}
        </span>
      ))}
      {row.low.length > 4 && <span className="text-[11px] text-ink-500">+{row.low.length - 4}</span>}
    </span>
  )
}

function StoreName({ row, onOpen, showCity }: { row: StoreRow; onOpen: () => void; showCity: boolean }) {
  const s = row.store
  return (
    <button type="button" onClick={onOpen} className="group block min-w-0 text-left">
      <span className="flex items-center gap-2">
        <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', s.kind === 'outlet' ? 'bg-blood-50 text-blood-600' : 'bg-ink-950 text-white')} aria-hidden>
          {s.kind === 'outlet' ? <Snowflake className="size-3.5" /> : <span className="text-sm leading-none font-bold">+</span>}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink-950 group-hover:text-blood-700">{shortStoreName(s)}</span>
          <span className="block truncate text-xs text-ink-500">
            {STORE_KIND_LABEL[s.kind]}
            {showCity && ` · ${cityById(s.cityId).name}`} · <span className="font-mono">{s.licenseNo.replace(' (demo)', '')}</span>
          </span>
        </span>
      </span>
    </button>
  )
}

export function StoreTable({ rows, onOpen, showCity }: { rows: StoreRow[]; onOpen: (id: string) => void; showCity: boolean }) {
  return (
    <>
      {/* Desktop table */}
      <div className="relative hidden overflow-x-auto rounded-3xl border border-ink-100 bg-white shadow-soft lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Stores with stock, fridge temperature, orders, collections and staffing</caption>
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs text-ink-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Store</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Units</th>
              <th scope="col" className="px-3 py-3 font-semibold">Low red cells</th>
              <th scope="col" className="px-3 py-3 font-semibold">Fridge</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Orders today</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Today</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Month to date</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">On shift</th>
              <th scope="col" className="px-4 py-3 font-semibold">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.store.id} className="hover:bg-ink-50/50">
                <td className="max-w-72 px-4 py-3">
                  <StoreName row={r} onOpen={() => onOpen(r.store.id)} showCity={showCity} />
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular">{r.units}</td>
                <td className="px-3 py-3">
                  <LowGroups row={r} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <Fridge row={r} />
                </td>
                <td className="px-3 py-3 text-right tabular">
                  {r.ordersToday}
                  {r.live > 0 && <span className="ml-1 text-xs text-blood-700">({r.live} live)</span>}
                </td>
                <td className="px-3 py-3 text-right font-semibold whitespace-nowrap tabular">{formatINR(r.today)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap text-ink-700 tabular">{formatINR(r.mtd)}</td>
                <td className="px-3 py-3 text-right tabular">
                  {r.onShift}
                  <span className="text-ink-400">/{r.staffTotal}</span>
                </td>
                <td className="px-4 py-3">{r.store.open24x7 ? <Tag className="bg-emerald-50 text-emerald-700">24×7</Tag> : <Tag>8–22</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones and tablets: cards */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {rows.map((r) => (
          <li key={r.store.id} className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <StoreName row={r} onOpen={() => onOpen(r.store.id)} showCity={showCity} />
              {r.store.open24x7 ? (
                <Tag className="shrink-0 bg-emerald-50 text-emerald-700">24×7</Tag>
              ) : (
                <Tag className="shrink-0">
                  <Clock3 className="size-3" aria-hidden /> 8–22
                </Tag>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-ink-50 px-2 py-2">
                <dt className="text-[11px] text-ink-500">Units</dt>
                <dd className="font-semibold tabular">{r.units}</dd>
              </div>
              <div className="rounded-2xl bg-ink-50 px-2 py-2">
                <dt className="text-[11px] text-ink-500">Orders today</dt>
                <dd className="font-semibold tabular">{r.ordersToday}</dd>
              </div>
              <div className="rounded-2xl bg-ink-50 px-2 py-2">
                <dt className="text-[11px] text-ink-500">On shift</dt>
                <dd className="font-semibold tabular">
                  {r.onShift}/{r.staffTotal}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-semibold tabular">{formatINR(r.today)}</span> <span className="text-xs text-ink-500">today · {formatINR(r.mtd)} month</span>
              </span>
              <Fridge row={r} />
            </div>
            <div className="mt-2.5">
              <LowGroups row={r} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
