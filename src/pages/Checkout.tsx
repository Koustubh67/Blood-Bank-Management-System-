import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CircleAlert, LockKeyhole, PackageSearch, TriangleAlert } from 'lucide-react'
import type { PaymentMethod } from '@/types'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { BRAND } from '@/config/brand'
import { hospitalById } from '@/data/network'
import { ApiError } from '@/services/api'
import { useCurrentUser } from '@/services/auth'
import { useCentres } from '@/services/inventory'
import { getOrder, rankCentres, useOrder } from '@/services/orders'
import {
  TEST_INSTRUMENTS,
  isValidUpiId,
  payForOrder,
  validatePayment,
  type CardDetails,
  type PaymentDetails,
} from '@/services/payments'
import { formatINR, sleep } from '@/lib/utils'
import { Note } from '@/components/order/parts'
import { clearHold, ensureHold, startHold } from '@/components/order/paymentHold'
import { CheckoutSummary } from '@/components/order/checkout/CheckoutSummary'
import { HoldTimer } from '@/components/order/checkout/HoldTimer'
import {
  CardPanel,
  CreditPanel,
  MethodPicker,
  NetbankingPanel,
  UpiPanel,
  cardFieldErrors,
  type FieldErrors,
} from '@/components/order/checkout/PaymentPanels'
import { ProcessingModal, type ProcessingOutcome } from '@/components/order/checkout/ProcessingModal'
import { TestModePanel, type TestFill } from '@/components/order/checkout/TestModePanel'
import { announcePayment, playSound } from '@/lib/sound'

const EMPTY_CARD: CardDetails = { number: '', expiry: '', cvv: '', name: '' }

function fieldErrorsFor(d: PaymentDetails): FieldErrors {
  switch (d.method) {
    case 'upi':
      return isValidUpiId(d.data.upiId) ? {} : { upiId: d.data.upiId ? 'Enter a valid UPI ID, like name@okhdfcbank.' : 'Enter your UPI ID.' }
    case 'card':
      return cardFieldErrors(d.data)
    case 'netbanking':
      return d.data.bankCode ? {} : { bankCode: 'Choose your bank.' }
    case 'credit':
      return d.data.poNumber.trim().length >= 3 ? {} : { poNumber: 'Enter your hospital purchase-order number.' }
  }
}

