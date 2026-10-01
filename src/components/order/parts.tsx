import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Minus, Plus, ShieldCheck } from 'lucide-react'
import type { OrderItem, PriceBreakdown } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { FEES } from '@/config/brand'
import { cn, formatINR } from '@/lib/utils'

// ---------- step heading ----------

export function StepHeading({ step, total, title, description }: { step: number; total: number; title: string; description?: ReactNode }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold tracking-[0.18em] text-ink-500 uppercase">
        Step {step + 1} of {total}
      </p>
      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-ink-600">{description}</p>}
    </div>
  )
}

export function SubHeading({ icon, title, hint, className }: { icon?: ReactNode; title: string; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex items-start gap-3', className)}>
      {icon && <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-700">{icon}</span>}
      <div className="min-w-0">
        <h3 className="font-sans text-base font-semibold text-ink-950">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-ink-500">{hint}</p>}
      </div>
    </div>
  )
}

// ---------- callouts ----------

type NoteTone = 'ice' | 'amber' | 'red' | 'neutral' | 'green'
const noteTones: Record<NoteTone, string> = {
  ice: 'border-ice-100 bg-ice-50/70 text-ice-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  red: 'border-blood-100 bg-blood-50 text-blood-800',
  neutral: 'border-ink-100 bg-ink-50 text-ink-700',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-800',
}

export function Note({ tone = 'neutral', icon, title, children, className, role }: { tone?: NoteTone; icon?: ReactNode; title?: ReactNode; children?: ReactNode; className?: string; role?: string }) {
  return (
    <div className={cn('flex gap-3 rounded-2xl border p-4 text-sm', noteTones[tone], className)} role={role}>
      {icon && <span className="mt-px shrink-0 [&>svg]:size-4.5">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('leading-relaxed', title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
    </div>
  )
}

// ---------- choice card (radio) ----------

export function ChoiceCard({
  selected,
  onSelect,
  children,
  className,
  disabled,
  tone = 'red',
  ...aria
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
  tone?: 'red' | 'dark' | 'ice'
  'aria-label'?: string
}) {
  const active = {
    red: 'border-blood-600 bg-blood-50/40 ring-4 ring-blood-100',
    dark: 'border-ink-950 bg-white ring-4 ring-ink-100',
    ice: 'border-ice-600 bg-ice-50/60 ring-4 ring-ice-100',
  }[tone]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-2xl border bg-white text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        selected ? active : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/60',
        className,
      )}
      {...aria}
    >
      {children}
    </button>
  )
}

// ---------- unit stepper ----------

export function UnitStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  label: string
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 bg-white p-1" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="One unit fewer"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-9 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 active:scale-95 disabled:opacity-35"
      >
        <Minus className="size-4" />
      </button>
      <span className="relative w-10 overflow-hidden text-center" aria-live="polite">
        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="block font-display text-lg font-bold tabular"
        >
          {value}
        </motion.span>
        <span className="sr-only">units</span>
      </span>
      <button
        type="button"
        aria-label="One unit more"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-9 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 active:scale-95 disabled:opacity-35"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

// ---------- component chip ----------

export function ComponentDot({ code, className }: { code: OrderItem['component']; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full', className)} style={{ background: COMPONENTS[code].tone }} />
}

// ---------- price ----------

export function PriceLines({
  items,
  price,
  className,
  showItems = true,
  compact = false,
  totalLabel = 'Total payable',
}: {
  items: OrderItem[]
  price: PriceBreakdown
  className?: string
  showItems?: boolean
  compact?: boolean
  totalLabel?: string
}) {
  const gstPct = Math.round(FEES.logisticsGstRate * 100)
  const gap = compact ? 'pt-2' : 'pt-3'
  return (
    <div className={cn('text-sm', className)}>
      {showItems && (
        <p className="mb-2.5 text-xs font-semibold tracking-wide text-ink-500 uppercase">Processing charges</p>
      )}
      <dl className={compact ? 'space-y-2' : 'space-y-2.5'}>
        {showItems ? (
          items.length === 0 ? (
            <div>
              <dt className="sr-only">Items</dt>
              <dd className="text-ink-400">Add a component to see charges</dd>
            </div>
          ) : (
            items.map((i) => (
              <div key={`${i.component}-${i.group}`} className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 text-ink-700">
                  <span className="font-medium text-ink-900">
                    {COMPONENTS[i.component].short} · {i.group}
                  </span>{' '}
                  <span className="whitespace-nowrap text-ink-500 tabular">
                    {i.units} × {formatINR(COMPONENTS[i.component].processingCharge)}
                  </span>
                </dt>
                <dd className="shrink-0 font-medium tabular text-ink-900">
                  {formatINR(COMPONENTS[i.component].processingCharge * i.units)}
                </dd>
              </div>
            ))
          )
        ) : (
          <Row label="Processing charges" value={formatINR(price.processing)} />
        )}
        <Row label="Cold-chain logistics" value={formatINR(price.logistics)} className={cn('border-t border-dashed border-ink-200', gap)} />
        <Row label={`GST on logistics (${gstPct}%)`} value={formatINR(price.logisticsGst)} />
        <div className={cn('flex items-baseline justify-between gap-3 border-t border-ink-200', gap)}>
          <dt className="font-semibold text-ink-950">{totalLabel}</dt>
          <dd className="font-display text-2xl font-bold tabular text-ink-950">
            <motion.span key={price.total} initial={{ opacity: 0.2, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
              {formatINR(price.total)}
            </motion.span>
          </dd>
        </div>
      </dl>
    </div>
  )
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <dt className="text-ink-600">{label}</dt>
      <dd className="font-medium tabular text-ink-900">{value}</dd>
    </div>
  )
}

export function NeverSoldNote({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-2.5 rounded-2xl bg-ink-50 p-3.5 text-xs leading-relaxed text-ink-600', className)}>
      <ShieldCheck className="mt-px size-4 shrink-0 text-emerald-600" aria-hidden />
      <p>
        <span className="font-semibold text-ink-900">Blood is never sold.</span> You pay only the government-capped processing charge
        per unit and a flat cold-chain delivery fee. GST applies to logistics only.
      </p>
    </div>
  )
}

/** Definition row used in summaries and receipts. */
export function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium wrap-break-word text-ink-900">{children}</dd>
    </div>
  )
}
