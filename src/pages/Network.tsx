import { useEffect, useMemo, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { Info } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { HOSPITALS_SNAPSHOT } from '@/data/hospitalsSnapshot'
import { useNearbyHospitals } from '@/services/hospitals'
import { outletsInCity } from '@/data/outlets'
import { chooseCity, useDeliveryLocation } from '@/services/location'
import { NetworkHero } from '@/components/network/NetworkHero'
import { NetworkExplorer } from '@/components/network/NetworkExplorer'
import { TrustCards } from '@/components/network/TrustCards'
import { mergeHospitals, networkReach, type Origin, type RadiusM } from '@/components/network/geo'

export default function Network() {
  useEffect(() => {
    document.title = `Hospitals & outlets near you — ${BRAND.name}`
  }, [])

  // The search point follows the header's delivery location: the city centre, or the visitor's GPS fix.
  const loc = useDeliveryLocation()
  const outlets = useMemo(() => outletsInCity(loc.city.id), [loc.city.id])
  const origin = useMemo<Origin>(
    () => ({ kind: loc.source === 'gps' ? 'user' : 'city', location: loc.point }),
    [loc.source, loc.point],
  )
  // "Use my location" already updated the shared location; "back to city" resets it.
  const setOrigin = (o: Origin) => {
    if (o.kind === 'city') chooseCity(loc.city.id)
  }
  const [radiusM, setRadiusM] = useState<RadiusM>(5000)
  const { status, result, refreshing, retry } = useNearbyHospitals(origin.location, radiusM)

  // Hero numbers and outlet "beside" lists use live data plus the Delhi
  // snapshot, so they stay meaningful wherever the visitor is searching.
  const pool = useMemo(() => mergeHospitals(result?.hospitals ?? [], HOSPITALS_SNAPSHOT), [result])
  const reach = useMemo(() => networkReach(outlets, pool), [outlets, pool])

  return (
    // "user": transform-based motion is skipped for people who prefer reduced motion.
    <MotionConfig reducedMotion="user">
      <NetworkHero
        outletCount={outlets.length}
        open24={outlets.filter((o) => o.open24x7).length}
        servedCount={reach.servedCount}
        medianRideMin={reach.medianRideMin}
      />
      <NetworkExplorer
        origin={origin}
        onOriginChange={setOrigin}
        radiusM={radiusM}
        onRadiusChange={setRadiusM}
        status={status}
        result={result}
        refreshing={refreshing}
        retry={retry}
        pool={pool}
      />
      <TrustCards />

      <section aria-label="About this data" className="container-page pb-16 sm:pb-20">
        <p className="flex max-w-3xl items-start gap-3 text-sm text-ink-500">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Hospital data &copy;{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink-700 underline decoration-ink-300 underline-offset-2 hover:text-ink-950"
            >
              OpenStreetMap contributors
            </a>{' '}
            (ODbL). A hospital appearing here does not mean it is a {BRAND.name} partner; orders are delivered only to registered partner
            hospitals. In this prototype the outlets, their licences, fridge temperatures and stock are simulated. Ride times are straight-line
            estimates for an emergency rider, not guarantees.
          </span>
        </p>
      </section>
    </MotionConfig>
  )
}
