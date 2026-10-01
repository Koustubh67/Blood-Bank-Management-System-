import { useMemo } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Bike, Navigation } from 'lucide-react'
import type { BloodCentre, Order, PartnerHospital } from '@/types'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge, LiveDot } from '@/components/ui/primitives'
import { buttonClass } from '@/components/ui/Button'
import { liveStatus } from '@/services/orders'
import { formatClock, formatDistance, formatTime } from '@/lib/utils'
import { elapsedMs, etaMs, itemsSummary } from './metrics'
import { orderHref } from './EmergencyPanel'

export function ActiveDeliveries({
  orders,
  now,
  hospital,
  centres,
}: {
  orders: Order[]
  now: number
  hospital?: PartnerHospital
  centres: BloodCentre[]
}) {
  const busyCentres = useMemo(() => new Set(orders.map((o) => o.centreId)), [orders])
  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = centres.map((c) => ({
      id: c.id,
      kind: 'centre',
      position: c.location,
      label: busyCentres.has(c.id) ? `${c.name} · dispatching to you` : c.name,
      active: busyCentres.has(c.id),
    }))
    if (hospital) list.push({ id: hospital.id, kind: 'hospital', position: hospital.location, label: hospital.name })
    return list
  }, [centres, hospital, busyCentres])

  return (
    <section aria-labelledby="active-deliveries" className="flex h-full flex-col overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-3 p-5 pb-4 sm:p-6 sm:pb-4">
        <div>
          <h2 id="active-deliveries" className="flex items-center gap-2 font-sans text-lg font-semibold">
            Active deliveries
            {orders.length > 0 && <LiveDot className="size-2" />}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {orders.length === 0 ? 'Nothing on the way right now' : `${orders.length} on the way to your desk`}
          </p>
        </div>
        <Link to="/orders" className="shrink-0 text-sm font-semibold text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline">
          All orders
        </Link>
      </div>

      <div className="px-3 sm:px-4">
        <LiveMap markers={markers} className="h-52 sm:h-64" interactive={false} />
      </div>

      <div className="flex-1 p-3 sm:p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 px-5 py-8 text-center">
            <span className="grid size-11 place-items-center rounded-2xl bg-ink-50 text-ink-400">
              <Navigation className="size-5" />
            </span>
            <p className="max-w-xs text-sm text-ink-600">When you place an order, its rider and live ETA show up here.</p>
            <Link to={orderHref({ priority: 'emergency' })} className={buttonClass({ size: 'sm', variant: 'secondary' })}>
              Place an order
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {orders.map((o) => {
                const status = liveStatus(o, now)
                const plan = o.plan
                const progress = plan ? Math.min(1, elapsedMs(o, now) / plan.deliverAt) : 0
                const eta = etaMs(o, now)
                const centre = centres.find((c) => c.id === o.centreId)
                return (
                  <motion.li key={o.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <Link
                      to={`/track/${o.id}`}
                      className="group block rounded-3xl border border-ink-100 bg-paper p-4 transition hover:border-ink-200 hover:bg-white hover:shadow-soft"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={status} />
                        {o.priority === 'emergency' && <Badge tone="red">Emergency</Badge>}
                        <span className="ml-auto font-mono text-xs text-ink-500">{o.id}</span>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-950">{itemsSummary(o)}</p>
                          <p className="mt-0.5 truncate text-sm text-ink-500">
                            {o.patient.name}
                            {o.patient.ward ? ` · ${o.patient.ward}` : ''}
                            {centre ? ` · from ${centre.area}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">{eta > 0 ? 'ETA' : 'At desk'}</p>
                          <p className="text-2xl font-semibold text-ink-950 tabular">{eta > 0 ? formatClock(eta) : 'Now'}</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-label="Delivery progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full bg-blood-600 transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-ink-500">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Bike className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {o.rider?.name ?? 'Rider being assigned'}
                            {plan ? ` · ${formatDistance(plan.distanceM)}` : ''}
                            {o.placedAt ? ` · placed ${formatTime(o.placedAt)}` : ''}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink-800 group-hover:text-blood-700">
                          Track <ArrowUpRight className="size-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  )
}
