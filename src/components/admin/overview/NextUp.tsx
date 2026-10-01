import type { OpsOrder } from '@/services/admin/types'
import { hospitalName } from '@/services/admin/store'
import { priorityScore, STAGE_LABEL } from '@/services/admin/priority'
import { PriorityPill, SlaRing } from '../ui'
import { openOrder } from '../orders/state'

/** The top of the queue, compact: for the overview. */
export function NextUp({ orders, now }: { orders: OpsOrder[]; now: number }) {
  if (!orders.length) return <p className="px-3 py-6 text-center text-sm text-ink-500">The queue is clear.</p>
  return (
    <ol className="flex flex-col">
      {orders.map((o, i) => (
        <li key={o.id}>
          <button type="button" onClick={() => openOrder(o.id)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-ink-50">
            <span className="w-4 text-xs font-semibold text-ink-400 tabular">{i + 1}</span>
            <SlaRing order={o} now={now} size={34} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <PriorityPill priority={o.priority} />
                <span className="truncate text-xs text-ink-500">{STAGE_LABEL[o.stage]}</span>
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink-950">{hospitalName(o)}</span>
            </span>
            <span className="text-right text-xs text-ink-500">
              <span className="block font-display text-base font-bold text-ink-950 tabular">{priorityScore(o, now)}</span>
              score
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
