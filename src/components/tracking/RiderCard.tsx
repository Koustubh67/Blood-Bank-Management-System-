import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Bike, Building2, Phone, ShieldCheck, Star } from 'lucide-react'
import type { LatLng, Rider } from '@/types'
import type { TrackingSnapshot } from '@/services/tracking'
import { formatDistance, pathLength } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/primitives'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Rider details and live distance, shown once the box leaves the centre. */
export function RiderCard({ rider, snapshot, route }: { rider: Rider; snapshot: TrackingSnapshot; route: LatLng[] }) {
  const total = useMemo(() => pathLength(route), [route])
  const remaining = total * (1 - snapshot.rideProgress)
  const atHospital = snapshot.remainingMs <= 0

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-blood-500 to-blood-800 font-display text-lg font-bold text-white shadow-glow">
            {initials(rider.name)}
          </span>
          <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
            <ShieldCheck className="size-3.5" aria-hidden />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-500">Your rider</p>
          <p className="truncate text-lg font-semibold text-ink-950">{rider.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {rider.rating.toFixed(2).replace(/0$/, '')}
            </span>
            <span aria-hidden>·</span>
            <span className="truncate">{rider.vehicle}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-ink-50 p-4">
        <p className="text-sm font-semibold text-ink-950" aria-live="off">
          {atHospital ? 'Rider is at the hospital' : `Rider is ${formatDistance(remaining)} away`}
        </p>
        <div className="relative mt-3 flex items-center gap-3">
          <Bike className="size-4 shrink-0 text-blood-600" aria-hidden />
          <div className="relative h-1.5 flex-1 rounded-full bg-ink-200">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-blood-600"
              initial={false}
              animate={{ width: `${snapshot.rideProgress * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
            <motion.span
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blood-600 shadow"
              initial={false}
              animate={{ left: `${snapshot.rideProgress * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
              aria-hidden
            />
          </div>
          <Building2 className="size-4 shrink-0 text-ice-600" aria-hidden />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">{rider.phone}</span> · Masked number. Calling is disabled in this prototype.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled
          icon={<Phone className="size-4" aria-hidden />}
          className="shrink-0"
        >
          Call rider
        </Button>
      </div>
    </Card>
  )
}
