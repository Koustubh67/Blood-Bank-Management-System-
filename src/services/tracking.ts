import { useEffect, useMemo, useState } from 'react'
import type { LatLng, Order, OrderStatus } from '@/types'
import { useDB } from '@/store/db'
import { hospitalById } from '@/data/network'
import { bearing, hashString, pointAlong, seeded } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { liveStatus } from './orders'

export const TRACKING_STAGES: { key: OrderStatus; label: string; detail: string }[] = [
  { key: 'placed', label: 'Order placed', detail: 'Payment confirmed and request sent to the nearest licensed blood centre.' },
  { key: 'verified', label: 'Requisition verified', detail: "The centre's medical officer checked the doctor's requisition and patient details." },
  { key: 'packed', label: 'Packed in cold box', detail: 'Group-matched units issued, sealed in a validated cold box with a temperature logger.' },
  { key: 'dispatched', label: 'Out for delivery', detail: 'Rider picked up the sealed box and is on the fastest route.' },
  { key: 'arriving', label: 'Arriving now', detail: 'Keep the handover OTP ready at the blood transfusion desk.' },
  { key: 'delivered', label: 'Delivered', detail: 'Handed over with OTP. Cross-match and bedside checks are done by the hospital before transfusion.' },
]

export function stageIndex(status: OrderStatus) {
  return TRACKING_STAGES.findIndex((s) => s.key === status)
}

export interface TempReading {
  label: string
  value: number
  min: number
  max: number
}

export interface TrackingSnapshot {
  status: OrderStatus
  stage: number
  /** Simulated ms since the order was placed */
  elapsedMs: number
  /** ms until handover, 0 once delivered */
  remainingMs: number
  /** 0..1 progress of the ride itself */
  rideProgress: number
  riderPosition: LatLng | null
  riderHeading: number
  temps: TempReading[]
}

/** Cold-box temperature with a tiny deterministic wobble, like a real logger. */
function tempAt(base: number, amp: number, t: number, seed: number) {
  const r = seeded(seed + Math.floor(t / 5000))
  return Math.round((base + Math.sin(t / 47_000 + seed) * amp + (r() - 0.5) * 0.2) * 10) / 10
}

export function trackingSnapshot(order: Order, route: LatLng[], now: number): TrackingSnapshot {
  const status = liveStatus(order, now)
  const plan = order.plan
  const elapsedMs = order.placedAt ? now - order.placedAt + order.simOffsetMs : 0
  const seed = hashString(order.id)

  let rideProgress = 0
  let riderPosition: LatLng | null = null
  let riderHeading = 0
  if (plan && route.length > 1) {
    rideProgress = Math.min(1, Math.max(0, (elapsedMs - plan.dispatchAt) / (plan.arriveAt - plan.dispatchAt)))
    if (elapsedMs >= plan.dispatchAt) {
      riderPosition = pointAlong(route, rideProgress)
      const ahead = pointAlong(route, Math.min(1, rideProgress + 0.02))
      riderHeading = bearing(riderPosition, ahead)
    }
  }

  const temps: TempReading[] = []
  const packed = plan && elapsedMs >= plan.packAt
  if (packed) {
    const hasCells = order.items.some((i) => i.component === 'PRBC' || i.component === 'WB')
    const hasFrozen = order.items.some((i) => i.component === 'FFP' || i.component === 'CRYO')
    const hasPlatelets = order.items.some((i) => i.component === 'PLT')
    if (hasCells) temps.push({ label: 'Red cell compartment', value: tempAt(4, 0.5, elapsedMs, seed), min: 2, max: 6 })
    if (hasFrozen) temps.push({ label: 'Frozen compartment', value: tempAt(-34, 1, elapsedMs, seed + 1), min: -45, max: -30 })
    if (hasPlatelets) temps.push({ label: 'Platelet pouch', value: tempAt(22, 0.6, elapsedMs, seed + 2), min: 20, max: 24 })
  }

  return {
    status,
    stage: stageIndex(status),
    elapsedMs,
    remainingMs: plan ? Math.max(0, plan.arriveAt - elapsedMs) : 0,
    rideProgress,
    riderPosition,
    riderHeading,
    temps,
  }
}

// ---------- routes ----------

/** Plausible street-like path when the routing service is unreachable. */
export function syntheticRoute(from: LatLng, to: LatLng, seed: number): LatLng[] {
  const rand = seeded(seed)
  const pts: LatLng[] = [from]
  const steps = 7
  let cur = from
  for (let i = 1; i < steps; i++) {
    const f = i / steps
    const target = { lat: from.lat + (to.lat - from.lat) * f, lng: from.lng + (to.lng - from.lng) * f }
    const jitter = (rand() - 0.5) * 0.006
    // Alternate lat-first / lng-first legs so the line looks like a road grid.
    const corner = i % 2 ? { lat: target.lat + jitter, lng: cur.lng } : { lat: cur.lat, lng: target.lng + jitter }
    pts.push(corner)
    cur = corner
  }
  pts.push({ lat: to.lat, lng: cur.lng }, to)
  return pts
}

const routeCache = new Map<string, LatLng[]>()

/**
 * Real road geometry from the public OSRM demo server (fine for a prototype,
 * not for production traffic). Falls back to a synthetic path offline.
 */
export async function fetchRoute(from: LatLng, to: LatLng, key: string): Promise<LatLng[]> {
  const cached = routeCache.get(key)
  if (cached) return cached
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] }
    const coords = json.routes?.[0]?.geometry.coordinates
    if (!coords?.length) throw new Error('no route')
    const path = coords.map(([lng, lat]) => ({ lat, lng }))
    routeCache.set(key, path)
    return path
  } catch {
    const path = syntheticRoute(from, to, hashString(key))
    routeCache.set(key, path)
    return path
  }
}

/** Everything the tracking UI needs, re-computed every second. */
export function useTracking(order: Order | undefined) {
  const now = useNow(1000)
  const centre = useDB((s) => s.centres.find((c) => c.id === order?.centreId))
  const hospital = order ? hospitalById(order.hospitalId) : undefined
  const [route, setRoute] = useState<LatLng[]>([])

  const from = centre?.location
  const to = hospital?.location
  const key = order ? `${order.centreId}->${order.hospitalId}` : ''

  useEffect(() => {
    if (!from || !to || !key) return
    let alive = true
    setRoute(syntheticRoute(from, to, hashString(key)))
    fetchRoute(from, to, key).then((r) => alive && setRoute(r))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const snapshot = useMemo(() => (order ? trackingSnapshot(order, route, now) : null), [order, route, now])
  return { snapshot, route, centre, hospital, now }
}
