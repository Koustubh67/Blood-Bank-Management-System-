import { ApiError } from '@/services/api'
import { stateByName, type EraktkoshState } from '@/data/regions'

/**
 * "Use my location": the browser's position, turned into a state and district
 * with OpenStreetMap's Nominatim. Coordinates are rounded to about 100 m before
 * that single lookup and are never stored.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

interface NominatimAddress {
  state?: string
  state_district?: string
  county?: string
  city_district?: string
  city?: string
  country_code?: string
}

export interface NearMe {
  state: EraktkoshState
  /** District-level names to match against camp districts, best guess first */
  places: string[]
}

const GEO_ERRORS: Record<number, string> = {
  1: 'Location access is blocked. Allow it in your browser settings, or pick your state from the list.',
  2: 'Your location is not available right now. Pick your state from the list.',
  3: 'Finding your location took too long. Try again, or pick your state from the list.',
}

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new ApiError('This browser cannot share your location. Pick your state from the list.', 'unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => reject(new ApiError(GEO_ERRORS[err.code] ?? GEO_ERRORS[2], 'geolocation')),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 10 * 60_000 },
    )
  })
}

async function reverseGeocode(lat: number, lon: number): Promise<NominatimAddress> {
  const url = new URL(NOMINATIM)
  url.search = new URLSearchParams({
    format: 'jsonv2',
    zoom: '10',
    addressdetails: '1',
    lat: lat.toFixed(3),
    lon: lon.toFixed(3),
  }).toString()
  let res: Response
  try {
    res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
  } catch {
    throw new ApiError('Could not look up your area. Check your connection, or pick your state from the list.', 'network')
  }
  if (!res.ok) throw new ApiError('Could not look up your area right now. Pick your state from the list.', 'upstream')
  const data: unknown = await res.json().catch(() => null)
  const address = data && typeof data === 'object' && 'address' in data ? (data as { address?: NominatimAddress }).address : undefined
  if (!address) throw new ApiError('We could not tell where you are. Pick your state from the list.', 'upstream')
  return address
}

/** Finds the e-RaktKosh state (and nearby district names) for the device's location. */
export async function locateNearMe(): Promise<NearMe> {
  const pos = await currentPosition()
  const a = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
  if (a.country_code && a.country_code !== 'in') throw new ApiError('Camps are listed for India only. Pick a state from the list.', 'outside')
  const state = stateByName(a.state)
  if (!state) throw new ApiError('We could not match your location to a state. Pick yours from the list.', 'unmatched')
  const places = [a.state_district, a.county, a.city_district, a.city].filter((p): p is string => !!p?.trim())
  return { state, places }
}

// "Pune District", "South West Delhi", "Mumbai Suburban District" → comparable words
const words = (s: string) =>
  ` ${s
    .toLowerCase()
    .replace(/\b(sub-?)?(district|distt?|tehsil|taluka)\b\.?/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .trim()} `

/**
 * Picks the camp district that best matches a geocoded place, case-insensitively.
 * An exact match wins; otherwise the longest district contained in the place
 * ("South West" in "South West Delhi") or containing it.
 */
export function matchDistrict(places: string[], districts: string[]) {
  for (const place of places) {
    const p = words(place)
    if (!p.trim()) continue
    let best: string | undefined
    let score = 0
    for (const d of districts) {
      const n = words(d)
      if (!n.trim()) continue
      const s = n === p ? Infinity : p.includes(n) || n.includes(p) ? n.length : 0
      if (s > score) {
        best = d
        score = s
      }
    }
    if (best) return best
  }
  return undefined
}