export default function Checkout() {
  const { orderId = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const order = useOrder(orderId)
  const centres = useCentres()

  const allowCredit = user?.role === 'hospital'
  const [method, setMethod] = useState<PaymentMethod>(() => {
    const m = search.get('method')
    if (m === 'upi' || m === 'card' || m === 'netbanking') return m
    if (m === 'credit' && allowCredit) return 'credit'
    return 'upi'
  })
  const [upiId, setUpiId] = useState('')
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD)
  const [bankCode, setBankCode] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [flipped, setFlipped] = useState(false)
  const [proc, setProc] = useState<{ open: boolean; step: number; outcome: ProcessingOutcome }>({ open: false, step: 0, outcome: 'pending' })
  const [deadline, setDeadline] = useState(() => (getOrder(orderId) ? ensureHold(orderId) : Date.now()))
  const [expired, setExpired] = useState(() => deadline <= Date.now())
  const formRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const hospital = order ? hospitalById(order.hospitalId) : undefined
  const centre = useMemo(() => centres.find((c) => c.id === order?.centreId), [centres, order?.centreId])
  const stockOk = useMemo(
    () => (order && hospital ? !!rankCentres(order.items, hospital.location, centres)[0]?.fulfillable : true),
    [order, hospital, centres],
  )
  const lastFailed = useMemo(() => [...(order?.payments ?? [])].reverse().find((p) => p.status === 'failed'), [order])

  const onExpire = useCallback(() => setExpired(true), [])

  // ---------- guards ----------

  const visible =
    !!order && !!user && (order.userId === user.id || (user.role === 'hospital' && !!user.hospitalId && user.hospitalId === order.hospitalId))

  if (!order || !visible)
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState
          icon={<PackageSearch className="size-6" />}
          title="We couldn't find that order"
          description="It may belong to another account, or the link is incomplete. Your orders are listed under My orders."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/orders" variant="outline">
                My orders
              </ButtonLink>
              <ButtonLink to="/order">Start a new order</ButtonLink>
            </div>
          }
        />
      </div>
    )

  if (!proc.open && order.status !== 'pending_payment' && order.status !== 'payment_failed')
    return <Navigate to={`/track/${order.id}`} replace />

  // ---------- actions ----------

  const details = (): PaymentDetails => {
    switch (method) {
      case 'upi':
        return { method, data: { upiId: upiId.trim() } }
      case 'card':
        return { method, data: card }
      case 'netbanking':
        return { method, data: { bankCode } }
      case 'credit':
        return { method, data: { poNumber } }
    }
  }

  const focusFirstError = () =>
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
      if (!el) return
      const target = el.matches('input, button') ? el : (el.querySelector<HTMLElement>('input, button') ?? el)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.focus({ preventScroll: true })
    })

  const restartHold = () => {
    if (!stockOk) {
      toast.error('These units are no longer available at one centre', `Call ${BRAND.supportPhone} and our desk will help source them.`)
      return
    }
    setDeadline(startHold(order.id))
    setExpired(false)
    toast.success('Stock re-checked', 'Your units are held for another 10 minutes.')
  }

  const pay = async () => {
    if (proc.open) return
    if (expired) {
      toast.error('Payment session expired', 'Re-check stock to start a new 10-minute hold.')
      return
    }
    const d = details()
    const fe = fieldErrorsFor(d)
    const problem = validatePayment(d)
    if (Object.keys(fe).length || problem) {
      setErrors(Object.keys(fe).length ? fe : { form: problem ?? 'Check your payment details.' })
      focusFirstError()
      return
    }
    setErrors({})
    setFlipped(false)
    setProc({ open: true, step: 0, outcome: 'pending' })
    const advance = (to: number) => setProc((p) => (p.outcome === 'pending' ? { ...p, step: Math.max(p.step, to) } : p))
    timers.current = [window.setTimeout(() => advance(1), 850), window.setTimeout(() => advance(2), 1800)]
    try {
      // Keep the animation on screen long enough to read, even if the gateway is quick.
      const [record] = await Promise.all([payForOrder(order.id, d), sleep(2300)])
      timers.current.forEach((t) => clearTimeout(t))
      if (record.status === 'success') {
        setProc({ open: true, step: 3, outcome: 'success' })
        playSound('payment')
        announcePayment(record.amount)
        clearHold(order.id)
        await sleep(950)
        navigate(`/order/${order.id}/success`, { replace: true })
      } else {
        setProc({ open: true, step: 1, outcome: 'failed' })
        playSound('failed')
        await sleep(1200)
        navigate(`/order/${order.id}/failed`)
      }
    } catch (err) {
      timers.current.forEach((t) => clearTimeout(t))
      setProc({ open: false, step: 0, outcome: 'pending' })
      toast.error(err instanceof ApiError ? err.message : 'Payment could not be started. Please try again.')
    }
  }

  const fill = (kind: TestFill) => {
    setErrors({})
    const expiry = `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, '0')}`
    const name = user?.role === 'individual' ? user.name : 'Test Cardholder'
    switch (kind) {
      case 'cardSuccess':
      case 'cardDecline':
        setMethod('card')
        setCard({ number: TEST_INSTRUMENTS[kind], expiry, cvv: '123', name })
        break
      case 'upiSuccess':
      case 'upiFail':
        setMethod('upi')
        setUpiId(TEST_INSTRUMENTS[kind])
        break
      case 'bankSuccess':
        setMethod('netbanking')
        setBankCode('HDFC')
        break
      case 'bankFail':
        setMethod('netbanking')
        setBankCode('TEST_FAIL')
        break
      case 'credit':
        setMethod('credit')
        setPoNumber(`PO-${new Date().getFullYear()}-0419`)
        break
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changeMethod = (m: PaymentMethod) => {
    setMethod(m)
    setErrors({})
  }

  const instrumentPreview = (() => {
    switch (method) {
      case 'upi':
        return upiId || 'UPI'
      case 'card':
        return `Card •••• ${card.number.replace(/\D/g, '').slice(-4)}`
      case 'netbanking':
        return 'Net banking'
      case 'credit':
        return 'Hospital credit'
    }
  })()

  const total = formatINR(order.price.total)
  const unitCount = order.items.reduce((s, i) => s + i.units, 0)

  return (
    <div>
      {/* ---------- header ---------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="pointer-events-none absolute -top-40 -left-24 size-96 rounded-full bg-ice-100/50 blur-3xl" aria-hidden />
        <div className="container-page relative py-8 sm:py-10">
          <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
            <ArrowLeft className="size-4" aria-hidden /> My orders
          </Link>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">
                <LockKeyhole className="size-3.5" aria-hidden /> Secure checkout
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
                Pay <span className="tabular">{total}</span> to confirm
              </h1>
              <p className="mt-2 text-ink-600">
                Order <span className="font-semibold text-ink-900">{order.id}</span> · {unitCount} unit{unitCount === 1 ? '' : 's'} for{' '}
                {hospital?.name ?? 'your hospital'}
              </p>
            </div>
            <HoldTimer deadline={deadline} onExpire={onExpire} onRestart={restartHold} className="self-start md:self-end" />
          </div>
        </div>
      </section>

      <div className="container-page grid grid-cols-1 items-start gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
        <div className="min-w-0 space-y-6">
          {order.status === 'payment_failed' && lastFailed && (
            <Note tone="amber" icon={<CircleAlert />} title="Your last attempt didn't go through">
              {lastFailed.failureReason ?? 'The payment was not completed.'} ({lastFailed.instrument}). If any money was debited it is refunded
              automatically within 5–7 working days. Try again or choose another method.
            </Note>
          )}
          {!stockOk && (
            <Note tone="red" icon={<TriangleAlert />} title="Stock changed since you ordered" role="alert">
              Some of these units are no longer available at a single nearby centre, so we've paused payment. Call{' '}
              <a href={`tel:${BRAND.supportPhone}`} className="font-semibold underline underline-offset-2">
                {BRAND.supportPhone}
              </a>{' '}
              and our desk will help source them.
            </Note>
          )}

          <Card className="p-5 sm:p-8">
            <div ref={formRef} className="scroll-mt-24">
              <h2 className="text-2xl font-bold">How would you like to pay?</h2>
              <p className="mt-1 text-sm text-ink-500">Choose a method. You can switch any time before paying.</p>
              <div className="mt-6">
                <MethodPicker value={method} onChange={changeMethod} allowCredit={allowCredit} />
              </div>

              <div className="mt-7 min-h-40">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    {method === 'upi' && <UpiPanel upiId={upiId} onChange={(v) => { setUpiId(v); setErrors({}) }} errors={errors} seed={order.id} />}
                    {method === 'card' && (
                      <CardPanel
                        card={card}
                        onChange={(patch) => {
                          setCard((c) => ({ ...c, ...patch }))
                          setErrors((e) => {
                            const keys = Object.keys(patch)
                            if (!keys.some((k) => k in e) && !e.form) return e
                            const n = { ...e }
                            for (const k of keys) delete n[k]
                            delete n.form
                            return n
                          })
                        }}
                        errors={errors}
                        flipped={flipped}
                        onFlip={setFlipped}
                      />
                    )}
                    {method === 'netbanking' && (
                      <NetbankingPanel bankCode={bankCode} onChange={(c) => { setBankCode(c); setErrors({}) }} errors={errors} />
                    )}
                    {method === 'credit' && allowCredit && (
                      <CreditPanel
                        poNumber={poNumber}
                        onChange={(v) => { setPoNumber(v); setErrors({}) }}
                        errors={errors}
                        hospitalName={hospital?.name}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {errors.form && (
                <p className="mt-4 text-sm font-medium text-blood-700" role="alert">
                  {errors.form}
                </p>
              )}

              <div className="mt-8 rounded-3xl bg-ink-50 p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ink-600">Amount payable</span>
                  <span className="font-display text-2xl font-bold text-ink-950 tabular">{total}</span>
                </div>
                <Button
                  size="xl"
                  className="mt-4 w-full"
                  onClick={pay}
                  disabled={expired || !stockOk || proc.open}
                  icon={<LockKeyhole className="size-5" aria-hidden />}
                >
                  Pay {total}
                </Button>
                <p className="mt-3 text-center text-xs leading-relaxed text-ink-500">
                  {expired
                    ? 'The 10-minute hold has lapsed. Re-check stock at the top to continue.'
                    : 'Charges cover processing and cold-chain logistics only. Blood itself is never sold.'}{' '}
                  <Link to="/legal/refunds" className="font-medium text-ink-700 underline underline-offset-2">
                    Refund policy
                  </Link>
                </p>
              </div>
            </div>
          </Card>

          <TestModePanel onFill={fill} showCredit={allowCredit} />
        </div>

        <aside aria-label="Order summary" className="min-w-0">
          <div className="lg:sticky lg:top-24">
            <CheckoutSummary order={order} hospital={hospital} centre={centre} />
          </div>
        </aside>
      </div>

      <ProcessingModal open={proc.open} step={proc.step} outcome={proc.outcome} amount={order.price.total} instrument={instrumentPreview} />
    </div>
  )
}
