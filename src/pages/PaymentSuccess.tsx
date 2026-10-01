import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Navigation, Package, PackageSearch, Printer } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/primitives'
import { hospitalById } from '@/data/network'
import { useCurrentUser } from '@/services/auth'
import { useCentres } from '@/services/inventory'
import { useOrder } from '@/services/orders'
import { Confetti, SuccessMark } from '@/components/order/success/Celebration'
import { CopyButton, LiveEtaCard, NextSteps, OtpCard } from '@/components/order/success/SuccessCards'
import { Receipt } from '@/components/order/success/Receipt'

const FRESH_MS = 3 * 60_000

export default function PaymentSuccess() {
  const { orderId = '' } = useParams()
  const order = useOrder(orderId)
  const user = useCurrentUser()
  const centres = useCentres()
  const centre = useMemo(() => centres.find((c) => c.id === order?.centreId), [centres, order?.centreId])
  const payment = useMemo(() => [...(order?.payments ?? [])].reverse().find((p) => p.status === 'success'), [order])
  // Celebrate only right after paying, not when revisiting the page later.
  const [fresh] = useState(() => !!order?.placedAt && Date.now() - order.placedAt < FRESH_MS)

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

  if (order.status === 'pending_payment' || order.status === 'payment_failed') return <Navigate to={`/checkout/${order.id}`} replace />

  const hospital = hospitalById(order.hospitalId)
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <div className="print:bg-white">
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white print:hidden">
        <div className="grain pointer-events-none absolute inset-0 opacity-50 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute top-0 left-1/2 size-144 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood-100/50 blur-3xl" aria-hidden />
        {fresh && <Confetti seed={order.id} />}
        <div className="container-page relative flex flex-col items-center py-10 text-center sm:py-14">
          <SuccessMark />
          <motion.p {...rise(0.35)} className="eyebrow mt-4 text-emerald-700">
            Payment confirmed
          </motion.p>
          <motion.h1 {...rise(0.45)} className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl lg:text-6xl">
            Your order is confirmed
          </motion.h1>
          <motion.p {...rise(0.55)} className="mt-4 max-w-2xl text-ink-600 sm:text-lg">
            We've sent the requisition to <span className="font-semibold text-ink-900">{centre?.name ?? 'the blood centre'}</span>. Units will
            be handed over at the blood transfusion desk of <span className="font-semibold text-ink-900">{hospital?.name ?? 'your hospital'}</span>.
          </motion.p>
          <motion.div {...rise(0.65)} className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1.5 pr-1.5 pl-4 shadow-soft">
            <span className="text-sm text-ink-500">Order ID</span>
            <span className="font-mono text-sm font-bold tracking-wider text-ink-950">{order.id}</span>
            <CopyButton value={order.id} label="Order ID" />
          </motion.div>
          <motion.div {...rise(0.75)} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink to={`/track/${order.id}`} size="lg" icon={<Navigation className="size-4" aria-hidden />}>
              Track live
            </ButtonLink>
            <Button variant="outline" size="lg" onClick={() => window.print()} icon={<Printer className="size-4" aria-hidden />}>
              Download receipt
            </Button>
            <ButtonLink to="/orders" variant="ghost" size="lg" icon={<Package className="size-4" aria-hidden />}>
              My orders
            </ButtonLink>
          </motion.div>
        </div>
      </section>

      {/* ---------- details ---------- */}
      <div className="container-page grid grid-cols-1 items-start gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8 lg:py-12 print:block print:max-w-none print:p-0">
        <motion.div {...rise(0.5)} className="min-w-0 space-y-6 print:hidden">
          <OtpCard otp={order.handoverOtp} />
          <LiveEtaCard order={order} />
          <NextSteps />
        </motion.div>
        <motion.div {...rise(0.6)} className="min-w-0">
          <Receipt order={order} payment={payment} hospital={hospital} centre={centre} />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 print:hidden">
            <p className="text-xs text-ink-500">Use "Save as PDF" in the print dialog to download.</p>
            <ButtonLink to={`/track/${order.id}`} variant="ghost" size="sm">
              Open live tracking <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
