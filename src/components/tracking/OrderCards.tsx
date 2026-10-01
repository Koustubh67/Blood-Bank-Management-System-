import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Building2, CreditCard, MapPin, Receipt } from 'lucide-react'
import type { Order } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { hospitalById } from '@/data/network'
import { ACTIVE_STATUSES, liveStatus } from '@/services/orders'
import { cn, formatClock, formatDateTime, formatINR, formatTime } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/primitives'
import { PriorityBadge } from './StatusHeader'
import { etaMs, journeyProgress, maskName, paidRecord, stageClock } from './helpers'

function JourneyBar({ progress, onRoad, className }: { progress: number; onRoad: boolean; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-ink-100', className)} aria-hidden>
      <motion.div
        className={cn('h-full rounded-full', onRoad ? 'bg-blood-600' : 'bg-ice-500')}
        initial={false}
        animate={{ width: `${Math.max(3, progress * 100)}%` }}
        transition={{ duration: 0.9, ease: 'linear' }}
      />
    </div>
  )
}

function ItemChips({ order, max = 3 }: { order: Order; max?: number }) {
  const extra = order.items.length - max
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {order.items.slice(0, max).map((i, idx) => (
        <li key={idx} className="flex items-center gap-1.5 rounded-xl bg-ink-50 py-0.5 pr-2.5 pl-0.5 text-xs font-medium text-ink-700">
          <BloodGroupBadge group={i.group} size="sm" />
          {COMPONENTS[i.component].short} × {i.units}
        </li>
      ))}
      {extra > 0 && <li className="text-xs font-medium text-ink-500">+{extra} more</li>}
    </ul>
  )
}

/** Compact live card used on /track for in-progress orders. */
export function LiveOrderCard({ order, now }: { order: Order; now: number }) {
  const status = liveStatus(order, now)
  const eta = etaMs(order, now)
  const hospital = hospitalById(order.hospitalId)
  const onRoad = status === 'dispatched' || status === 'arriving'

  return (
    <Link
      to={`/track/${order.id}`}
      className="group block rounded-3xl border border-ink-100 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink-950 tabular">{order.id}</p>
          {hospital && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-500">
              <MapPin className="size-3.5 shrink-0" aria-hidden /> {hospital.name}
            </p>
          )}
        </div>
        <StatusBadge status={status} className="shrink-0" />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-ink-500 uppercase">{eta > 0 ? 'Arriving in' : 'Handover'}</p>
          <p className="mt-1 font-display text-4xl leading-none font-bold text-ink-950 tabular">{eta > 0 ? formatClock(eta) : 'Now'}</p>
        </div>
        <p className="text-right text-xs text-ink-500">
          Expected by
          <span className="block text-sm font-semibold text-ink-900 tabular">{formatTime(now + eta)}</span>
        </p>
      </div>

      <JourneyBar progress={journeyProgress(order, now)} onRoad={onRoad} className="mt-4" />

      <div className="mt-4 flex items-center justify-between gap-3">
        <ItemChips order={order} max={2} />
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blood-700">
          Track
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

/** Full order row used on /orders. */
export function OrderListCard({ order, now }: { order: Order; now: number }) {
  const status = liveStatus(order, now)
  const active = ACTIVE_STATUSES.includes(status)
  const unpaid = status === 'pending_payment' || status === 'payment_failed'
  const paid = paidRecord(order)
  const hospital = hospitalById(order.hospitalId)
  const eta = etaMs(order, now)
  const deliveredAt = status === 'delivered' ? stageClock(order, 'delivered') : null
  const trackable = order.status === 'placed' || status === 'cancelled'

  return (
    <Card className="p-5 transition-shadow duration-300 hover:shadow-lift sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl font-bold text-ink-950 tabular">{order.id}</p>
            <PriorityBadge priority={order.priority} />
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {formatDateTime(order.createdAt)} · Patient {maskName(order.patient.name)}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
        <ItemChips order={order} />
        {hospital && (
          <p className="flex min-w-0 items-start gap-2 text-sm text-ink-700">
            <Building2 className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink-900">{hospital.name}</span>
              <span className="block truncate text-xs text-ink-500">{hospital.area}</span>
            </span>
          </p>
        )}
        <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
          <p className="text-xs text-ink-500">{paid ? 'Paid' : 'Total'}</p>
          <p className="font-display text-xl font-bold text-ink-950 tabular">{formatINR(order.price.total)}</p>
        </div>
      </div>

      {active && (
        <div className="mt-5 rounded-2xl bg-ink-50 p-3.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-ink-700">{eta > 0 ? 'Arriving in' : 'At the hospital'}</span>
            {eta > 0 && <span className="font-display text-lg font-bold text-ink-950 tabular">{formatClock(eta)}</span>}
          </div>
          <JourneyBar progress={journeyProgress(order, now)} onRoad={status === 'dispatched' || status === 'arriving'} className="mt-2" />
        </div>
      )}
      {deliveredAt && <p className="mt-4 text-sm text-emerald-700">Handed over at {formatTime(deliveredAt)}</p>}
      {status === 'cancelled' && order.cancelReason && <p className="mt-4 text-sm text-ink-500">Cancelled: {order.cancelReason}</p>}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
        {unpaid && (
          <ButtonLink to={`/checkout/${order.id}`} size="sm" icon={<CreditCard className="size-4" aria-hidden />}>
            {status === 'payment_failed' ? 'Retry payment' : 'Complete payment'}
          </ButtonLink>
        )}
        {trackable && (
          <ButtonLink
            to={`/track/${order.id}`}
            size="sm"
            variant={active ? 'dark' : 'outline'}
            icon={<MapPin className="size-4" aria-hidden />}
          >
            {active ? 'Track live' : status === 'cancelled' ? 'View details' : 'View journey'}
          </ButtonLink>
        )}
        {paid && (
          <ButtonLink to={`/order/${order.id}/success`} size="sm" variant="ghost" icon={<Receipt className="size-4" aria-hidden />}>
            Receipt
          </ButtonLink>
        )}
      </div>
    </Card>
  )
}
