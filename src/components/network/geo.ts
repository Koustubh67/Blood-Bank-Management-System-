import { useEffect, useState } from 'react'
import type { LatLng, Outlet, RealHospital } from '@/types'
import { CITY_RADIUS_M, nearestCity, type City } from '@/data/cities'
import { locateMe as locateDelivery } from '@/services/location'
import { hospitalsServedBy, nearestOutlet } from '@/services/outlets'

/** An outlet "serves" the real hospitals within this straight-line distance. */
export const SERVE_RADIUS_M = 2500
/** Past this, a hospital has no outlet worth quoting a ride time for. */
export const OUTLET_REACH_M = 15_000

export const RADIUS_OPTIONS = [3000, 5000, 8000] as const
export type RadiusM = (typeof RADIUS_OPTIONS)[number]

export interface Origin {
  kind: 'city' | 'user'
  location: LatLng
}

export function cityOrigin(city: City): Origin {
  return { kind: 'city', location: city.center }
}

/** Within delivery range of any city we serve. */
export function inServiceArea(at: LatLng) {
  return nearestCity(at).distanceM <= CITY_RADIUS_M
}

/** Nearest outlet, or null when the closest one is too far to be meaningful. */
export function reachableOutlet(at: LatLng, outlets?: Outlet[]) {
  const n = nearestOutlet(at, outlets)
  return n.distanceM <= OUTLET_REACH_M ? n : null
}

const nameKey = (h: RealHospital) => h.name.toLowerCase().replace(/[^a-z]/g, '')

/**
 * Live results first, topped up with the bundled Delhi snapshot so every outlet
 * can list the real hospitals beside it whatever the current search area.
 * Matched on name as well as id: OSM often maps a hospital twice.
 */
export function mergeHospitals(primary: RealHospital[], extra: RealHospital[]) {
  const ids = new Set(primary.map((h) => h.id))
  const names = new Set(primary.map(nameKey))
  return [...primary, ...extra.filter((h) => !ids.has(h.id) && !names.has(nameKey(h)))]
}

export function median(values: number[]) {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** How many real hospitals sit beside an outlet, and the typical emergency ride to them. */
export function networkReach(outlets: Outlet[], hospitals: RealHospital[]) {
  const served = new Map<string, RealHospital>()
  for (const o of outlets) {
    for (const { hospital } of hospitalsServedBy(o, hospitals, SERVE_RADIUS_M)) served.set(hospital.id, hospital)
  }
  const rides = [...served.values()].map((h) => nearestOutlet(h.location, outlets).rideMin)
  return { servedCount: served.size, medianRideMin: median(rides) }
}

// ---------- browser location ----------

/**
 * Locates the visitor through the app-wide location service, so the header's
 * delivery location updates too. Throws an Error with a readable message.
 */
export async function locateMe(): Promise<LatLng> {
  return (await locateDelivery()).point
}

interface NominatimReverse {
  address?: Partial<Record<'suburb' | 'neighbourhood' | 'city_district' | 'city' | 'town' | 'village', string>>
}

/** Neighbourhood name for a point via OpenStreetMap Nominatim; null if unavailable. */
async function reverseGeocode(at: LatLng, signal: AbortSignal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=en&lat=${at.lat.toFixed(5)}&lon=${at.lng.toFixed(5)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = (await res.json()) as NominatimReverse
  const a = json.address ?? {}
  return a.suburb || a.neighbourhood || a.city_district || a.city || a.town || a.village || null
}

/** Place name for the user's position, looked up once per point. */
export function usePlaceName(origin: Origin) {
  const [place, setPlace] = useState<{ key: string; name: string | null } | null>(null)
  const key = `${origin.location.lat.toFixed(4)},${origin.location.lng.toFixed(4)}`
  const wanted = origin.kind === 'user'

  useEffect(() => {
    if (!wanted) return
    const ctrl = new AbortController()
    reverseGeocode(origin.location, ctrl.signal)
      .then((name) => setPlace({ key, name }))
      .catch(() => {
        if (!ctrl.signal.aborted) setPlace({ key, name: null })
      })
    return () => ctrl.abort()
    // Keyed on the rounded point so tiny GPS jitter doesn't refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, wanted])

  return wanted && place?.key === key ? place.name : null
}
