import { motion } from 'motion/react'
import { Bike, Check, CircleCheckBig, ClipboardCheck, MapPin, PackageCheck, Stethoscope, type LucideIcon } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'
import { TRACKING_STAGES, type TrackingSnapshot } from '@/services/tracking'
import { clamp, cn, formatTime } from '@/lib/utils'
import { Card } from '@/components/ui/primitives'
import { stageClock, stageOffset } from './helpers'

const ICONS: Partial<Record<OrderStatus, LucideIcon>> = {
  placed: ClipboardCheck,
  verified: Stethoscope,
  packed: PackageCheck,
  dispatched: Bike,
  arriving: MapPin,
  delivered: CircleCheckBig,
}

type State = 'done' | 'active' | 'upcoming'

export function StageTimeline({ order, snapshot }: { order: Order; snapshot: TrackingSnapshot }) {
  const plan = order.plan!
  const delivered = snapshot.status === 'delivered'
  const last = TRACKING_STAGES.length - 1

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Journey</h2>
        <p className="text-xs text-ink-500">Times shown in your local time</p>
      </div>
      <ol className="flex flex-col">
        {TRACKING_STAGES.map((s, i) => {
          const state: State = delivered || i < snapshot.stage ? 'done' : i === snapshot.stage ? 'active' : 'upcoming'
          const Icon = ICONS[s.key] ?? ClipboardCheck
          const at = stageClock(order, s.key)
          // How far through this stage we are, to fill the connector live.
          let fill = state === 'done' ? 1 : 0
          if (state === 'active' && i < last) {
            const start = stageOffset(plan, s.key)
            const end = stageOffset(plan, TRACKING_STAGES[i + 1].key)
            fill = clamp((snapshot.elapsedMs - start) / Math.max(1, end - start), 0, 1)
          }
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === 'active' ? 'step' : undefined}>
              {i < last && (
                <span className="absolute top-11 bottom-1 left-[19px] w-0.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                  <motion.span
                    className="absolute inset-x-0 top-0 block rounded-full bg-blood-600"
                    initial={false}
                    animate={{ height: `${fill * 100}%` }}
                    transition={{ duration: 0.9, ease: 'linear' }}
                  />
                </span>
              )}
              <span className="relative shrink-0">
                {state === 'active' && !delivered && (
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-blood-600/30" aria-hidden />
                )}
                <motion.span
                  className={cn(
                    'relative grid size-10 place-items-center rounded-full transition-colors duration-500',
                    state === 'done' && 'bg-blood-600 text-white',
                    state === 'active' && 'bg-ink-950 text-white ring-4 ring-blood-100',
                    state === 'upcoming' && 'border border-dashed border-ink-300 bg-white text-ink-400',
                  )}
                  initial={false}
                  animate={{ scale: state === 'active' ? 1.04 : 1 }}
                >
                  {state === 'done' ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <Icon className="size-[18px]" aria-hidden />}
                </motion.span>
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn('text-[15px] font-semibold', state === 'upcoming' ? 'text-ink-500' : 'text-ink-950')}>
                    {s.label}
                    <span className="sr-only">{state === 'done' ? ' (done)' : state === 'active' ? ' (in progress)' : ' (upcoming)'}</span>
                  </p>
                  {at && (
                    <time
                      dateTime={new Date(at).toISOString()}
                      className={cn(
                        'shrink-0 text-xs font-medium tabular',
                        state === 'done' && 'text-ink-600',
                        state === 'active' && 'rounded-full bg-blood-50 px-2 py-0.5 font-semibold text-blood-700',
                        state === 'upcoming' && 'text-ink-400',
                      )}
                    >
                      {state === 'upcoming' ? `~${formatTime(at)}` : state === 'active' && !delivered ? `Since ${formatTime(at)}` : formatTime(at)}
                    </time>
                  )}
                </div>
                {(state === 'active' || (delivered && i === last)) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1 text-sm text-ink-600"
                  >
                    {s.detail}
                  </motion.p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
