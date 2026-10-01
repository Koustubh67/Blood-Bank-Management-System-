import { Bike, Hourglass } from 'lucide-react'
import type { OpsOrder } from '@/services/admin/types'
import { formatDuration } from '@/lib/utils'
import { hospitalName } from '@/services/admin/store'
import { isDeferred } from '@/services/admin/priority'
import { shortStoreName, storeById } from '@/services/admin/stores'
import { shortName } from '@/services/admin/names'
import { Panel, PriorityPill, SlaRing, Tag } from '../ui'
import { openAction, openOrder } from '../orders/state'

function Row({ o, now, surge, children }: { o: OpsOrder; now: number; surge: boolean; children?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-ink-50/70">
      <SlaRing order={o} now={now} size={36} />
      <button type="button" onClick={() => openOrder(o.id)} className="min-w-0 flex-1 text-left">
        <span className="flex flex-wrap items-center gap-1.5">
          <PriorityPill priority={o.priority} />
          {isDeferred(o, surge, now) && <Tag className="bg-ice-50 text-ice-700">Deferred</Tag>}
          {o.source === 'app' && <Tag className="bg-ice-50 text-ice-700">App</Tag>}
        </span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-ink-950">{hospitalName(o)}</span>
        <span className="block truncate text-xs text-ink-500">
          <span className="font-mono">{o.id}</span> · {shortStoreName(storeById(o.storeId))}
        </span>
      </button>
      {children}
    </li>
  )
}

/** Orders that need a rider now, those about to, and those being collected. */
export function Queue({ orders, now, surge, riderName }: { orders: OpsOrder[]; now: number; surge: boolean; riderName: (id?: string) => string | undefined }) {
  const waiting = orders.filter((o) => o.stage === 'ready' && !o.riderId && o.source === 'ops')
  const packing = orders.filter((o) => o.stage === 'packing')
  const pickup = orders.filter((o) => o.stage === 'ready' && (o.riderId || o.source === 'app'))
  return (
    <Panel
      title="Unassigned queue"
      description="Packed orders without a rider, highest score first"
      bodyClassName="p-2 sm:p-3"
      actions={<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 tabular" aria-live="polite">{waiting.length} waiting</span>}
    >
      {waiting.length === 0 ? (
        <p className="flex items-center gap-2 px-3 py-4 text-sm text-ink-500">
          <Bike className="size-4 text-emerald-600" aria-hidden /> Every packed order has a rider.
        </p>
      ) : (
        <ol className="flex flex-col">
          {waiting.map((o) => (
            <Row key={o.id} o={o} now={now} surge={surge}>
              <button type="button" onClick={() => openAction('assign', o.id)} className="shrink-0 rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800">
                Assign
              </button>
            </Row>
          ))}
        </ol>
      )}

      {pickup.length > 0 && (
        <>
          <h3 className="mt-3 px-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Rider on the way to pick up · {pickup.length}</h3>
          <ol className="flex flex-col">
            {pickup.map((o) => (
              <Row key={o.id} o={o} now={now} surge={surge}>
                <span className="shrink-0 text-right text-xs text-ink-500">
                  <span className="block font-medium text-ink-800">{shortName(riderName(o.riderId) ?? o.riderName ?? '')}</span>
                  {o.pickupAt && o.pickupAt > now ? formatDuration(o.pickupAt - now) : 'at store'}
                </span>
              </Row>
            ))}
          </ol>
        </>
      )}

      {packing.length > 0 && (
        <>
          <h3 className="mt-3 flex items-center gap-1.5 px-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            <Hourglass className="size-3.5" aria-hidden /> Coming up · packing {packing.length}
          </h3>
          <ol className="flex flex-col">
            {packing.slice(0, 6).map((o) => (
              <Row key={o.id} o={o} now={now} surge={surge} />
            ))}
          </ol>
          {packing.length > 6 && <p className="px-2 pb-1 text-xs text-ink-500">+{packing.length - 6} more on the priority board</p>}
        </>
      )}
    </Panel>
  )
}
