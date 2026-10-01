import { FastForward, FlaskConical, SkipForward } from 'lucide-react'
import type { Order } from '@/types'
import { fastForward } from '@/services/orders'
import { ApiError } from '@/services/api'
import { TRACKING_STAGES, type TrackingSnapshot } from '@/services/tracking'
import { DEMO_MODE } from '@/config/brand'
import { toast } from '@/components/ui/Toast'
import { stageOffset } from './helpers'

/** Prototype-only: skip this order's simulated clock forward. */
export function DemoControls({ order, snapshot }: { order: Order; snapshot: TrackingSnapshot }) {
  if (!DEMO_MODE || !order.plan || snapshot.status === 'delivered') return null
  const plan = order.plan

  const skip = (ms: number) => {
    try {
      fastForward(order.id, ms)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not fast-forward this order.')
    }
  }

  const next = TRACKING_STAGES[snapshot.stage + 1]
  const toNext = next ? Math.max(1000, stageOffset(plan, next.key) - snapshot.elapsedMs + 500) : 0

  const btn =
    'inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 text-xs font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50 active:scale-[0.98]'

  return (
    <section aria-label="Demo controls" className="rounded-3xl border border-dashed border-ink-300 bg-ink-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-ink-500 uppercase">
        <FlaskConical className="size-4" aria-hidden /> Demo controls
      </div>
      <p className="mt-1.5 text-xs text-ink-500">Moves this order&rsquo;s simulated clock forward. Shown only in prototype mode.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => skip(60_000)}>
          <FastForward className="size-3.5" aria-hidden /> +1 min
        </button>
        <button type="button" className={btn} onClick={() => skip(180_000)}>
          <FastForward className="size-3.5" aria-hidden /> +3 min
        </button>
        {next && (
          <button type="button" className={btn} onClick={() => skip(toNext)}>
            <SkipForward className="size-3.5" aria-hidden /> Skip to &ldquo;{next.label}&rdquo;
          </button>
        )}
      </div>
    </section>
  )
}
