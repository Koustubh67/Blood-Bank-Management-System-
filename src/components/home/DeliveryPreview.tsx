import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, FileCheck, KeyRound, Pause, Play, Thermometer } from 'lucide-react'
import type { DeliveryPlan, LatLng, OrderStatus } from '@/types'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { LiveDot } from '@/components/ui/primitives'
import { useNow } from '@/hooks/useNow'
import { useCentres, useCityCentres } from '@/services/inventory'
import { useCity } from '@/services/location'
import { buildPlan, STATUS_LABEL } from '@/services/orders'
import { stageIndex, syntheticRoute, TRACKING_STAGES } from '@/services/tracking'
import { hospitalsInCity, PARTNER_HOSPITALS } from '@/data/network'
import { bearing, clamp, cn, distanceMeters, formatClock, formatDistance, hashString, pointAlong } from '@/lib/utils'

/**
 * A looping, simulated emergency delivery used as the hero visual.
 * Nothing here touches real orders: it replays one fictional trip from a
 * partner centre to a partner hospital in the visitor's city, on a
 * compressed clock.
 */

const LOOP_MS = 30_000
/** Where the loop starts on first paint, so the rider is already moving. */
const START_AT = 5_000
/** Frozen frame shown to people who prefer reduced motion. */
const REDUCED_FRAME = 13_000

/** Real loop time (ms) → simulated time since the order was placed (ms). */
function simAt(loopT: number, plan: DeliveryPlan) {
  const keys: [number, number][] = [
    [0, plan.verifyAt],
    [3_500, plan.dispatchAt],
    [22_000, plan.arriveAt],
    [25_000, plan.deliverAt],
    [LOOP_MS, plan.deliverAt],
  ]
  for (let i = 1; i < keys.length; i++) {
    const [t0, s0] = keys[i - 1]
    const [t1, s1] = keys[i]
    if (loopT <= t1) return s0 + (s1 - s0) * ((loopT - t0) / (t1 - t0))
  }
  return plan.deliverAt
}

/** Mirrors the stage thresholds used by the real order tracker. */
function statusAt(sim: number, p: DeliveryPlan): OrderStatus {
  if (sim >= p.deliverAt) return 'delivered'
  if (sim >= p.dispatchAt + (p.arriveAt - p.dispatchAt) * 0.8) return 'arriving'
  if (sim >= p.dispatchAt) return 'dispatched'
  if (sim >= p.packAt) return 'packed'
  if (sim >= p.verifyAt) return 'verified'
  return 'placed'
}

function rideAt(sim: number, p: DeliveryPlan) {
  return clamp((sim - p.dispatchAt) / (p.arriveAt - p.dispatchAt), 0, 1)
}

