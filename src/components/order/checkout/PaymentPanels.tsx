import { useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { Building, CircleCheck, CreditCard, Info, Landmark, Smartphone } from 'lucide-react'
import type { PaymentMethod } from '@/types'
import {
  BANKS,
  cardBrand,
  digitsOnly,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  isValidUpiId,
  luhnValid,
  type CardDetails,
} from '@/services/payments'
import { Field, Input } from '@/components/ui/primitives'
import { LogoMark } from '@/components/ui/Logo'
import { cn, hashString, seeded } from '@/lib/utils'
import { BrandMark, CardPreview } from './CardPreview'

export type FieldErrors = Record<string, string>

// ---------- method picker ----------

const METHODS: { value: PaymentMethod; label: string; hint: string; icon: typeof CreditCard }[] = [
  { value: 'upi', label: 'UPI', hint: 'Any UPI app', icon: Smartphone },
  { value: 'card', label: 'Card', hint: 'Debit or credit', icon: CreditCard },
  { value: 'netbanking', label: 'Net banking', hint: 'All major banks', icon: Landmark },
  { value: 'credit', label: 'Hospital credit', hint: 'Pay on invoice', icon: Building },
]

export function MethodPicker({
  value,
  onChange,
  allowCredit,
}: {
  value: PaymentMethod
  onChange: (m: PaymentMethod) => void
  allowCredit: boolean
}) {
  const methods = METHODS.filter((m) => m.value !== 'credit' || allowCredit)
  return (
    <div role="radiogroup" aria-label="Payment method" className={cn('grid grid-cols-1 gap-2.5', allowCredit ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}>
      {methods.map((m) => {
        const on = m.value === value
        const Icon = m.icon
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m.value)}
            className={cn(
              'relative flex items-center gap-3 rounded-2xl border p-3.5 pr-10 text-left transition-all sm:flex-col sm:items-start sm:p-4 sm:pr-4',
              on ? 'border-ink-950 bg-ink-950 text-white shadow-lift' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50/60',
            )}
          >
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', on ? 'bg-white/10 text-white' : 'bg-ink-50 text-ink-700')}>
              <Icon className="size-4.5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className={cn('block text-xs', on ? 'text-ink-300' : 'text-ink-500')}>{m.hint}</span>
            </span>
            {on && (
              <motion.span layoutId="method-check" className="absolute top-1/2 right-3.5 -translate-y-1/2 text-emerald-400 sm:top-3 sm:right-3 sm:translate-y-0">
                <CircleCheck className="size-4.5" aria-hidden />
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------- UPI ----------

const UPI_HANDLES = ['@okhdfcbank', '@okaxis', '@okicici', '@ybl', '@paytm']

export function UpiPanel({
  upiId,
  onChange,
  errors,
  seed,
}: {
  upiId: string
  onChange: (v: string) => void
  errors: FieldErrors
  seed: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const valid = isValidUpiId(upiId)
  const setHandle = (h: string) => {
    const name = upiId.split('@')[0]
    onChange(`${name}${h}`)
    const input = wrapRef.current?.querySelector('input')
    input?.focus()
    // No name typed yet: put the caret before the handle so they can type it.
    if (!name) requestAnimationFrame(() => input?.setSelectionRange(0, 0))
  }
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div>
        <Field label="UPI ID" required error={errors.upiId} hint="You'll approve a collect request in your UPI app.">
          {(id) => (
            <div className="relative" ref={wrapRef}>
              <Input
                id={id}
                value={upiId}
                onChange={(e) => onChange(e.target.value.replace(/\s/g, ''))}
                placeholder="yourname@okhdfcbank"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                className="pr-11"
                aria-invalid={!!errors.upiId || undefined}
              />
              {valid && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 right-4 -translate-y-1/2 text-emerald-600">
                  <CircleCheck className="size-5" aria-label="Valid format" />
                </motion.span>
              )}
            </div>
          )}
        </Field>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Common UPI handles">
          {UPI_HANDLES.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHandle(h)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700 hover:border-ink-300 hover:bg-ink-50"
            >
              {h}
            </button>
          ))}
        </div>
      </div>
      <QrBlock seed={seed} />
    </div>
  )
}

/** Decorative QR-style pattern. Not a real payment QR. */
function QrBlock({ seed }: { seed: string }) {
  const N = 25
  const cells = useMemo(() => {
    const rand = seeded(hashString(seed))
    const out: [number, number][] = []
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    const inLogo = (x: number, y: number) => x > 9 && x < 15 && y > 9 && y < 15
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && !inLogo(x, y) && rand() > 0.52) out.push([x, y])
    return out
  }, [seed])
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} rx={1.6} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1.1} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.7} fill="currentColor" />
    </g>
  )
  return (
    <div className="hidden flex-col items-center gap-3 sm:flex" aria-hidden>
      <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-3 shadow-soft">
        <svg viewBox={`0 0 ${N} ${N}`} className="size-36 text-ink-950" shapeRendering="crispEdges">
          {cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
          ))}
          {finder(0, 0)}
          {finder(N - 7, 0)}
          {finder(0, N - 7)}
        </svg>
        <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl bg-white">
          <LogoMark className="size-7" />
        </span>
        <motion.span
          className="absolute inset-x-3 h-10 bg-linear-to-b from-transparent via-blood-500/25 to-transparent"
          initial={{ top: 0 }}
          animate={{ top: ['2%', '72%', '2%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <p className="text-center text-xs leading-tight text-ink-500">
        <span className="font-semibold text-ink-800">Scan with any UPI app</span>
        <br />
        Decorative in test mode
      </p>
    </div>
  )
}

// ---------- Card ----------

export function cardFieldErrors(c: CardDetails): FieldErrors {
  const e: FieldErrors = {}
  const digits = digitsOnly(c.number)
  if (!luhnValid(c.number)) e.number = digits.length < 12 ? 'Enter the full card number.' : 'This card number looks incorrect.'
  if (!expiryValid(c.expiry)) e.expiry = /^\d{2}\/\d{2}$/.test(c.expiry) ? 'Card has expired or month is invalid.' : 'Use MM/YY.'
  const cvvLen = cardBrand(c.number) === 'amex' ? 4 : 3
  if (digitsOnly(c.cvv).length !== cvvLen) e.cvv = `${cvvLen} digits.`
  if (c.name.trim().length < 2) e.name = 'Enter the name printed on the card.'
  return e
}

export function CardPanel({
  card,
  onChange,
  errors,
  flipped,
  onFlip,
}: {
  card: CardDetails
  onChange: (patch: Partial<CardDetails>) => void
  errors: FieldErrors
  flipped: boolean
  onFlip: (v: boolean) => void
}) {
  const brand = cardBrand(card.number)
  const cvvLen = brand === 'amex' ? 4 : 3
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <CardPreview {...card} flipped={flipped} className="mx-auto xl:mx-0" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Card number" required error={errors.number} className="col-span-2">
          {(id) => (
            <div className="relative">
              <Input
                id={id}
                value={card.number}
                onChange={(e) => onChange({ number: formatCardNumber(e.target.value) })}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                className="pr-28 font-medium tracking-wide tabular"
                aria-invalid={!!errors.number || undefined}
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-ink-800">
                {brand === 'unknown' ? <CreditCard className="size-5 text-ink-300" aria-hidden /> : <BrandMark brand={brand} />}
              </span>
            </div>
          )}
        </Field>
        <Field label="Expiry" required error={errors.expiry}>
          {(id) => (
            <Input
              id={id}
              value={card.expiry}
              onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              className="tabular"
              aria-invalid={!!errors.expiry || undefined}
            />
          )}
        </Field>
        <Field label="CVV" required error={errors.cvv}>
          {(id) => (
            <Input
              id={id}
              type="password"
              value={card.cvv}
              onChange={(e) => onChange({ cvv: digitsOnly(e.target.value).slice(0, cvvLen) })}
              onFocus={() => onFlip(true)}
              onBlur={() => onFlip(false)}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={'•'.repeat(cvvLen)}
              className="tabular"
              aria-invalid={!!errors.cvv || undefined}
            />
          )}
        </Field>
        <Field label="Name on card" required error={errors.name} className="col-span-2">
          {(id) => (
            <Input
              id={id}
              value={card.name}
              onChange={(e) => onChange({ name: e.target.value.slice(0, 40) })}
              autoComplete="cc-name"
              placeholder="As printed on the card"
              aria-invalid={!!errors.name || undefined}
            />
          )}
        </Field>
      </div>
    </div>
  )
}

