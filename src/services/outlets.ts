import { useMemo } from 'react'
import type { BloodCentre, LatLng, Outlet, RealHospital } from '@/types'
import { OUTLETS, outletsInCity } from '@/data/outlets'
import { totalUnits } from '@/data/network'
import { distanceMeters, hashString, seeded } from '@/lib/utils'
import { useCentres } from './inventory'
import { useCity } from './location'
import { rideMinutes } from './orders'

export function useOutlets() {
  return OUTLETS
}

export interface OutletNearest {
  outlet: Outlet
  distanceM: number
  rideMin: number
}

/** Closest outlet to a point, with straight-line distance and emergency ride time. */
export function nearestOutlet(to: LatLng, outlets: Outlet[] = OUTLETS): OutletNearest {
  let best = outlets[0]
  let bestD = Infinity
  for (const o of outlets) {
    const d = distanceMeters(o.location, to)
    if (d < bestD) {
      best = o
      bestD = d
    }
  }
  return { outlet: best, distanceM: bestD, rideMin: rideMinutes(best.location, to) }
}

/** Real hospitals within `radiusM` of an outlet, nearest first. */
export function hospitalsServedBy(outlet: Outlet, hospitals: RealHospital[], radiusM = 2500) {
  return hospitals
    .map((h) => ({ hospital: h, distanceM: distanceMeters(outlet.location, h.location) }))
    .filter((x) => x.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
}

export interface OutletTelemetry {
  /** Current fridge temperature, °C. Blood fridges must hold 2–6 °C. */
  tempC: number
  /** Seconds since the last logger reading (readings every 60 s) */
  loggedAgoS: number
  /** Units on the shelf right now */
  units: number
}

/**
 * Simulated fridge logger and shelf count. Temperature is a slow, seeded wave
 * around 4 °C so every tab shows the same reading; the shelf count follows the
 * mother centre's live stock.
 */
export function outletTelemetry(outlet: Outlet, centre: BloodCentre | undefined, now: number): OutletTelemetry {
  const seed = hashString(outlet.id)
  const minute = Math.floor(now / 60_000)
  const jitter = seeded(seed ^ minute)() - 0.5
  const wave = Math.sin(now / 420_000 + (seed % 628) / 100)
  const tempC = Math.round((4 + wave * 0.7 + jitter * 0.3) * 10) / 10
  const share = 0.18 + (seed % 9) / 100
  const units = centre ? Math.min(outlet.capacityUnits, Math.round(totalUnits(centre.inventory) * share)) : 0
  return { tempC, loggedAgoS: Math.floor((now % 60_000) / 1000), units }
}

/** Outlets joined with their mother centre, for components that show live shelf counts. */
export function useOutletsWithCentres(cityId?: string) {
  const centres = useCentres()
  return useMemo(
    () => (cityId ? outletsInCity(cityId) : OUTLETS).map((outlet) => ({ outlet, centre: centres.find((c) => c.id === outlet.motherCentreId) })),
    [centres, cityId],
  )
}

/** The visitor's city's outlets, with their mother centres. */
export function useCityOutlets() {
  return useOutletsWithCentres(useCity().id)
}
