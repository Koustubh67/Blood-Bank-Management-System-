import type { CollectionTotals } from '@/services/admin/collections'
import { METHODS, METHOD_LABEL } from '@/services/admin/collections'
import { formatINR } from '@/lib/utils'
import { Panel } from '../ui'

function Bar({ label, value, total, note }: { label: string; value: number; total: number; note?: string }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink-700">
          {label}
          {note && <span className="ml-1 text-xs text-ink-400">{note}</span>}
        </span>
        <span className="font-semibold text-ink-950 tabular">
          {formatINR(value)} <span className="ml-1 text-xs font-normal text-ink-500">{pct.toFixed(0)}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100" aria-hidden>
        <div className="h-full rounded-full bg-ink-800" style={{ width: `${pct}%` }} />
      </div>
    </li>
  )
}

/** Where the money came from (charge type) and how it was paid (method). */
export function Breakdown({ t }: { t: CollectionTotals }) {
  return (
    <Panel title="Breakdown" description="Charge type and payment method for the range">
      <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Charges</h3>
      <ul className="mt-3 flex flex-col gap-3">
        <Bar label="Processing" value={t.processing} total={t.total} />
        <Bar label="Logistics" note="cold chain" value={t.logistics} total={t.total} />
        <Bar label="GST" note="18% of logistics" value={t.gst} total={t.total} />
      </ul>
      <h3 className="mt-6 text-xs font-semibold tracking-wide text-ink-500 uppercase">Payment method</h3>
      <ul className="mt-3 flex flex-col gap-3">
        {METHODS.map((m) => (
          <Bar key={m} label={METHOD_LABEL[m]} value={t[m]} total={t.total} />
        ))}
      </ul>
      <div className="mt-6 grid grid-cols-2 gap-2 border-t border-ink-100 pt-4 text-sm">
        <div>
          <p className="text-xs text-ink-500">Refunds</p>
          <p className="font-semibold text-blood-700 tabular">−{formatINR(t.refunds)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-500">Net collected</p>
          <p className="font-semibold text-ink-950 tabular">{formatINR(t.net)}</p>
        </div>
      </div>
    </Panel>
  )
}
