import type { ComponentCode } from '@/types'
import type { StockLevel } from '@/services/inventory'
import { COMPONENTS } from '@/data/blood'
import { cn } from '@/lib/utils'

export type ComponentFilter = ComponentCode | 'ALL'

/** Status styling for stock levels. Always paired with a text label, never colour alone. */
export const LEVEL: Record<StockLevel, { label: string; dot: string; text: string; tint: string; bar: string; track: string }> = {
  good: {
    label: 'Good stock',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    tint: 'bg-emerald-50',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100',
  },
  ok: {
    label: 'Available',
    dot: 'bg-emerald-300',
    text: 'text-emerald-700',
    tint: 'bg-emerald-50/60',
    bar: 'bg-emerald-400',
    track: 'bg-emerald-50',
  },
  low: {
    label: 'Running low',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    tint: 'bg-amber-50',
    bar: 'bg-amber-500',
    track: 'bg-amber-100',
  },
  out: {
    label: 'Out of stock',
    dot: 'bg-blood-600',
    text: 'text-blood-700',
    tint: 'bg-blood-50',
    bar: 'bg-blood-600',
    track: 'bg-blood-100',
  },
}

export function LevelLabel({ level, className }: { level: StockLevel; className?: string }) {
  const s = LEVEL[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', s.text, className)}>
      <span className={cn('size-2 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}

export function componentLabel(c: ComponentFilter) {
  return c === 'ALL' ? 'All components' : COMPONENTS[c].short
}

/** Build an /order link that pre-fills the order form. */
export function orderHref(group: string, component?: ComponentFilter) {
  const q = new URLSearchParams({ group })
  if (component && component !== 'ALL') q.set('component', component)
  return `/order?${q.toString()}`
}
