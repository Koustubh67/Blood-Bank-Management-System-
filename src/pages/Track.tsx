import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Ban, Headset, SearchX, Share2 } from 'lucide-react'
import type { Order } from '@/types'
import { BRAND } from '@/config/brand'
import { canCancel, STATUS_LABEL, useOrder } from '@/services/orders'
import { TRACKING_STAGES, useTracking } from '@/services/tracking'
import { useCurrentUser } from '@/services/auth'
import { cn, formatClock, formatDateTime } from '@/lib/utils'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, LiveDot, Skeleton } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { StatusHeader } from '@/components/tracking/StatusHeader'
import { StageTimeline } from '@/components/tracking/StageTimeline'
import { RiderCard } from '@/components/tracking/RiderCard'
import { HandoverOtpCard } from '@/components/tracking/HandoverOtpCard'
import { ColdChainCard } from '@/components/tracking/ColdChainCard'
import { OrderDetailsCard } from '@/components/tracking/OrderDetailsCard'
import { CancelOrderModal } from '@/components/tracking/CancelOrderModal'
import { DemoControls } from '@/components/tracking/DemoControls'
import { DeliveredCard } from '@/components/tracking/DeliveredCard'
import { CancelledState, PaymentPendingState } from '@/components/tracking/OrderStateCards'
import { isOrderOwner, shareTrackingLink } from '@/components/tracking/helpers'

function Narrow({ children }: { children: ReactNode }) {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}

export default function Track() {
  const { orderId = '' } = useParams()
  const id = orderId.trim().toUpperCase()
  const order = useOrder(id)
  const user = useCurrentUser()
  const owner = order ? isOrderOwner(order, user) : false

  if (!order) {
    return (
      <Narrow>
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="We couldn’t find that order"
          description={`No order matches ${id || 'that ID'}. Check the ID on your receipt or in My orders. In this prototype, orders live in the browser they were placed from.`}
          action={
            <ButtonLink to="/track" variant="dark">
              Look up another order
            </ButtonLink>
          }
        />
      </Narrow>
    )
  }
  if (order.status === 'pending_payment' || order.status === 'payment_failed') {
    return (
      <Narrow>
        <PaymentPendingState order={order} />
      </Narrow>
    )
  }
  if (order.status === 'cancelled') {
    return (
      <Narrow>
        <CancelledState order={order} isOwner={owner} />
      </Narrow>
    )
  }
  if (!order.plan || !order.placedAt) {
    return (
      <Narrow>
        <EmptyState title="Tracking starts shortly" description="We are confirming your payment with the bank. This page updates on its own." />
      </Narrow>
    )
  }
  return <LiveTracking order={order} isOwner={owner} signedIn={!!user} />
}

