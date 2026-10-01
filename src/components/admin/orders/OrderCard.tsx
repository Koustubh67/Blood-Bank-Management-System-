import { memo } from 'react'
import { Bike, Clock3, Hourglass, Smartphone, Zap } from 'lucide-react'
import type { OpsOrder } from '@/services/admin/types'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { COMPONENTS } from '@/data/blood'
import { cn, formatDistance, formatDuration, formatTime } from '@/lib/utils'
import { hospitalName } from '@/services/admin/store'
import { shortStoreName, storeById } from '@/services/admin/stores'
import { isDeferred, priorityScore } from '@/services/admin/priority'
import { shortName } from '@/services/admin/names'
import { HANDOVER_MS, MIN_MS } from '@/services/admin/time'
import { PRIORITY_STYLE, PriorityPill, SlaRing, Tag } from '../ui'
import { OrderMenu, PrimaryButton } from './OrderActions'
import { openOrder } from './state'

export interface CardContext {
  surge: boolean
  /** Store ids with at least one free rider (or any store in the city in surge) */
  riderFree: (o: OpsOrder) => boolean
  riderName: (id: string | undefined) => string | undefined
}

function RiderLine({ order, now, ctx }: { order: OpsOrder; now: number; ctx: CardContext }) {
  const name = order.riderName ?? ctx.riderName(order.riderId)
  if (order.stage === 'ready' && !order.riderId && order.source === 'ops') {
    if (isDeferred(order, ctx.surge, now))
      return <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ice-700"><Hourglass className="size-3.5" aria-hidden /> Deferred during surge</p>
    return ctx.riderFree(order) ? (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Bike className="size-3.5" aria-hidden /> Rider free nearby</p>
    ) : (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800"><Hourglass className="size-3.5" aria-hidden /> Waiting for rider</p>
    )
  }
  if (!name) return null
  if (order.stage === 'ready') {
    const left = (order.pickupAt ?? now) - now
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-600">
        <Bike className="size-3.5 text-amber-600" aria-hidden /> {shortName(name)}
        {order.borrowed && <Tag className="bg-amber-50 text-amber-800">Borrowed</Tag>}
        <span className="text-ink-400">· {left > 0 ? `pickup in ${formatDuration(left)}` : 'at the store'}</span>
      </p>
    )
  }
  if (order.stage === 'out_for_delivery') {
    const start = order.stageAt.out_for_delivery ?? now
    const total = order.rideMin * MIN_MS
    const left = start + total + HANDOVER_MS - now
    const progress = Math.min(1, (now - start) / total)
    return (
      <div className="mt-2">
        <p className="flex items-center gap-1.5 text-xs text-ink-600">
          <Bike className="size-3.5 text-blood-600" aria-hidden /> {shortName(name)}
          <span className="text-ink-400">· {progress >= 1 ? 'at the hospital desk' : `ETA ${formatDuration(left)}`}</span>
        </p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-100" aria-hidden>
          <div className="h-full rounded-full bg-blood-600 transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    )
  }
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
      <Bike className="size-3.5" aria-hidden /> {shortName(name)}
    </p>
  )
}

function Outcome({ order }: { order: OpsOrder }) {
  if (order.stage === 'delivered')
    return <p className="mt-2 text-xs font-medium text-emerald-700">Delivered {formatTime(order.stageAt.delivered ?? order.createdAt)} · {Math.round(((order.stageAt.delivered ?? 0) - order.createdAt) / MIN_MS)} min end to end</p>
  if (order.stage === 'rejected' || order.stage === 'cancelled')
    return <p className="mt-2 line-clamp-2 text-xs text-ink-500">{order.stage === 'rejected' ? 'Rejected' : 'Cancelled'}: {order.reason ?? 'no reason given'}</p>
  return null
}

/** One order on the priority board. */
export const OrderCard = memo(function OrderCard({ order, now, ctx, rank }: { order: OpsOrder; now: number; ctx: CardContext; rank?: number }) {
  const store = storeById(order.storeId)
  const closed = order.stage === 'delivered' || order.stage === 'rejected' || order.stage === 'cancelled'
  const score = priorityScore(order, now)
  const waited = (order.stageAt.out_for_delivery ?? now) - order.createdAt
  return (
    <article
      aria-label={`${order.id}, ${order.priority}, score ${score}`}
      className={cn(
        'relative min-w-0 rounded-2xl border border-ink-100 bg-white py-3 pr-3 pl-4 shadow-soft transition before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full',
        PRIORITY_STYLE[order.priority].edge,
        closed && 'opacity-80 shadow-none',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityPill priority={order.priority} />
            {order.source === 'app' && (
              <Tag className="bg-ice-50 text-ice-700">
                <Smartphone className="size-3" aria-hidden /> Placed in app
              </Tag>
            )}
            {order.rush && (
              <Tag className="bg-amber-50 text-amber-800">
                <Zap className="size-3" aria-hidden /> Rush
              </Tag>
            )}
            {rank !== undefined && <span className="text-[11px] font-semibold text-ink-400 tabular">#{rank}</span>}
          </div>
          <button type="button" onClick={() => openOrder(order.id)} className="mt-1.5 block w-full min-w-0 rounded-lg text-left">
            <span className="line-clamp-2 text-sm leading-snug font-semibold text-ink-950 hover:text-blood-700">{hospitalName(order)}</span>
            <span className="block truncate text-xs text-ink-500">
              <span className="font-mono">{order.id}</span> · {shortStoreName(store)} · {formatDistance(order.distanceM)}
            </span>
          </button>
        </div>
        {!closed && <SlaRing order={order} now={now} size={38} />}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {order.items.map((i, n) => (
          <li key={n} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 py-0.5 pr-2 pl-0.5 text-xs font-medium text-ink-800">
            <BloodGroupBadge group={i.group} size="sm" className="h-6 min-w-8 rounded-lg text-[11px]" />
            {i.units} × {COMPONENTS[i.component].short}
          </li>
        ))}
      </ul>

      {!closed && (
        <p className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-500">
          <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
            <Clock3 className="size-3.5 shrink-0" aria-hidden /> {order.stageAt.out_for_delivery ? `Sent in ${formatDuration(waited)}` : `Waiting ${formatDuration(waited)}`}
          </span>
          <span className="whitespace-nowrap">
            Score <span className="font-semibold text-ink-900 tabular">{score}</span>
          </span>
        </p>
      )}

      <RiderLine order={order} now={now} ctx={ctx} />
      <Outcome order={order} />

      {!closed && (
        <div className="mt-3 flex items-center gap-1.5">
          {order.source === 'app' ? (
            <p className="flex-1 text-xs text-ink-500">Runs on the customer&rsquo;s tracking timeline</p>
          ) : (
            <PrimaryButton order={order} short className="h-8 min-w-0 flex-1 px-3 text-xs" />
          )}
          <OrderMenu order={order} />
        </div>
      )}
    </article>
  )
})