// ---------- Net banking ----------

const BANK_MONOGRAM: Record<string, string> = {
  SBIN: 'SBI',
  HDFC: 'HDFC',
  ICIC: 'ICICI',
  UTIB: 'AXIS',
  KKBK: 'KMB',
  PUNB: 'PNB',
  BARB: 'BOB',
  TEST_FAIL: 'TEST',
}

export function NetbankingPanel({
  bankCode,
  onChange,
  errors,
}: {
  bankCode: string
  onChange: (code: string) => void
  errors: FieldErrors
}) {
  return (
    <div data-invalid={errors.bankCode ? 'true' : undefined}>
      <p id="bank-label" className="mb-3 text-sm font-medium text-ink-800">
        Choose your bank<span className="ml-0.5 text-blood-600">*</span>
      </p>
      <div role="radiogroup" aria-labelledby="bank-label" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {BANKS.map((b) => {
          const on = b.code === bankCode
          const test = b.code === 'TEST_FAIL'
          const mono = BANK_MONOGRAM[b.code] ?? b.code.slice(0, 3)
          return (
            <button
              key={b.code}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(b.code)}
              className={cn(
                'flex flex-col items-start gap-2.5 rounded-2xl border p-3 text-left transition-all',
                on
                  ? test
                    ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-100'
                    : 'border-ink-950 bg-white ring-4 ring-ink-100'
                  : test
                    ? 'border-dashed border-amber-300 bg-amber-50/40 hover:border-amber-400'
                    : 'border-ink-200 bg-white hover:border-ink-300',
              )}
            >
              <span
                className={cn(
                  'grid h-9 min-w-9 place-items-center rounded-xl px-1.5 font-display text-[11px] font-bold tracking-tight',
                  test ? 'bg-amber-100 text-amber-800' : on ? 'bg-ink-950 text-white' : 'bg-ink-50 text-ink-700',
                )}
              >
                {mono}
              </span>
              <span className="text-xs leading-snug font-semibold text-ink-900">{b.name}</span>
            </button>
          )
        })}
      </div>
      {errors.bankCode && (
        <p className="mt-2 text-xs font-medium text-blood-700" role="alert">
          {errors.bankCode}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-500">You'll be redirected to your bank's secure page to approve the payment.</p>
    </div>
  )
}

// ---------- Hospital credit ----------

export function CreditPanel({
  poNumber,
  onChange,
  errors,
  hospitalName,
}: {
  poNumber: string
  onChange: (v: string) => void
  errors: FieldErrors
  hospitalName?: string
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
      <Field label="Purchase-order number" required error={errors.poNumber} hint="From your hospital's purchase or stores department.">
        {(id) => (
          <Input
            id={id}
            value={poNumber}
            onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 30))}
            placeholder="PO-2025-0419"
            autoComplete="off"
            aria-invalid={!!errors.poNumber || undefined}
          />
        )}
      </Field>
      <div className="flex gap-3 rounded-2xl bg-ice-50/70 p-4 text-sm text-ice-700">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Billed to <span className="font-semibold">{hospitalName ?? 'your hospital'}</span> on your agreed credit terms. A GST invoice for the
          logistics fee is sent to your accounts team. Available to verified hospital accounts only.
        </p>
      </div>
    </div>
  )
}
