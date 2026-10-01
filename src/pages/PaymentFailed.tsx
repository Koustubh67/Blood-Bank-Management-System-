import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { CreditCard, Info, PackageSearch, Phone, RotateCcw, ShieldCheck, Timer, Undo2 } from 'lucide-react'
import type { PaymentMethod } from '@/types'
import { ButtonLink, buttonClass } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/primitives'
import { BRAND } from '@/config/brand'
import { hospitalById } from '@/data/network'
import { useCurrentUser } from '@/services/auth'
import { useCentres } from '@/services/inventory'
import { useOrder } from '@/services/orders'
import { useNow } from '@/hooks/useNow'
import { cn, formatClock, formatDateTime, formatINR } from '@/lib/utils'
import { readHold } from '@/components/order/paymentHold'
import { CheckoutSummary } from '@/components/order/checkout/CheckoutSummary'
import { METHOD_LABEL } from '@/components/order/success/Receipt'

const TIPS: Record<PaymentMethod, string> = {
  upi: 'Approve the collect request in your UPI app within a few minutes, and check your daily UPI limit.',
  card: 'Check that the card is enabled for online payments and has enough limit, or try a different card.',
  netbanking: "Bank sessions time out after a few minutes. Keep the bank's page open until it sends you back.",
  credit: "Check the purchase-order number with your hospital's accounts team.",
}

export default function PaymentFailed() {
  const { orderId = '' } = useParams()
  const order = useOrder(orderId)
  const user = useCurrentUser()
  const centres = useCentres()
  const centre = useMemo(() => centres.find((c) => c.id === order?.centreId), [centres, order?.centreId])
  const lastFailed = useMemo(() => [...(order?.payments ?? [])].reverse().find((p) => p.status === 'failed'), [order])
  const [deadline] = useState(() => readHold(orderId))

  const visible =
    !!order && !!user && (order.userId === user.id || (user.role === 'hospital' && !!user.hospitalId && user.hospitalId === order.hospitalId))

  if (!order || !visible)
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState
          icon={<PackageSearch className="size-6" />}
          title="We couldn't find that order"
          description="It may belong to another account, or the link is incomplete."
          action={<ButtonLink to="/orders">My orders</ButtonLink>}
        />
      </div>
    )

  if (order.status !== 'pending_payment' && order.status !== 'payment_failed') return <Navigate to={`/order/${order.id}/success`} replace />
  if (!lastFailed) return <Navigate to={`/checkout/${order.id}`} replace />

  const hospital = hospitalById(order.hospitalId)
  const other: PaymentMethod = lastFailed.method === 'upi' ? 'card' : 'upi'

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-144 -translate-x-1/2 rounded-full bg-amber-100/40 blur-3xl" aria-hidden />
      <div className="container-page relative max-w-3xl py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <Card className="overflow-hidden">
            <div className="bg-linear-to-b from-amber-50/80 to-white px-6 pt-10 pb-6 text-center sm:px-10">
              <CalmMark />
              <p className="eyebrow mt-6 text-amber-700">Payment not completed</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Your payment didn't go through</h1>
              <p className="mx-auto mt-3 max-w-lg text-ink-600">
                Nothing has been dispatched. Order <span className="font-semibold text-ink-900">{order.id}</span> is saved, so you can try again
                right away.
              </p>
            </div>

            <div className="px-6 pb-8 sm:px-10">
              <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-5">
                <p className="text-xs font-medium text-ink-500">Reason from the payment gateway</p>
                <p className="mt-1 text-lg font-semibold text-ink-950" role="status">
                  {lastFailed.failureReason ?? 'The payment was not completed.'}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <Fact label="Method">{METHOD_LABEL[lastFailed.method]}</Fact>
                  <Fact label="Instrument">
                    <span className="block truncate" title={lastFailed.instrument}>
                      {lastFailed.instrument}
                    </span>
                  </Fact>
                  <Fact label="Amount">
                    <span className="tabular">{formatINR(lastFailed.amount)}</span>
                  </Fact>
                  <Fact label="Attempted">
                    <span className="tabular">{formatDateTime(lastFailed.paidAt)}</span>
                  </Fact>
                </dl>
                <p className="mt-4 font-mono text-[11px] break-all text-ink-400">Ref {lastFailed.gatewayRef}</p>
              </div>

              <ul className="mt-6 space-y-4 text-sm">
                <Point icon={<ShieldCheck className="size-4.5 text-emerald-600" />}>
                  <span className="font-semibold text-ink-900">Your money is safe.</span> If any amount was debited, it is refunded automatically to
                  the same account within 5–7 working days. You won't be charged twice for this order.
                </Point>
                <Point icon={<Timer className="size-4.5 text-ice-600" />}>
                  <HoldLine deadline={deadline} />
                </Point>
                <Point icon={<Info className="size-4.5 text-ink-400" />}>{TIPS[lastFailed.method]}</Point>
              </ul>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <ButtonLink to={`/checkout/${order.id}`} size="lg" icon={<RotateCcw className="size-4" aria-hidden />} className="sm:col-span-3">
                  Retry payment · {formatINR(order.price.total)}
                </ButtonLink>
                <ButtonLink
                  to={`/checkout/${order.id}?method=${other}`}
                  variant="outline"
                  size="lg"
                  icon={<CreditCard className="size-4" aria-hidden />}
                  className="sm:col-span-2"
                >
                  Try {METHOD_LABEL[other]} instead
                </ButtonLink>
                <a href={`tel:${BRAND.supportPhone}`} className={buttonClass({ variant: 'ghost', size: 'lg' })}>
                  <Phone className="size-4" aria-hidden /> Contact support
                </a>
              </div>
              <p className="mt-4 text-center text-xs text-ink-500">
                24×7 support: {BRAND.supportPhone} · {BRAND.supportEmail}
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="mt-6">
          <CheckoutSummary order={order} hospital={hospital} centre={centre} showPrice={false} />
        </motion.div>

        <p className="mt-6 flex items-start justify-center gap-2 text-center text-sm text-ink-500">
          <Undo2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          If the transfusion can't wait, tell the treating team. The hospital's blood bank can also source units directly.
        </p>
      </div>
    </div>
  )
}

