import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Info, LocateFixed, MapPin, RotateCcw } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { useCity } from '@/services/location'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { RADIUS_OPTIONS, cityOrigin, inServiceArea, locateMe, usePlaceName, type Origin, type RadiusM } from './geo'

export function LocationBar({
  origin,
  onOriginChange,
  radiusM,
  onRadiusChange,
}: {
  origin: Origin
  onOriginChange: (o: Origin) => void
  radiusM: RadiusM
  onRadiusChange: (r: RadiusM) => void
}) {
  const radiusId = useId()
  const [locating, setLocating] = useState(false)
  const city = useCity()
  const place = usePlaceName(origin)
  const isUser = origin.kind === 'user'
  const far = !inServiceArea(origin.location)
  const label = isUser ? (place ? `Your location · ${place}` : 'Your location') : `${city.name} city centre`

  const useMyLocation = async () => {
    setLocating(true)
    try {
      onOriginChange({ kind: 'user', location: await locateMe() })
    } catch (e) {
      toast.error("Couldn't get your location", e instanceof Error ? e.message : undefined)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="rounded-4xl border border-ink-100 bg-white p-3 shadow-soft sm:p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', isUser ? 'bg-blue-50 text-blue-600' : 'bg-blood-50 text-blood-600')}
            aria-hidden
          >
            {isUser ? <LocateFixed className="size-5" /> : <MapPin className="size-5" />}
          </span>
          <div className="min-w-0" aria-live="polite">
            <p className="text-xs font-medium text-ink-500">Showing hospitals near</p>
            <p className="truncate font-display text-lg font-semibold tracking-tight text-ink-950">{label}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-[440px]:flex-row min-[440px]:items-center">
          <div className="flex gap-2">
            <Button
              variant="dark"
              className="h-12 flex-1 min-[440px]:flex-none"
              loading={locating}
              icon={<LocateFixed className="size-4" aria-hidden />}
              onClick={useMyLocation}
            >
              {locating ? 'Locating…' : isUser ? 'Update location' : 'Use my location'}
            </Button>
            {isUser && (
              <button
                type="button"
                onClick={() => onOriginChange(cityOrigin(city))}
                aria-label={`Back to ${city.name} city centre`}
                title={`Back to ${city.name} city centre`}
                className="grid size-12 shrink-0 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 hover:text-ink-950"
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor={radiusId} className="shrink-0 text-sm font-medium text-ink-700">
              Within
            </label>
            <Select
              id={radiusId}
              value={radiusM}
              onChange={(e) => onRadiusChange(Number(e.target.value) as RadiusM)}
              className="min-[440px]:w-28"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r / 1000} km
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {far && (
          <motion.div
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-100">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                We don&rsquo;t deliver here yet. Showing real hospitals near you; the nearest {BRAND.name} city is {city.name}.
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
