import { forwardRef } from 'react'
import { ArrowUpRight, BedDouble, Globe, Landmark, MapPin, Navigation, Phone, Siren, Timer } from 'lucide-react'
import type { RealHospital } from '@/types'
import type { OutletNearest } from '@/services/outlets'
import { cn, formatDistance } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { OutletGlyph, SelectableCard } from './parts'

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Website'
  }
}

const linkClass =
  'relative z-10 inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-ink-100 hover:text-ink-950'

/** A real hospital from OpenStreetMap, with its nearest RaktFlow outlet. Never implies partnership. */
export const HospitalCard = forwardRef<
  HTMLElement,
  {
    hospital: RealHospital
    /** Straight-line distance from the current origin */
    distanceM: number
    fromLabel: string
    /** Null when no outlet is close enough to quote a ride */
    nearest: OutletNearest | null
    selected: boolean
    onSelect: () => void
  }
>(function HospitalCard({ hospital: h, distanceM, fromLabel, nearest, selected, onSelect }, ref) {
  const hasBadges = h.emergency || h.ownership || h.beds
  return (
    <SelectableCard ref={ref} title={h.name} selected={selected} onSelect={onSelect}>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
        {h.area && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {h.area}
          </span>
        )}
        <span className="inline-flex items-center gap-1 tabular">
          <Navigation className="size-3.5" aria-hidden /> {formatDistance(distanceM)} from {fromLabel}
        </span>
      </p>

      {hasBadges && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {h.emergency && (
            <Badge tone="red">
              <Siren className="size-3.5" aria-hidden /> Emergency
            </Badge>
          )}
          {h.ownership && (
            <Badge tone={h.ownership === 'government' ? 'blue' : 'neutral'}>
              <Landmark className="size-3.5" aria-hidden /> {h.ownership === 'government' ? 'Government' : 'Private'}
            </Badge>
          )}
          {h.beds && (
            <Badge tone="neutral" className="tabular">
              <BedDouble className="size-3.5" aria-hidden /> {h.beds} beds
            </Badge>
          )}
        </div>
      )}

      {nearest ? (
        <div className={cn('mt-4 flex items-start gap-3 rounded-2xl p-3 ring-1 transition-colors', selected ? 'bg-blood-50 ring-blood-200' : 'bg-blood-50/50 ring-blood-100')}>
          <OutletGlyph className="mt-0.5 size-8" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-blood-700 uppercase">Nearest RaktFlow outlet</p>
            <p className="mt-0.5 text-sm font-semibold text-ink-950">
              {nearest.outlet.area} <span className="font-normal text-ink-400">·</span>{' '}
              <span className="tabular">{formatDistance(nearest.distanceM)}</span>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-ink-600">
              <Timer className="size-3.5 text-blood-600" aria-hidden />
              <span className="tabular">≈ {nearest.rideMin} min</span> emergency ride
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-ink-50 p-3 text-xs text-ink-600">
          No RaktFlow outlet within reach of this hospital yet.
        </p>
      )}

      {(h.phone || h.website) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {h.phone && (
            <a href={`tel:${h.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
              <Phone className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate tabular">{h.phone}</span>
              <span className="sr-only">, call {h.name}</span>
            </a>
          )}
          {h.website && (
            <a href={h.website} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <Globe className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{hostOf(h.website)}</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-ink-400" aria-hidden />
              <span className="sr-only">, {h.name} website (opens in a new tab)</span>
            </a>
          )}
        </div>
      )}
    </SelectableCard>
  )
})
