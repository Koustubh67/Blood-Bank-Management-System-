import { useState } from 'react'
import type { OpsStore } from '@/services/admin/types'
import type { CollectionTotals } from '@/services/admin/collections'
import { cityById } from '@/data/cities'
import { formatINR } from '@/lib/utils'
import { shortStoreName, STORE_KIND_LABEL } from '@/services/admin/stores'
import { MoreButton, Panel } from '../ui'

export interface StoreTotal {
  store: OpsStore
  t: CollectionTotals
}

/** Takings per store for the range, biggest first. */
export function StoreTotals({ rows, grand, showCity }: { rows: StoreTotal[]; grand: CollectionTotals; showCity: boolean }) {
  const [limit, setLimit] = useState(25)
  const shown = rows.slice(0, limit)
  return (
    <Panel title="By store" description={`${rows.length} store${rows.length === 1 ? '' : 's'}, highest takings first`} bodyClassName="p-0">
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Collections per store for the selected range</caption>
          <thead className="bg-ink-50/60 text-left text-xs text-ink-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Store</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Orders</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Processing</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Logistics</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">GST</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Refunds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {shown.map(({ store, t }) => (
              <tr key={store.id} className="hover:bg-ink-50/50">
                <th scope="row" className="max-w-72 px-5 py-2.5 text-left font-normal">
                  <span className="block truncate font-semibold text-ink-950">{shortStoreName(store)}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {STORE_KIND_LABEL[store.kind]}
                    {showCity && ` · ${cityById(store.cityId).name}`}
                  </span>
                </th>
                <td className="px-3 py-2.5 text-right tabular">{t.orders}</td>
                <td className="px-3 py-2.5 text-right tabular">{formatINR(t.processing)}</td>
                <td className="px-3 py-2.5 text-right tabular">{formatINR(t.logistics)}</td>
                <td className="px-3 py-2.5 text-right tabular">{formatINR(t.gst)}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular">{formatINR(t.total)}</td>
                <td className="px-5 py-2.5 text-right text-ink-600 tabular">{t.refunds ? `−${formatINR(t.refunds)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-ink-200 bg-ink-50/60 font-semibold">
            <tr>
              <th scope="row" className="px-5 py-3 text-left">All {rows.length} stores</th>
              <td className="px-3 py-3 text-right tabular">{grand.orders}</td>
              <td className="px-3 py-3 text-right tabular">{formatINR(grand.processing)}</td>
              <td className="px-3 py-3 text-right tabular">{formatINR(grand.logistics)}</td>
              <td className="px-3 py-3 text-right tabular">{formatINR(grand.gst)}</td>
              <td className="px-3 py-3 text-right tabular">{formatINR(grand.total)}</td>
              <td className="px-5 py-3 text-right tabular">−{formatINR(grand.refunds)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 md:hidden">
        {shown.map(({ store, t }) => (
          <li key={store.id} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink-950">{shortStoreName(store)}</span>
                <span className="block truncate text-xs text-ink-500">
                  {t.orders} orders{showCity && ` · ${cityById(store.cityId).name}`}
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold tabular">{formatINR(t.total)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500 tabular">
              Processing {formatINR(t.processing)} · Logistics {formatINR(t.logistics)} · GST {formatINR(t.gst)}
              {t.refunds ? ` · Refunds −${formatINR(t.refunds)}` : ''}
            </p>
          </li>
        ))}
        <li className="flex items-baseline justify-between bg-ink-50/60 px-4 py-3 font-semibold">
          <span>All stores</span>
          <span className="tabular">{formatINR(grand.total)}</span>
        </li>
      </ul>
      <div className="pb-4">
        <MoreButton shown={shown.length} total={rows.length} onMore={() => setLimit((n) => n + 25)} noun="stores" />
      </div>
    </Panel>
  )
}
