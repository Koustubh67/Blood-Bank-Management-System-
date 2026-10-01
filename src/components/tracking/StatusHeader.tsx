import { AnimatePresence, motion } from 'motion/react'
import { Route, Siren } from 'lucide-react'
import type { Order } from '@/types'
import { TRACKING_STAGES, type TrackingSnapshot } from '@/services/tracking'
import { clamp, cn, formatClock, formatDistance, formatTime } from '@/lib/utils'
import { Badge, Card, LiveDot } from '@/components/ui/primitives'
import { PRIORITY_META, stageClock, stageOffset } from './helpers'

export function PriorityBadge({ priority, className }: { priority: Order['priority']; className?: string }) {
  const meta = PRIORITY_META[priority]
  return (
    <Badge tone={meta.tone} className={className}>
      {priority === 'emergency' && <Siren className="size-3.5" aria-hidden />}
      {meta.label}
    </Badge>
  )
}

/** Stage, live ETA countdown and journey progress. */
export function StatusHeader({ order, snapshot, now }: { order: Order; snapshot: TrackingSnapshot; now: number }) {
  const plan = order.plan!
  const stage = TRACKING_STAGES[Math.max(0, snapshot.stage)]
  const atHospital = snapshot.remainingMs <= 0
  const progress = clamp(snapshot.elapsedMs / plan.deliverAt, 0, 1)
  const onRoad = snapshot.status === 'dispatched' || snapshot.status === 'arriving'
  const placedClock = stageClock(order, 'placed')
  const handoverClock = stageClock(order, 'delivered')

  return (
    <Card className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">
            <LiveDot className="size-2" /> Live
          </p>
          <PriorityBadge priority={order.priority} />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={snapshot.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-3"
          >
            <h2 className="text-3xl leading-tight font-bold sm:text-[2.1rem]">{atHospital ? 'At the hospital' : stage.label}</h2>
            <p className="mt-1.5 text-sm text-ink-600">
              {atHospital ? 'The rider is at the blood transfusion desk. Share the OTP once the sealed box is in front of you.' : stage.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mx-3 mb-3 overflow-hidden rounded-[1.25rem] bg-ink-950 p-4 text-white sm:mx-4 sm:mb-4 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[16px_16px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-blood-600/40 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">{atHospital ? 'Handover' : 'Arriving in'}</p>
            <p className="mt-1 font-display text-5xl leading-none font-bold tabular sm:text-6xl" aria-hidden={!atHospital}>
              {atHospital ? 'Now' : formatClock(snapshot.remainingMs)}
            </p>
            {!atHospital && <span className="sr-only">Arriving in about {Math.max(1, Math.ceil(snapshot.remainingMs / 60000))} minutes</span>}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">Expected by</p>
            <p className="mt-1 text-xl font-semibold tabular">{formatTime(now + snapshot.remainingMs)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-white/60">
              <Route className="size-3.5" aria-hidden /> {formatDistance(plan.distanceM)} route
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <div
            className="relative h-2 rounded-full bg-white/15"
            role="progressbar"
            aria-label="Delivery progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <motion.div
              className={cn('absolute inset-y-0 left-0 rounded-full', onRoad || atHospital ? 'bg-blood-500' : 'bg-ice-400')}
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
            {TRACKING_STAGES.map((s, i) => {
              // Ends of the bar already read as "placed" and "handover".
              if (i === 0 || i === TRACKING_STAGES.length - 1) return null
              const at = stageOffset(plan, s.key) / plan.deliverAt
              const done = i <= snapshot.stage
              return (
                <span
                  key={s.key}
                  className={cn(
                    'absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ink-950 transition-colors',
                    done ? 'bg-white' : 'bg-white/30',
                  )}
                  style={{ left: `${clamp(at, 0.01, 0.99) * 100}%` }}
                  aria-hidden
                />
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/55 tabular">
            <span>Placed {placedClock ? formatTime(placedClock) : ''}</span>
            <span>
              {snapshot.status === 'delivered' ? 'Handed over' : 'Handover'} {handoverClock ? `~${formatTime(handoverClock)}` : ''}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