/** Evenly spaced points so the travelled part of the route grows smoothly. */
function densify(path: LatLng[], stepM = 25): LatLng[] {
  if (path.length < 2) return path
  const out: LatLng[] = [path[0]]
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const n = Math.max(1, Math.ceil(distanceMeters(a, b) / stepM))
    for (let k = 1; k <= n; k++) out.push({ lat: a.lat + ((b.lat - a.lat) * k) / n, lng: a.lng + ((b.lng - a.lng) * k) / n })
  }
  return out
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function DeliveryPreview({ className }: { className?: string }) {
  const city = useCity()
  const allCentres = useCentres()
  const cityCentres = useCityCentres()
  // The city's first partner hospital, served by the nearest centre in the same city.
  const hospital = hospitalsInCity(city.id)[0] ?? PARTNER_HOSPITALS[0]
  const centre = useMemo(() => {
    const pool = cityCentres.length ? cityCentres : allCentres
    return pool.reduce((best, c) => (distanceMeters(c.location, hospital.location) < distanceMeters(best.location, hospital.location) ? c : best), pool[0])
  }, [cityCentres, allCentres, hospital])
  const routeKey = `${centre.id}->${hospital.id}`
  const { lat: fLat, lng: fLng } = centre.location
  const { lat: tLat, lng: tLng } = hospital.location

  const { plan, baseRoute, route, markers } = useMemo(() => {
    const from = { lat: fLat, lng: fLng }
    const to = { lat: tLat, lng: tLng }
    const base = syntheticRoute(from, to, hashString(routeKey))
    const pins: MapMarker[] = [
      { id: 'preview-centre', kind: 'centre', position: from, label: centre.name, active: true },
      { id: 'preview-hospital', kind: 'hospital', position: to, label: hospital.name },
    ]
    return { plan: buildPlan('emergency', from, to), baseRoute: base, route: densify(base), markers: pins }
  }, [fLat, fLng, tLat, tLng, routeKey, centre.name, hospital.name])

  // ---- looping clock (pausable) ----
  const now = useNow(1000)
  const [origin, setOrigin] = useState(() => Date.now() - START_AT)
  const [pausedAt, setPausedAt] = useState<number | null>(() => (prefersReducedMotion() ? REDUCED_FRAME : null))
  const paused = pausedAt !== null
  const loopT = pausedAt ?? (((now - origin) % LOOP_MS) + LOOP_MS) % LOOP_MS

  const togglePause = () => {
    if (pausedAt === null) {
      setPausedAt(loopT)
    } else {
      setOrigin(now - pausedAt)
      setPausedAt(null)
    }
  }

  // ---- derived frame ----
  const sim = simAt(loopT, plan)
  const status = statusAt(sim, plan)
  const stage = Math.max(0, stageIndex(status))
  const delivered = status === 'delivered'
  const progress = rideAt(sim, plan)
  // The solid trail lags one tick so it follows the rider (which glides over 1 s) instead of leading it.
  const trail = paused ? progress : rideAt(simAt(Math.max(0, loopT - 1000), plan), plan)
  const riding = sim >= plan.dispatchAt && !delivered
  const remainingMs = Math.max(0, plan.deliverAt - sim)
  const temp = (3.9 + Math.sin(loopT / 2600) * 0.14).toFixed(1)

  const rider = useMemo(() => {
    if (!riding) return null
    const position = pointAlong(route, progress)
    const a = pointAlong(route, Math.max(0, progress - 0.02))
    const b = pointAlong(route, Math.min(1, progress + 0.02))
    return { position, heading: bearing(a, b) }
  }, [riding, route, progress])

  return (
    <div className={cn('relative', className)}>
      {/* Floating satellites (wide screens only) */}
      <div
        className="absolute top-62 -left-24 z-20 hidden w-56 animate-float items-start gap-3 rounded-2xl border border-ink-100 bg-white/95 p-3.5 shadow-lift backdrop-blur xl:flex"
        aria-hidden
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <FileCheck className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-950">Requisition verified</p>
          <p className="mt-0.5 text-xs leading-snug text-ink-500">Doctor's signed form checked by the centre's medical officer</p>
        </div>
      </div>
      <div
        className="absolute right-8 -bottom-11 z-20 hidden animate-float items-center gap-3 rounded-2xl border border-ink-100 bg-white/95 py-2.5 pr-2.5 pl-3.5 shadow-lift backdrop-blur xl:flex"
        style={{ animationDelay: '-3s' }}
        aria-hidden
      >
        <KeyRound className="size-4 text-blood-600" />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">Handover OTP</p>
          <p className="text-[11px] text-ink-400">Shared only with the hospital desk</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="grid size-8 place-items-center rounded-lg bg-ink-950">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          ))}
        </div>
      </div>

      <figure className="relative rounded-4xl border border-ink-100 bg-white p-2 shadow-lift">
        <figcaption className="sr-only">
          Demo preview of a simulated emergency order: two units of O negative red cells travelling from {centre.name} to {hospital.name} in {city.name}.
          Current stage: {STATUS_LABEL[status]}.
        </figcaption>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-3">
          <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-ink-900">
            <LiveDot className={cn(paused && 'opacity-40')} />
            <span className="truncate">Live delivery preview</span>
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.12em] text-ink-600 uppercase">
              Demo<span className="hidden sm:inline"> · timelapse</span>
            </span>
            <button
              type="button"
              onClick={togglePause}
              className="grid size-8 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
              aria-label={paused ? 'Play delivery preview' : 'Pause delivery preview'}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          <div inert className="h-56 sm:h-72 xl:h-76">
            <LiveMap
              className="h-full rounded-[1.6rem]"
              markers={markers}
              route={route}
              routeProgress={trail}
              rider={rider}
              fitTo={baseRoute}
              interactive={false}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={status}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.3 }}
              >
                <StatusBadge status={status} className="shadow-soft" />
              </motion.div>
            </AnimatePresence>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ice-700 shadow-soft ring-1 ring-ice-100 backdrop-blur">
              <Thermometer className="size-3.5" />
              <span className="tabular">{temp} °C</span>
            </span>
          </div>
        </div>

        {/* Readout */}
        <div className="px-3 pt-5 pb-3 sm:px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">{delivered ? 'Handed over' : 'Handover in'}</p>
              <p
                className={cn(
                  'mt-1 flex items-center gap-2 font-display text-5xl leading-none font-bold tracking-[-0.04em] tabular sm:text-[3.5rem]',
                  delivered ? 'text-emerald-600' : 'text-ink-950',
                )}
              >
                {formatClock(remainingMs)}
                {delivered && (
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="size-5" strokeWidth={3} />
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-blood-600 uppercase">Emergency</p>
              <p className="mt-1.5 flex items-center justify-end gap-2 text-sm font-medium whitespace-nowrap text-ink-700">
                <BloodGroupBadge group="O-" size="sm" /> 2 × red cells
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-6 gap-1.5" aria-hidden>
            {TRACKING_STAGES.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  'h-1.5 rounded-full transition-colors duration-500',
                  delivered ? 'bg-emerald-500' : i < stage ? 'bg-blood-600' : i === stage ? 'animate-pulse bg-blood-600' : 'bg-ink-100',
                )}
              />
            ))}
          </div>

          <div className="mt-3 min-h-[3.9rem] text-sm leading-snug text-ink-600 sm:min-h-[2.8rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                {TRACKING_STAGES[stage]?.detail}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-paper p-3 text-sm ring-1 ring-ink-100/70">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ink-500">From centre</p>
              <p className="truncate font-semibold text-ink-900">{centre.name}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-0.5 text-ink-400">
              <ArrowRight className="size-4" />
              <span className="text-[10px] font-medium tabular">{formatDistance(plan.distanceM)}</span>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[11px] font-medium text-ink-500">To hospital</p>
              <p className="truncate font-semibold text-ink-900">{hospital.name}</p>
            </div>
          </div>
        </div>
      </figure>
    </div>
  )
}
