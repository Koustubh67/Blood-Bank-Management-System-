import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Ban, CreditCard, RotateCcw, TriangleAlert } from 'lucide-react'
import type { Order } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { hospitalById } from '@/data/network'
import { cn, formatDateTime, formatINR } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { Card } from '@/components/ui/primitives'
import { paidRecord } from './helpers'

function Shell({ icon, tone, eyebrow, title, children }: { icon: ReactNode; tone: 'amber' | 'red' | 'neutral'; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8">
          <span
            className={cn(
              'grid size-14 place-items-center rounded-2xl',
              tone === 'amber' && 'bg-amber-50 text-amber-700',
              tone === 'red' && 'bg-blood-50 text-blood-700',
              tone === 'neutral' && 'bg-ink-100 text-ink-700',
            )}
          >
            {icon}
          </span>
          <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-ink-500 uppercase">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
          {children}
        </div>
      </Card>
    </motion.div>
  )
}

function ItemsSummary({ order }: { order: Order }) {
  const hospital = hospitalById(order.hospitalId)
  return (
    <div className="mt-6 rounded-2xl bg-ink-50 p-4">
      <ul className="flex flex-wrap gap-2">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-2 rounded-xl bg-white py-1 pr-3 pl-1 text-sm shadow-soft">
            <BloodGroupBadge group={i.group} size="sm" />
            <span className="font-medium text-ink-800">
              {COMPONENTS[i.component].short} × {i.units}
            </span>
          </li>
        ))}
      </ul>
      {hospital && <p className="mt-3 text-sm text-ink-600">For {hospital.name}, {hospital.area}</p>}
    </div>
  )
}

/** Order created but not paid, or the last payment attempt failed. */
export function PaymentPendingState({ order }: { order: Order }) {
  const failed = order.status === 'payment_failed'
  const lastFailure = [...order.payments].reverse().find((p) => p.status === 'failed')
  return (
    <Shell
      tone={failed ? 'red' : 'amber'}
      icon={failed ? <TriangleAlert className="size-6" aria-hidden /> : <CreditCard className="size-6" aria-hidden />}
      eyebrow={`Order ${order.id}`}
      title={failed ? 'Payment didn’t go through' : 'Complete payment to dispatch'}
    >
      <p className="mt-3 text-ink-600">
        {failed
          ? `${lastFailure?.failureReason ?? 'The payment was declined.'} You have not been charged. Try again or use another method; the centre starts on your order the moment payment is confirmed.`
          : 'The blood centre starts verifying your requisition as soon as payment is confirmed. Tracking goes live right after.'}
      </p>
      <ItemsSummary order={order} />
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink to={`/checkout/${order.id}`} size="lg" icon={failed ? <RotateCcw className="size-4" aria-hidden /> : undefined}>
          {failed ? 'Retry payment' : 'Complete payment'} · {formatINR(order.price.total)}
          {!failed && <ArrowRight className="size-4" aria-hidden />}
        </ButtonLink>
        <ButtonLink to="/orders" variant="outline" size="lg">
          My orders
        </ButtonLink>
      </div>
    </Shell>
  )
}

export function CancelledState({ order, isOwner }: { order: Order; isOwner: boolean }) {
  const paid = paidRecord(order)
  return (
    <Shell tone="neutral" icon={<Ban className="size-6" aria-hidden />} eyebrow={`Order ${order.id}`} title="This order was cancelled">
      <p className="mt-3 text-ink-600">
        {order.cancelledAt ? `Cancelled on ${formatDateTime(order.cancelledAt)}.` : 'Cancelled.'} Any reserved units were returned to the blood
        centre&rsquo;s cold storage.
      </p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 p-4">
          <dt className="text-xs font-medium text-ink-500">Reason</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">{order.cancelReason ?? 'Not specified'}</dd>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <dt className="text-xs font-medium text-ink-500">Refund</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">
            {paid ? `${formatINR(paid.amount)}${isOwner ? ` to ${paid.instrument}` : ' to the original payment method'}` : 'No payment was taken'}
          </dd>
          {paid && <dd className="mt-1 text-xs text-ink-500">Initiated on cancellation. Usually 5–7 working days, depending on your bank.</dd>}
        </div>
      </dl>
      <ItemsSummary order={order} />
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink to="/order" size="lg">
          Place a new order
        </ButtonLink>
        <ButtonLink to="/orders" variant="outline" size="lg">
          My orders
        </ButtonLink>
      </div>
    </Shell>
  )
}
