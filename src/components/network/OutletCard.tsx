import { forwardRef } from 'react'
import { BadgeCheck, CalendarDays, Clock, Droplet, MapPin, Thermometer } from 'lucide-react'
import type { BloodCentre, Outlet, RealHospital } from '@/types'
import { outletTelemetry } from '@/services/outlets'
import { useNow } from '@/hooks/useNow'
import { BRAND } from '@/config/brand'
import { cn, formatDistance } from '@/lib/utils'
import { Badge } from '@/components/ui/primitives'
import { LiveNumber } from '@/components/stock/LiveNumber'
import { OutletGlyph, SelectableCard } from './parts'
import { SERVE_RADIUS_M } from './geo'

const SHOW_SERVED = 3

function openedLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(BRAND.locale, { month: 'short', year: 'numeric' })
}

/** A RaktFlow outlet with its simulated fridge logger, shelf count and the real hospitals beside it. */
export const OutletCard = forwardRef<
  HTMLElement,
  {
    outlet: Outlet
    centre: BloodCentre | undefined
    distanceM: number
    fromLabel: string
    /** Real hospitals within the serve radius, nearest first */
    served: { hospital: RealHospital; distanceM: number }[]
    selected: boolean
    onSelect: () => void
  }
>(function OutletCard({ outlet, centre, distanceM, fromLabel, served, selected, onSelect }, ref) {
  const now = useNow(5000)
  const t = outletTelemetry(outlet, centre, now)
  const inRange = t.tempC >= 2 && t.tempC <= 6
  const fill = Math.min(100, Math.round((t.units / outlet.capacityUnits) * 100))
  const more = served.length - SHOW_SERVED

  return (
    <SelectableCard
      ref={ref}
      selected={selected}
      onSelect={onSelect}
      title={
        <span className="flex items-start gap-3">
          <OutletGlyph className="size-10 rounded-[13px] shadow-glow" iconClassName="size-5" />
          <span className="min-w-0 pt-0.5">
            <span className="block">{outlet.name}</span>
            <span className="mt-0.5 block text-xs font-normal text-ink-500 tabular">
              {formatDistance(distanceM)} from {fromLabel}
            </span>
          </span>
        </span>
      }
    >
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {outlet.open24x7 ? (
          <Badge tone="green">
            <Clock className="size-3.5" aria-hidden /> Open 24×7
          </Badge>
        ) : (
          <Badge tone="neutral">
            <Clock className="size-3.5" aria-hidden /> Limited hours
          </Badge>
        )}
        <Badge tone="neutral">
          <BadgeCheck className="size-3.5" aria-hidden /> Licence {outlet.licenseNo}
        </Badge>
      </div>
      {centre && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-600">
          <Droplet className="mt-px size-3.5 shrink-0 text-blood-600" aria-hidden />
          <span>
            Stocked by <span className="font-semibold text-ink-800">{centre.name}</span>
          </span>
        </p>
      )}

      {/* Live telemetry */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className={cn('rounded-2xl p-3 ring-1', inRange ? 'bg-ice-50 ring-ice-100' : 'bg-blood-50 ring-blood-100')}>
          <p className="flex items-center gap-1 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase">
            <Thermometer className="size-3.5" aria-hidden /> Fridge
          </p>
          <p className={cn('mt-1 font-display text-2xl leading-none font-bold whitespace-nowrap tabular', inRange ? 'text-ice-700' : 'text-blood-700')}>
            {t.tempC.toFixed(1)} °C
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-500">
            {inRange ? <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden /> : <span className="size-1.5 shrink-0 rounded-full bg-blood-600" aria-hidden />}
            <span className="tabular">
              {inRange ? 'In range' : 'Alarm'} · logged {t.loggedAgoS}s ago
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-paper p-3 ring-1 ring-ink-100">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase">On the shelf</p>
          <p className="mt-1 font-display text-2xl leading-none font-bold whitespace-nowrap text-ink-950">
            <LiveNumber value={t.units} showDelta={false} />
            <span className="text-sm font-semibold text-ink-400 tabular"> / {outlet.capacityUnits}</span>
          </p>
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-100"
            role="meter"
            aria-label="Fridge shelf in use"
            aria-valuemin={0}
            aria-valuemax={outlet.capacityUnits}
            aria-valuenow={t.units}
            aria-valuetext={`${t.units} of ${outlet.capacityUnits} units`}
          >
            <div className="h-full rounded-full bg-blood-600 transition-[width] duration-700" style={{ width: `${fill}%` }} />
          </div>
        </div>
      </div>

      {/* Real hospitals beside it */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-400 uppercase">
          Beside · hospitals within {formatDistance(SERVE_RADIUS_M)}
        </p>
        {served.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink-500">No mapped hospitals within {formatDistance(SERVE_RADIUS_M)}.</p>
        ) : (
          <ul className="mt-1.5 divide-y divide-ink-100">
            {served.slice(0, SHOW_SERVED).map(({ hospital, distanceM: d }) => (
              <li key={hospital.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                <span className="min-w-0 truncate text-ink-800">{hospital.name}</span>
                <span className="shrink-0 text-xs font-medium text-ink-500 tabular">{formatDistance(d)}</span>
              </li>
            ))}
          </ul>
        )}
        {more > 0 && <p className="mt-1 text-xs font-medium text-ink-500">+{more} more nearby</p>}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-100 pt-3 text-[11px] text-ink-400">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden /> Opened {openedLabel(outlet.openedOn)}
        </span>
        <span className="inline-flex items-center gap-1 tabular">
          <MapPin className="size-3.5" aria-hidden /> {outlet.area}
        </span>
      </p>
    </SelectableCard>
  )
})