function HoldLine({ deadline }: { deadline: number | null }) {
  const now = useNow(1000)
  if (!deadline)
    return (
      <>
        <span className="font-semibold text-ink-900">Units are held for a short time.</span> We re-check stock at the nearest centre when you
        retry.
      </>
    )
  const remaining = deadline - now
  if (remaining <= 0)
    return (
      <>
        <span className="font-semibold text-ink-900">The 10-minute hold has lapsed.</span> We'll re-check stock at the nearest centre when you
        retry.
      </>
    )
  return (
    <>
      <span className="font-semibold text-ink-900">
        Your matched units are held for <span className="tabular">{formatClock(remaining)}</span> more.
      </span>{' '}
      Retry within this time to keep them.
    </>
  )
}

function Point({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-white shadow-soft ring-1 ring-ink-100" aria-hidden>
        {icon}
      </span>
      <p className="pt-1 leading-relaxed text-ink-600">{children}</p>
    </li>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{children}</dd>
    </div>
  )
}

/** Calm, non-alarming illustration: a card with a soft amber halo. */
function CalmMark() {
  return (
    <div className="relative mx-auto grid size-24 place-items-center" aria-hidden>
      <motion.span
        className="absolute inset-0 rounded-full bg-amber-100"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        initial={{ rotate: -8, y: 6, opacity: 0 }}
        animate={{ rotate: -6, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className={cn('relative grid h-12 w-16 place-items-center rounded-xl bg-white shadow-lift ring-1 ring-amber-200')}
      >
        <span className="absolute inset-x-0 top-3 h-2 bg-ink-900/80" />
        <span className="absolute bottom-2.5 left-2.5 h-1.5 w-6 rounded-full bg-ink-200" />
      </motion.span>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 14 }}
        className="absolute right-3 bottom-3 grid size-7 place-items-center rounded-full bg-amber-500 font-display text-sm font-bold text-white ring-4 ring-white"
      >
        !
      </motion.span>
    </div>
  )
}
