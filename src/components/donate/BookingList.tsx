import { useMemo, useState } from 'react'
import { CalendarPlus, ChevronDown, Clock, MapPin } from 'lucide-react'
import type { DonorProfile } from '@/types'
import { useCentres } from '@/services/inventory'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { Badge } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { bookingRef, downloadIcs, formatSlotParts, isUpcoming, slotTime } from './slots'

/** Donation bookings, upcoming first; past ones folded away. */
export function BookingList({ bookings, compact = false, className }: { bookings: DonorProfile[]; compact?: boolean; className?: string }) {
  const centres = useCentres()
  const [showPast, setShowPast] = useState(false)

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    const withTime = bookings.map((b) => ({ b, t: b.slot ? slotTime(b.slot) : b.createdAt }))
    return {
      upcoming: withTime.filter(({ b }) => isUpcoming(b, now)).sort((a, z) => a.t - z.t).map((x) => x.b),
      past: withTime.filter(({ b }) => !isUpcoming(b, now)).sort((a, z) => z.t - a.t).map((x) => x.b),
    }
  }, [bookings])

  const row = (b: DonorProfile, isPast: boolean) => {
    const c = centres.find((x) => x.id === b.centreId)
    const s = formatSlotParts(b.slot)
    return (
      <li
        key={b.id}
        className={cn(
          'flex items-center gap-4 rounded-3xl border border-ink-100 bg-white p-3 pr-4 sm:p-4',
          isPast && 'bg-ink-50/60',
          !compact && !isPast && 'shadow-soft',
        )}
      >
        <div
          className={cn(
            'flex w-14 shrink-0 flex-col items-center rounded-2xl py-2 text-center',
            isPast ? 'bg-ink-100 text-ink-500' : 'bg-blood-50 text-blood-700',
          )}
        >
          <span className="text-[10px] font-semibold tracking-wide uppercase">{s.month}</span>
          <span className="font-display text-2xl leading-none font-bold">{s.day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-950">{c?.name ?? 'Blood centre'}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="size-3.5" /> {s.weekday}, {s.time}
            </span>
            {c && (
              <span className="hidden items-center gap-1 whitespace-nowrap sm:inline-flex">
                <MapPin className="size-3.5" /> {c.area}
              </span>
            )}
            <span className="whitespace-nowrap">
              <span className="font-semibold text-ink-700 sm:hidden">{b.bloodGroup} · </span>
              <span className="font-mono tracking-wider">{bookingRef(b)}</span>
            </span>
          </p>
        </div>
        <span className="hidden shrink-0 sm:block">
          <BloodGroupBadge group={b.bloodGroup} size="sm" className={cn(isPast && 'bg-ink-400')} />
        </span>
        {!isPast ? (
          <button
            type="button"
            onClick={() => downloadIcs(b, c)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-950"
            aria-label={`Add booking ${bookingRef(b)} to calendar`}
            title="Add to calendar"
          >
            <CalendarPlus className="size-4.5" />
          </button>
        ) : (
          <Badge className="hidden sm:inline-flex">Past</Badge>
        )}
      </li>
    )
  }

  return (
    <div className={className}>
      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-2.5">{upcoming.map((b) => row(b, false))}</ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-ink-200 bg-white px-5 py-6 text-center text-sm text-ink-500">No upcoming donation slots.</p>
      )}
      {past.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', showPast && 'rotate-180')} />
            {showPast ? 'Hide' : 'Show'} {past.length} past booking{past.length === 1 ? '' : 's'}
          </button>
          {showPast && <ul className="mt-2 flex flex-col gap-2">{past.map((b) => row(b, true))}</ul>}
        </div>
      )}
    </div>
  )
}