function LiveTracking({ order, isOwner, signedIn }: { order: Order; isOwner: boolean; signedIn: boolean }) {
  const { snapshot, route, centre, hospital, now } = useTracking(order)
  const [cancelOpen, setCancelOpen] = useState(false)

  const status = snapshot?.status
  const delivered = status === 'delivered'
  const onRoad = status === 'dispatched' || status === 'arriving'

  // Toast whenever the stage changes (not on first load).
  const prevStatus = useRef(status)
  useEffect(() => {
    const prev = prevStatus.current
    prevStatus.current = status
    if (!prev || !status || prev === status) return
    const stage = TRACKING_STAGES.find((s) => s.key === status)
    if (status === 'delivered') toast.success('Delivered', 'Handed over at the blood transfusion desk.')
    else if (stage) toast.info(stage.label, stage.detail)
  }, [status])

  // Live countdown in the browser tab, like a delivery app.
  const remaining = snapshot?.remainingMs ?? 0
  useEffect(() => {
    const prev = document.title
    return () => {
      document.title = prev
    }
  }, [])
  useEffect(() => {
    if (!status) return
    document.title = delivered
      ? `Delivered · ${order.id} · ${BRAND.name}`
      : `${remaining > 0 ? formatClock(remaining) : 'Arriving'} · ${STATUS_LABEL[status]} · ${BRAND.name}`
  }, [status, delivered, remaining, order.id])

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = []
    if (centre) m.push({ id: centre.id, position: centre.location, kind: 'centre', label: `${centre.name} · pickup`, active: true })
    if (hospital) m.push({ id: hospital.id, position: hospital.location, kind: 'hospital', label: `${hospital.name} · drop` })
    return m
  }, [centre, hospital])

  if (!snapshot) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-[50vh] w-full" />
      </div>
    )
  }

  const rider = !delivered && snapshot.riderPosition ? { position: snapshot.riderPosition, heading: snapshot.riderHeading } : null
  const showCancel = isOwner && canCancel(order, now)

  return (
    <div className="container-page pb-16 lg:pt-6">
      <h1 className="sr-only">Tracking order {order.id}</h1>
      <p className="sr-only" role="status" aria-live="polite">
        {`Order ${order.id}: ${STATUS_LABEL[snapshot.status]}.`}
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-8">
        {/* Map */}
        <div className="relative -mx-4 sm:-mx-6 lg:sticky lg:top-22 lg:mx-0">
          <LiveMap
            markers={markers}
            route={route}
            routeProgress={delivered ? 1 : snapshot.rideProgress}
            rider={rider}
            className="h-[50svh] min-h-80 max-lg:rounded-none lg:h-[calc(100dvh-9rem)] lg:min-h-140 lg:rounded-4xl lg:shadow-soft"
          />

          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end gap-2 sm:inset-x-4 sm:top-4">
            <span className="pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-white/90 px-3.5 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur">
              {delivered ? (
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden />
              ) : (
                <LiveDot className="size-2" color={onRoad ? 'bg-blood-600' : 'bg-ice-500'} />
              )}
              <span className="tabular">{order.id}</span>
            </span>
            <button
              type="button"
              onClick={() => void shareTrackingLink(order.id)}
              className="pointer-events-auto grid size-10 place-items-center rounded-full bg-white/90 text-ink-900 shadow-soft backdrop-blur transition hover:bg-white"
              aria-label="Share tracking link"
            >
              <Share2 className="size-4" />
            </button>
          </div>

          <ul className="pointer-events-none absolute bottom-4 left-4 z-10 hidden gap-2 lg:flex" aria-label="Map legend">
            <LegendChip color="bg-blood-600" shape="rounded-[3px]" label="Blood centre" />
            <LegendChip color="bg-ice-600" shape="rounded-full" label="Hospital" />
            {rider && <LegendChip color="bg-blood-600" shape="rounded-full ring-2 ring-blood-200" label="Rider" />}
          </ul>
        </div>

        {/* Panel: bottom sheet on mobile, side column on desktop */}
        <div className="relative z-10 -mx-4 -mt-7 rounded-t-4xl bg-paper px-4 pt-3 shadow-[0_-16px_32px_-20px_rgb(15_12_11/0.35)] sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink-200 lg:hidden" aria-hidden />
          <div className="mx-auto flex max-w-xl flex-col gap-4 lg:max-w-none">
            <div className="flex items-center justify-between gap-3">
              <Link
                to={signedIn ? '/orders' : '/track'}
                className="inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {signedIn ? 'My orders' : 'Track another order'}
              </Link>
              <span className="text-xs text-ink-500 tabular">Placed {formatDateTime(order.placedAt!)}</span>
            </div>

            {delivered ? <DeliveredCard order={order} hospital={hospital} /> : <StatusHeader order={order} snapshot={snapshot} now={now} />}

            {!delivered && onRoad && order.rider && <RiderCard rider={order.rider} snapshot={snapshot} route={route} />}
            {!delivered && <HandoverOtpCard otp={order.handoverOtp} canView={isOwner} delivered={false} />}

            <StageTimeline order={order} snapshot={snapshot} />
            <ColdChainCard order={order} snapshot={snapshot} now={now} />
            {delivered && <HandoverOtpCard otp={order.handoverOtp} canView={isOwner} delivered />}
            <OrderDetailsCard order={order} hospital={hospital} centre={centre} isOwner={isOwner} />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void shareTrackingLink(order.id)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white text-sm font-semibold text-ink-900 transition hover:border-ink-300 hover:bg-ink-50"
              >
                <Share2 className="size-4" aria-hidden /> Share tracking link
              </button>
              {showCancel && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold text-blood-700 transition hover:bg-blood-50"
                >
                  <Ban className="size-4" aria-hidden /> Cancel order
                </button>
              )}
            </div>
            {isOwner && !showCancel && !delivered && (
              <p className="-mt-1 text-center text-xs text-ink-500">
                The units are packed, so this order can no longer be cancelled online. Call {BRAND.supportPhone} if it must be stopped.
              </p>
            )}

            <DemoControls order={order} snapshot={snapshot} />

            <div className="flex items-start gap-3 rounded-3xl bg-ink-950 p-4 text-sm text-ink-300">
              <Headset className="mt-0.5 size-5 shrink-0 text-ice-400" aria-hidden />
              <p>
                Questions about this delivery?{' '}
                <a href={`tel:${BRAND.supportPhone.replace(/\D/g, '')}`} className="font-semibold text-white underline-offset-4 hover:underline">
                  Call {BRAND.supportPhone}
                </a>
                . For a medical emergency, call{' '}
                <a href={`tel:${BRAND.emergencyPhone}`} className="font-semibold text-white underline-offset-4 hover:underline">
                  {BRAND.emergencyPhone}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOwner && <CancelOrderModal order={order} open={cancelOpen} onClose={() => setCancelOpen(false)} />}
    </div>
  )
}

function LegendChip({ color, shape, label }: { color: string; shape: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-soft backdrop-blur">
      <span className={cn('size-2.5', color, shape)} aria-hidden />
      {label}
    </li>
  )
}
