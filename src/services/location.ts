import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { LatLng } from '@/types'
import { CITY_RADIUS_M, DEFAULT_CITY_ID, cityById, nearestCity } from '@/data/cities'
import { ApiError } from './api'

/**
 * Where the visitor wants blood delivered: a served city, plus the exact point
 * and neighbourhood when they let us use their location (like quick-commerce
 * apps do). Kept per device, separate from the account database.
 */
export type LocationSource = 'default' | 'gps' | 'manual' | 'account'

interface LocationState {
  cityId: string
  /** Neighbourhood for the header, e.g. "Bandra West" */
  area?: string
  point?: LatLng
  source: LocationSource
  /** The GPS fix is further than CITY_RADIUS_M from every served city */
  outOfArea: boolean
  /** The visitor has chosen or confirmed a location, so stop prompting */
  confirmed: boolean
  updatedAt: number
}

const INITIAL: LocationState = {
  cityId: DEFAULT_CITY_ID,
  source: 'default',
  outOfArea: false,
  confirmed: false,
  updatedAt: 0,
}

export const useLocationStore = create<LocationState>()(
  persist(() => INITIAL, { name: 'rf-location', version: 1, storage: createJSONStorage(() => localStorage) }),
)

export function chooseCity(cityId: string) {
  useLocationStore.setState({
    cityId: cityById(cityId).id,
    area: undefined,
    point: undefined,
    source: 'manual',
    outOfArea: false,
    confirmed: true,
    updatedAt: Date.now(),
  })
}

/** On sign-in, follow the account's home city unless the visitor already picked one on this device. */
export function adoptAccountCity(cityId: string | undefined) {
  if (!cityId) return
  const s = useLocationStore.getState()
  if (s.source === 'default' || !s.confirmed) {
    useLocationStore.setState({ cityId: cityById(cityId).id, area: undefined, point: undefined, source: 'account', confirmed: true, updatedAt: Date.now() })
  }
}

export function dismissLocationPrompt() {
  useLocationStore.setState({ confirmed: true })
}

function currentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new ApiError('This browser cannot share your location. Pick your city instead.', 'unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const msg =
        err.code === err.PERMISSION_DENIED
          ? 'Location permission is off. Allow it in your browser, or pick your city.'
          : err.code === err.TIMEOUT
            ? 'Finding your location took too long. Try again or pick your city.'
            : 'We could not find your location. Pick your city instead.'
      reject(new ApiError(msg, err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'))
    }, options)
  })
}

/** Neighbourhood name for a point from OpenStreetMap Nominatim; undefined if it can't tell. */
export async function placeName(point: LatLng, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${point.lat}&lon=${point.lng}`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal })
    if (!res.ok) return undefined
    const data = (await res.json()) as { address?: Record<string, string> }
    const a = data.address ?? {}
    return a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || a.village || a.city || undefined
  } catch {
    return undefined
  }
}

/**
 * Asks for the device location, snaps it to the nearest served city and names
 * the neighbourhood. Throws ApiError with a message that is safe to show.
 */
export async function locateMe(opts: { quiet?: boolean } = {}) {
  const pos = await currentPosition({ enableHighAccuracy: true, timeout: 12_000, maximumAge: opts.quiet ? 300_000 : 30_000 })
  const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
  const { city, distanceM } = nearestCity(point)
  const outOfArea = distanceM > CITY_RADIUS_M
  // Show the city straight away; the neighbourhood name follows.
  useLocationStore.setState({ cityId: city.id, point, area: undefined, source: 'gps', outOfArea, confirmed: true, updatedAt: Date.now() })
  const area = await placeName(point)
  if (useLocationStore.getState().updatedAt && useLocationStore.getState().point === point) useLocationStore.setState({ area })
  return { city, area, outOfArea, point }
}

/**
 * Keeps a GPS-based location fresh across visits without prompting: only runs
 * when the browser already has permission.
 */
export async function refreshLocationSilently() {
  const s = useLocationStore.getState()
  if (s.source !== 'gps' || !('permissions' in navigator)) return
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    if (status.state === 'granted') await locateMe({ quiet: true })
  } catch {
    /* keep the last known location */
  }
}

export function useDeliveryLocation() {
  const state = useLocationStore()
  return useMemo(() => {
    const city = cityById(state.cityId)
    return { ...state, city, point: state.point ?? city.center }
  }, [state])
}

export function useCity() {
  const cityId = useLocationStore((s) => s.cityId)
  return useMemo(() => cityById(cityId), [cityId])
}
