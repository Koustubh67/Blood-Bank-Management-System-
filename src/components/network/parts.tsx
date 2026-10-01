import { forwardRef, type ReactNode } from 'react'
import { Database, Loader2, PhoneOff, RefreshCw, Snowflake, type LucideIcon } from 'lucide-react'
import type { HospitalSource, LoadState } from '@/services/hospitals'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { LiveDot, Skeleton } from '@/components/ui/primitives'
import { Prop } from '@/components/characters/Prop'

// ---------- Selectable card ----------

/**
 * Card whose title is a toggle button stretched over the whole card, so links
 * inside it (phone, website) stay real links instead of nesting in a button.
 */
export const SelectableCard = forwardRef<
  HTMLElement,
  { title: ReactNode; selected: boolean; onSelect: () => void; className?: string; children?: ReactNode }
>(function SelectableCard({ title, selected, onSelect, className, children }, ref) {
  return (
    <article
      ref={ref}
      className={cn(
        'relative w-full scroll-mt-28 rounded-3xl border bg-white p-4 shadow-soft transition-all duration-300 sm:p-5',
        selected ? 'border-ink-950 ring-2 ring-ink-950' : 'border-ink-100 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift',
        className,
      )}
    >
      <h3 className="font-sans text-base leading-snug font-semibold text-ink-950">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-blood-600"
        >
          {title}
        </button>
      </h3>
      {children}
    </article>
  )
})

/** Small red rounded square with a snowflake: the outlet glyph used on the map too. */
export function OutletGlyph({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl bg-blood-600 text-white ring-2 ring-white', className)} aria-hidden>
      <Snowflake className={cn('size-4', iconClassName)} strokeWidth={2.4} />
    </span>
  )
}

// ---------- Data source ----------

/**
 * Where the hospital list came from. The bundled OpenStreetMap copy shows
 * instantly; live data swaps in when the background refresh lands.
 */
export function SourceChip({ status, source, refreshing }: { status: LoadState; source?: HospitalSource; refreshing: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
      {source === 'live' && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
          <LiveDot color="bg-emerald-500" className="size-2" /> Live · OpenStreetMap
        </span>
      )}
      {source === 'snapshot' && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700 ring-1 ring-ink-100"
          title="A saved copy of OpenStreetMap's hospital data for Delhi, shown while live data loads."
        >
          <Database className="size-3.5 text-ink-500" aria-hidden /> OpenStreetMap · saved copy
        </span>
      )}
      {(refreshing || (status === 'loading' && !source)) && (
        <span className="inline-flex items-center gap-1.5 px-1 text-xs font-medium text-ink-500">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Updating from OpenStreetMap…
        </span>
      )}
    </div>
  )
}

// ---------- List states ----------

export function CardSkeletons({ count = 4 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-3.5 w-1/2" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-14 w-full rounded-2xl" />
        </li>
      ))}
    </ul>
  )
}

/** Friendly empty / error card with an illustrated prop. */
export function IllustratedState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  tone?: 'neutral' | 'warm'
}) {
  return (
    <div
      className={cn(
        'relative isolate flex flex-col items-center overflow-hidden rounded-4xl border border-dashed px-6 py-10 text-center sm:py-12',
        tone === 'warm' ? 'border-blood-200 bg-blood-50/40' : 'border-ink-200 bg-white',
      )}
    >
      <span aria-hidden className="absolute top-6 left-1/2 -z-10 size-36 -translate-x-1/2 rounded-full bg-ink-100/70 blur-2xl" />
      <Prop icon={icon} tone={tone === 'warm' ? 'blood' : 'ink'} float className="w-16 sm:w-20" />
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-ink-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function HospitalsError({ onRetry }: { onRetry: () => void }) {
  return (
    <IllustratedState
      icon={PhoneOff}
      tone="warm"
      title="We couldn't reach the hospital map"
      description="OpenStreetMap didn't answer just now. Our outlets are still listed in the other tab."
      action={
        <Button variant="dark" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden />}>
          Try again
        </Button>
      }
    />
  )
}
