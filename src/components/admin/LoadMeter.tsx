import { Gauge, PhoneCall, Zap } from 'lucide-react'
import type { LoadInfo, LoadLevel } from '@/services/admin/dispatch'
import { callInOffShift, setSurge } from '@/services/admin/actions'
import { useOps } from '@/services/admin/store'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const LEVEL: Record<LoadLevel, { label: string; text: string; dot: string }> = {
  normal: { label: 'Normal', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  busy: { label: 'Busy', text: 'text-amber-800', dot: 'bg-amber-500' },
  surge: { label: 'Surge', text: 'text-blood-700', dot: 'bg-blood-600' },
}

/** Ratio scale: Normal up to 0.75, Busy to 1.5, Surge beyond (drawn to 2). */
const SEGMENTS = [
  { level: 'normal' as const, share: 37.5, fill: 'bg-emerald-400' },
  { level: 'busy' as const, share: 37.5, fill: 'bg-amber-400' },
  { level: 'surge' as const, share: 25, fill: 'bg-blood-500' },
]

function suggestion(load: LoadInfo, surge: boolean) {
  if (load.level === 'normal') return load.demand ? 'Every order in the queue has a free rider within reach.' : 'No orders are waiting for a rider.'
  const stuck = load.waiting
  if (!surge)
    return stuck
      ? `${stuck} order${stuck === 1 ? '' : 's'} can't be covered by ${stuck === 1 ? 'its' : 'their'} own store's riders. Surge mode lets the nearest free rider from another store take ${stuck === 1 ? 'it' : 'them'}.`
      : 'Riders are stretched. Surge mode shares riders across stores and holds non-urgent scheduled orders.'
  return stuck
    ? `Surge mode is on and ${stuck} order${stuck === 1 ? ' is' : 's are'} still short of a rider. Call in off-shift riders.`
    : 'Surge mode is on: riders are shared across stores and relaxed scheduled orders wait.'
}

/** Marker position: inside the segment of the current level, further along as ratio or uncovered orders grow. */
function markerPos(load: LoadInfo) {
  const clamp = (n: number) => Math.min(1, Math.max(0, n))
  if (load.level === 'normal') return 37.5 * clamp(load.ratio / 0.75) * 0.95
  if (load.level === 'busy') return 37.5 + 37.5 * (0.1 + 0.85 * clamp(Math.max((load.ratio - 0.75) / 0.75, load.waiting / 3)))
  return 75 + 25 * (0.1 + 0.85 * clamp(Math.max((load.ratio - 1.5) / 0.5, (load.waiting - 3) / 6)))
}

export function LoadMeter({ load, scope, className }: { load: LoadInfo; scope: string; className?: string }) {
  const surge = useOps((s) => s.surge)
  const pos = markerPos(load)
  const style = LEVEL[load.level]
  const callIn = () => {
    const n = callInOffShift(scope)
    if (n) toast.success(`${n} rider${n === 1 ? '' : 's'} called in`, 'They show as available straight away in this prototype.')
    else toast.info('No off-shift riders to call in here')
  }
  return (
    <section aria-labelledby="load-title" className={cn('rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="load-title" className="flex items-center gap-2 font-sans text-[15px] font-semibold text-ink-950">
            <Gauge className="size-4 text-ink-400" aria-hidden /> Rider load
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">Orders not yet dispatched without a rider ÷ riders free now; busier when a store can&rsquo;t cover its own</p>
        </div>
        <p className={cn('inline-flex items-center gap-2 text-lg font-bold', style.text)} aria-live="polite">
          <span className={cn('size-2.5 rounded-full', style.dot)} aria-hidden />
          {style.label}
          <span className="text-xs font-medium text-ink-500 tabular">ratio {load.ratio.toFixed(2)}</span>
        </p>
      </div>

      <div className="relative mt-4" role="meter" aria-valuemin={0} aria-valuemax={2} aria-valuenow={Math.min(2, Number(load.ratio.toFixed(2)))} aria-valuetext={`${style.label}, ${load.demand} orders for ${load.available} free riders`} aria-label="Rider load">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {SEGMENTS.map((s) => (
            <span key={s.level} className={cn('h-full', s.fill, s.level !== load.level && 'opacity-35')} style={{ width: `${s.share}%` }} />
          ))}
        </div>
        <span className="absolute -top-1 h-4.5 w-1.5 -translate-x-1/2 rounded-full bg-ink-950 ring-2 ring-white transition-[left] duration-700" style={{ left: `${pos}%` }} aria-hidden />
        <div className="mt-1.5 flex text-[10px] font-medium text-ink-400">
          <span style={{ width: '37.5%' }}>Normal</span>
          <span style={{ width: '37.5%' }}>Busy</span>
          <span>Surge</span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Need a rider', load.demand],
          ['Riders free', load.available],
          ["Can't cover", load.waiting],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-ink-50 px-2 py-2.5">
            <dt className="text-[11px] text-ink-500">{k}</dt>
            <dd className="font-display text-xl font-bold text-ink-950 tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <div className={cn('mt-4 rounded-2xl px-4 py-3 text-sm', load.level === 'normal' ? 'bg-emerald-50/60 text-emerald-900' : load.level === 'busy' ? 'bg-amber-50 text-amber-950' : 'bg-blood-50 text-blood-900')}>
        <p>{suggestion(load, surge)}</p>
        {load.level !== 'normal' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!surge && (
              <Button size="sm" variant="dark" icon={<Zap className="size-4" />} onClick={() => setSurge(true)}>
                Turn on Surge mode
              </Button>
            )}
            {load.offShift > 0 && (
              <Button size="sm" variant="white" icon={<PhoneCall className="size-4" />} onClick={callIn}>
                Call in {load.offShift} off-shift rider{load.offShift === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
