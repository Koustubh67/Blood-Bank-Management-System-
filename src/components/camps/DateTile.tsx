import { cn } from '@/lib/utils'
import { dateParts } from './format'

const TONES = {
  red: 'bg-blood-50 text-blood-700',
  green: 'bg-emerald-50 text-emerald-700',
  muted: 'bg-ink-100 text-ink-500',
  white: 'bg-white text-ink-950 ring-1 ring-ink-100',
} as const

/** Calendar-page style date: month, day, weekday. Reads as the full date to screen readers. */
export function DateTile({ iso, tone = 'red', className }: { iso: string; tone?: keyof typeof TONES; className?: string }) {
  const d = dateParts(iso)
  return (
    <span className={cn('flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 text-center', TONES[tone], className)}>
      <span className="sr-only">{d.long}</span>
      <span aria-hidden className="text-[10px] font-semibold tracking-wide uppercase">
        {d.month}
      </span>
      <span aria-hidden className="font-display text-2xl leading-none font-bold tabular">
        {d.day}
      </span>
      <span aria-hidden className="mt-0.5 text-[10px] font-medium opacity-80">
        {d.weekday}
      </span>
    </span>
  )
}
