import { useEffect, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import type { Priority } from '@/types'
import type { OpsOrder, OpsStage, RiderState } from '@/services/admin/types'
import { PRIORITY_LABEL, STAGE_LABEL, sla, type SlaState } from '@/services/admin/priority'
import { RIDER_STATE_LABEL } from '@/services/admin/dispatch'
import { initials } from '@/services/admin/names'
import { LiveDot } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

// ---------- page frame ----------

/** Page container with the tab title set; every admin page uses it. */
export function Page({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} · RaktFlow Operations`
    return () => {
      document.title = prev
    }
  }, [title])
  return <div className={cn('mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:px-8', className)}>{children}</div>
}

export function PageHead({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl leading-tight font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-600 sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A titled white card section. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  id?: string
}) {
  return (
    <section aria-labelledby={id} className={cn('min-w-0 rounded-3xl border border-ink-100 bg-white shadow-soft', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 id={id} className="font-sans text-[15px] font-semibold text-ink-950">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName ?? 'p-4 sm:p-5'}>{children}</div>
    </section>
  )
}

export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = 'ink',
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'ink' | 'red' | 'amber' | 'green'
  className?: string
}) {
  const ring = { ink: 'border-ink-100', red: 'border-blood-200 ring-1 ring-blood-100', amber: 'border-amber-200 ring-1 ring-amber-100', green: 'border-ink-100' }[tone]
  const chip = { ink: 'bg-ink-50 text-ink-600', red: 'bg-blood-50 text-blood-600', amber: 'bg-amber-50 text-amber-700', green: 'bg-emerald-50 text-emerald-700' }[tone]
  return (
    <div className={cn('flex min-w-0 flex-col rounded-3xl border bg-white p-4 shadow-soft', ring, className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-xs leading-snug font-medium text-ink-500">{label}</p>
        {icon && <span className={cn('grid size-7 shrink-0 place-items-center rounded-xl', chip)}>{icon}</span>}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-950 tabular sm:text-[28px]">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
    </div>
  )
}

// ---------- order signals ----------

export const PRIORITY_STYLE: Record<Priority, { pill: string; edge: string; dot: string }> = {
  emergency: { pill: 'bg-blood-600 text-white', edge: 'before:bg-blood-600', dot: 'bg-blood-600' },
  urgent: { pill: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200', edge: 'before:bg-amber-500', dot: 'bg-amber-500' },
  scheduled: { pill: 'bg-ice-50 text-ice-700 ring-1 ring-ice-100', edge: 'before:bg-ice-500', dot: 'bg-ice-500' },
}

export function PriorityPill({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase', PRIORITY_STYLE[priority].pill, className)}>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function StageBadge({ stage, className }: { stage: OpsStage; className?: string }) {
  const tone =
    stage === 'delivered'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : stage === 'rejected' || stage === 'cancelled'
        ? 'bg-ink-100 text-ink-600 ring-ink-200'
        : stage === 'out_for_delivery'
          ? 'bg-blood-50 text-blood-700 ring-blood-100'
          : 'bg-white text-ink-700 ring-ink-200'
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', tone, className)}>
      {stage === 'out_for_delivery' && <LiveDot className="size-1.5" />}
      {STAGE_LABEL[stage]}
    </span>
  )
}

const SLA_COLOR: Record<SlaState, string> = {
  ok: '#10b981',
  risk: '#d97706',
  breached: 'var(--color-blood-600)',
  met: '#10b981',
  missed: 'var(--color-blood-600)',
  closed: 'var(--color-ink-300)',
}

function slaText(state: SlaState, leftMs: number) {
  const m = Math.round(Math.abs(leftMs) / 60_000)
  if (state === 'met') return '✓'
  if (state === 'closed') return '–'
  if (state === 'missed') return `+${m}`
  if (leftMs < 0) return `+${m}`
  if (leftMs < 60_000) return `${Math.max(0, Math.round(leftMs / 1000))}s`
  return `${m}m`
}

function slaLabel(state: SlaState, leftMs: number) {
  const m = Math.round(Math.abs(leftMs) / 60_000)
  switch (state) {
    case 'met':
      return 'Dispatched within target'
    case 'missed':
      return `Dispatched ${m} min after target`
    case 'closed':
      return 'Closed'
    case 'breached':
      return `Dispatch target missed by ${m} min`
    default:
      return `${m} min left to dispatch`
  }
}

/** Countdown ring to the dispatch target; fills as time is used. */
export function SlaRing({ order, now, size = 40 }: { order: OpsOrder; now: number; size?: number }) {
  const s = sla(order, now)
  const r = (size - 5) / 2
  const c = 2 * Math.PI * r
  const used = Math.min(1, Math.max(0, s.used))
  const label = slaLabel(s.state, s.leftMs)
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={label} title={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={SLA_COLOR[s.state]}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (s.state === 'met' ? 1 : used))}
        />
      </svg>
      <span
        className={cn(
          'absolute text-[10px] font-bold tabular',
          s.state === 'breached' || s.state === 'missed' ? 'text-blood-700' : s.state === 'risk' ? 'text-amber-800' : 'text-ink-700',
        )}
        aria-hidden
      >
        {slaText(s.state, s.leftMs)}
      </span>
    </span>
  )
}

// ---------- riders ----------

const RIDER_TONE: Record<RiderState, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  to_pickup: 'bg-amber-50 text-amber-800 ring-amber-100',
  on_the_way: 'bg-blood-50 text-blood-700 ring-blood-100',
  returning: 'bg-ice-50 text-ice-700 ring-ice-100',
  off_shift: 'bg-ink-50 text-ink-500 ring-ink-100',
  leave: 'bg-white text-ink-500 ring-ink-200',
  inactive: 'bg-white text-ink-400 ring-ink-200',
}

export function RiderStateChip({ state, className }: { state: RiderState; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1', RIDER_TONE[state], className)}>
      {state === 'on_the_way' ? <LiveDot className="size-1.5" /> : <span className={cn('size-1.5 rounded-full bg-current opacity-70')} aria-hidden />}
      {RIDER_STATE_LABEL[state]}
    </span>
  )
}

export function Avatar({ name, className, tone = 'bg-ink-100 text-ink-700' }: { name: string; className?: string; tone?: string }) {
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold', tone, className)} aria-hidden>
      {initials(name)}
    </span>
  )
}

// ---------- controls ----------

export function Switch({ checked, onChange, label, description, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('group flex w-full items-start gap-3 rounded-2xl text-left', className)}
    >
      <span className={cn('relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-ink-950' : 'bg-ink-200')} aria-hidden>
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-soft transition-transform', checked && 'translate-x-4')} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink-950">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
      </span>
    </button>
  )
}

export function SearchField({ value, onChange, placeholder, label, className }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-ink-200 bg-white pr-9 pl-10 text-sm text-ink-950 placeholder:text-ink-400 focus:border-blood-500 focus:ring-4 focus:ring-blood-100 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-800" aria-label="Clear search">
          <X className="size-3.5" />
        </button>
      )}
    </label>
  )
}

/** Compact select for filter bars. */
export function FilterSelect({ label, value, onChange, children, className }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none truncate rounded-full border border-ink-200 bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%237c706a%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat pr-9 pl-4 text-sm font-medium text-ink-800 focus:border-blood-500 focus:ring-4 focus:ring-blood-100 focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}

/** Small inline tag, e.g. "Placed in app". */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-700 uppercase', className)}>{children}</span>
}

export function Kv({ k, children }: { k: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-ink-500">{k}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink-900">{children}</dd>
    </div>
  )
}

/** Light hint line shown under lists that were cut short. */
export function MoreButton({ shown, total, onMore, noun }: { shown: number; total: number; onMore: () => void; noun: string }) {
  if (shown >= total) return null
  return (
    <div className="flex justify-center pt-4">
      <button type="button" onClick={onMore} className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:border-ink-300 hover:bg-ink-50">
        Show more {noun} <span className="font-normal text-ink-500">({total - shown} left)</span>
      </button>
    </div>
  )
}
