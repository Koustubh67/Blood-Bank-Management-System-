import type { ReactNode } from 'react'
import { ArrowDown, BadgeCheck, CalendarDays, HandHeart, HeartHandshake, HeartPulse, type LucideIcon } from 'lucide-react'
import { LIVES_PER_DONATION, usePledgeStats } from '@/services/camps'
import { Prop } from '@/components/characters/Prop'
import { LiveNumber } from '@/components/stock/LiveNumber'
import { LiveDot, Skeleton } from '@/components/ui/primitives'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { plural } from './format'

interface Stat {
  icon: LucideIcon
  value: ReactNode
  label: string
  note: ReactNode
}

const format = (n: number) => n.toLocaleString(BRAND.locale)

/** "We count that": live camp total plus every pledge and confirmed donation made here. */
export function CampCounters({
  campCount,
  days,
  stateName,
  myPledgeCount,
  className,
}: {
  /** Camps returned for the state and range, or why there is no number yet */
  campCount: number | 'loading' | 'error'
  days: number
  stateName: string
  myPledgeCount: number
  className?: string
}) {
  const stats = usePledgeStats()

  const items: Stat[] = [
    {
      icon: CalendarDays,
      value:
        campCount === 'loading' ? (
          <Skeleton className="h-9 w-14 sm:h-10" />
        ) : campCount === 'error' ? (
          <span className="text-ink-300">—</span>
        ) : (
          <LiveNumber value={campCount} format={format} showDelta={false} />
        ),
      label: days === 0 ? 'camps today' : `camps in the next ${days} days`,
      note: (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <LiveDot className="size-1.5" color="bg-emerald-500" />
          <span className="truncate">{stateName}, e-RaktKosh</span>
        </span>
      ),
    },
    {
      icon: HandHeart,
      value: <LiveNumber value={stats.pledged} format={format} />,
      label: `pledges via ${BRAND.name}`,
      note: stats.camps > 0 ? `across ${plural(stats.camps, 'camp')}` : 'Be the first',
    },
    {
      icon: BadgeCheck,
      value: <LiveNumber value={stats.donated} format={format} />,
      label: 'donations confirmed',
      note: 'by donors, after the camp',
    },
    {
      icon: HeartPulse,
      value: <LiveNumber value={stats.livesHelped} format={format} />,
      label: 'lives helped',
      note: `up to ${LIVES_PER_DONATION} per donation`,
    },
  ]

  return (
    <div className={cn('rounded-4xl border border-ink-100 bg-white/85 p-4 shadow-soft backdrop-blur sm:p-6', className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex items-center gap-4 lg:w-80 lg:shrink-0">
          <Prop icon={HeartHandshake} tone="emerald" className="w-14 sm:w-16" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold sm:text-2xl">We count that.</h2>
            <p className="mt-1 text-sm text-ink-600">
              Every pledge made here joins these totals. Tell us after you donate and it counts towards lives helped.
            </p>
            {myPledgeCount > 0 && (
              <a
                href="#my-pledges"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blood-700 underline-offset-4 hover:underline"
              >
                Your pledges ({myPledgeCount}) <ArrowDown className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>

        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {items.map(({ icon: Icon, value, label, note }) => (
            <div key={label} className="flex min-w-0 flex-col rounded-2xl border border-ink-100 bg-paper p-3 sm:p-4">
              <dt className="order-2 mt-1.5 text-xs leading-snug font-medium text-ink-700 sm:text-[13px]">{label}</dt>
              <dd className="order-1 flex items-center justify-between gap-2">
                <div className="font-display text-3xl leading-none font-bold tracking-tight text-ink-950 tabular sm:text-4xl">{value}</div>
                <Icon className="size-4 shrink-0 text-blood-600 sm:size-5" aria-hidden />
              </dd>
              <dd className="order-3 mt-0.5 min-w-0 text-[11px] leading-snug text-ink-500">{note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
