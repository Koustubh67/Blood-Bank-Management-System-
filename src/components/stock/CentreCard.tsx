import { forwardRef } from 'react'
import { BadgeCheck, Clock, MapPin, Star, Timer } from 'lucide-react'
import type { BloodCentre } from '@/types'
import { BLOOD_GROUPS } from '@/data/blood'
import { stockLevel } from '@/services/inventory'
import { cn, formatDistance } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { LiveNumber } from './LiveNumber'
import { LEVEL, componentLabel, type ComponentFilter } from './levels'
import { unitsFor } from './StockMatrix'

export const CentreCard = forwardRef<
  HTMLButtonElement,
  {
    centre: BloodCentre
    component: ComponentFilter
    distanceM: number
    fromLabel: string
    /** Estimated emergency handover time in minutes to the selected hospital */
    etaMin?: number
    selected: boolean
    onSelect: () => void
  }
>(function CentreCard({ centre, component, distanceM, fromLabel, etaMin, selected, onSelect }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group w-full scroll-mt-28 rounded-3xl border bg-white p-4 text-left shadow-soft transition-all duration-300 sm:p-5',
        selected ? 'border-ink-950 ring-2 ring-ink-950' : 'border-ink-100 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans text-base leading-snug font-semibold text-ink-950">{centre.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {centre.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="size-3.5" aria-hidden /> Licence {centre.licenseNo}
            </span>
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-50 px-2 py-1 text-xs font-semibold text-ink-800">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          {centre.rating.toFixed(1)}
          <span className="sr-only">out of 5</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {centre.open24x7 ? (
          <Badge tone="green">
            <Clock className="size-3.5" aria-hidden /> Open 24×7
          </Badge>
        ) : (
          <Badge tone="neutral">
            <Clock className="size-3.5" aria-hidden /> Limited hours
          </Badge>
        )}
        <Badge tone="neutral" className="tabular">
          {formatDistance(distanceM)} from {fromLabel}
        </Badge>
        {etaMin !== undefined && (
          <Badge tone="blue" className="tabular">
            <Timer className="size-3.5" aria-hidden /> ~{etaMin} min emergency
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-400 uppercase">{componentLabel(component)} · units</p>
        <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {BLOOD_GROUPS.map((g) => {
            const units = unitsFor(centre.inventory, g, component)
            const s = LEVEL[stockLevel(units)]
            return (
              <li key={g} className={cn('flex flex-col items-center rounded-xl px-1 py-1.5', s.tint)} title={`${g}: ${units} units, ${s.label.toLowerCase()}`}>
                <span className="text-[11px] font-semibold text-ink-600">{g}</span>
                <LiveNumber value={units} showDelta={false} className={cn('text-[15px] font-bold', units === 0 ? 'text-blood-700' : 'text-ink-950')} />
                <span className="sr-only">{s.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </button>
  )
})
