import type { BloodGroup } from '@/types'
import { BLOOD_GROUPS } from '@/data/blood'
import { cn } from '@/lib/utils'

export function BloodGroupBadge({ group, size = 'md', className }: { group: BloodGroup; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-2xl bg-blood-600 font-display font-bold text-white tabular',
        size === 'sm' && 'h-7 min-w-9 rounded-xl px-1.5 text-xs',
        size === 'md' && 'h-10 min-w-12 px-2 text-base',
        size === 'lg' && 'h-16 min-w-18 px-3 text-2xl',
        className,
      )}
    >
      {group}
    </span>
  )
}

/** 4×2 grid of blood group toggles. */
export function BloodGroupPicker({
  value,
  onChange,
  className,
  availability,
}: {
  value: BloodGroup | null
  onChange: (g: BloodGroup) => void
  className?: string
  /** Optional units-available count shown under each group */
  availability?: Partial<Record<BloodGroup, number>>
}) {
  return (
    <div role="radiogroup" aria-label="Blood group" className={cn('grid grid-cols-4 gap-2', className)}>
      {BLOOD_GROUPS.map((g) => {
        const active = value === g
        const units = availability?.[g]
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(g)}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border py-3 font-display text-lg font-bold transition-all',
              active
                ? 'border-blood-600 bg-blood-600 text-white shadow-glow'
                : 'border-ink-200 bg-white text-ink-900 hover:border-blood-300 hover:bg-blood-50',
            )}
          >
            {g}
            {units !== undefined && (
              <span className={cn('mt-0.5 font-sans text-[11px] font-medium', active ? 'text-white/80' : units === 0 ? 'text-blood-600' : 'text-ink-500')}>
                {units === 0 ? 'Out of stock' : `${units} units`}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
