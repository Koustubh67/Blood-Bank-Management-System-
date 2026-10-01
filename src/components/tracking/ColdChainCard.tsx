import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CircleCheck, Lock, Snowflake, Thermometer, TriangleAlert } from 'lucide-react'
import type { Order } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { trackingSnapshot, type TrackingSnapshot } from '@/services/tracking'
import { cn } from '@/lib/utils'
import { Badge, Card } from '@/components/ui/primitives'
import { stageClock } from './helpers'

const SAMPLE_MS = 2000
const POINTS = 36

/** Readings for one compartment at SAMPLE_MS spacing, ending at `endClock`. */
function sampleSeries(order: Order, label: string, endClock: number, count: number) {
  const out: number[] = []
  for (let k = count - 1; k >= 0; k--) {
    const r = trackingSnapshot(order, [], endClock - k * SAMPLE_MS).temps.find((t) => t.label === label)
    if (r) out.push(r.value)
  }
  return out
}

/**
 * Recent logger readings kept in component state. Seeded from the logger's
 * recent history on first sight, then appended live every couple of seconds.
 * Frozen at the handover reading once delivered.
 */
function useTempHistory(order: Order, snapshot: TrackingSnapshot, now: number) {
  const delivered = snapshot.status === 'delivered'
  const bucket = Math.floor(snapshot.elapsedMs / SAMPLE_MS)
  const [history, setHistory] = useState<Record<string, number[]>>({})

  useEffect(() => {
    const handover = stageClock(order, 'delivered') ?? now
    setHistory((prev) => {
      const next: Record<string, number[]> = {}
      for (const t of snapshot.temps) {
        const seen = prev[t.label]
        if (delivered) next[t.label] = seen ?? sampleSeries(order, t.label, handover, POINTS)
        else next[t.label] = [...(seen ?? sampleSeries(order, t.label, now - SAMPLE_MS, POINTS - 1)), t.value].slice(-POINTS)
      }
      return next
    })
    // Sample on the logger's cadence, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, delivered, snapshot.temps.length])

  return history
}

function Sparkline({ values, min, max, label }: { values: number[]; min: number; max: number; label: string }) {
  const W = 200
  const H = 44
  const pad = (max - min) * 0.2
  const lo = min - pad
  const hi = max + pad
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H
  const x = (i: number) => (values.length < 2 ? W : (i / (values.length - 1)) * W)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lastY = values.length ? (y(values[values.length - 1]) / H) * 100 : 50
  const lowest = values.length ? Math.min(...values) : min
  const highest = values.length ? Math.max(...values) : max

  return (
    <div className="relative h-11 w-full" role="img" aria-label={`${label}: last ${values.length} readings between ${lowest} and ${highest} °C`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <rect x={0} y={y(max)} width={W} height={y(min) - y(max)} rx={3} className="fill-ice-100/60" />
        <line x1={0} x2={W} y1={y(max)} y2={y(max)} className="stroke-ice-400/60" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        <line x1={0} x2={W} y1={y(min)} y2={y(min)} className="stroke-ice-400/60" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        {values.length > 1 && (
          <path d={d} fill="none" stroke="var(--color-ice-600)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {values.length > 0 && (
        <span
          className="absolute right-0 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-ice-600 ring-2 ring-white"
          style={{ top: `${lastY}%` }}
          aria-hidden
        />
      )}
    </div>
  )
}

function fmtTemp(v: number) {
  return `${v > 0 ? '' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`
}

export function ColdChainCard({ order, snapshot, now }: { order: Order; snapshot: TrackingSnapshot; now: number }) {
  const history = useTempHistory(order, snapshot, now)
  const delivered = snapshot.status === 'delivered'
  // Freeze the display at the handover reading once delivered.
  const temps = useMemo(() => {
    if (!delivered) return snapshot.temps
    const handover = stageClock(order, 'delivered')
    return handover ? trackingSnapshot(order, [], handover).temps : snapshot.temps
  }, [delivered, order, snapshot.temps])
  const components = useMemo(() => Array.from(new Set(order.items.map((i) => i.component))), [order.items])
  const allInRange = temps.every((t) => t.value >= t.min && t.value <= t.max)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-ice-50 text-ice-700">
            <Snowflake className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold whitespace-nowrap">Cold chain</h2>
            <p className="text-xs text-ink-500">
              {temps.length === 0 ? 'Logger starts when the box is sealed' : delivered ? 'Logger closed at handover' : 'Live logger readings'}
            </p>
          </div>
        </div>
        {temps.length > 0 && (
          <Badge tone="blue" className="shrink-0">
            <Lock className="size-3.5" aria-hidden /> Sealed · tamper-evident
          </Badge>
        )}
      </div>

      {temps.length === 0 ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-dashed border-ice-100 bg-ice-50/50 p-4">
            <p className="font-semibold text-ink-950">Units will be sealed at the centre</p>
            <p className="mt-1 text-sm text-ink-600">
              Once issued, the units go into a validated cold box with a temperature logger. Readings appear here live.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {components.map((c) => (
                <li key={c} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-ink-700">
                    <Thermometer className="size-4 text-ice-600" aria-hidden />
                    {COMPONENTS[c].short}
                  </span>
                  <span className="font-semibold text-ink-950 tabular">{COMPONENTS[c].tempRange}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-ink-100 px-5 sm:px-6">
          {temps.map((t) => {
            const ok = t.value >= t.min && t.value <= t.max
            return (
              <li key={t.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 py-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-700">{t.label}</p>
                  <p className="mt-0.5 text-xs text-ink-500 tabular">
                    Safe {fmtTemp(t.min)} to {fmtTemp(t.max)} °C
                  </p>
                </div>
                <div className="text-right">
                  <motion.p
                    key={t.value}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="font-display text-3xl leading-none font-bold text-ink-950 tabular"
                  >
                    {fmtTemp(t.value)}
                    <span className="ml-0.5 text-base font-semibold text-ink-500">°C</span>
                  </motion.p>
                  <p className={cn('mt-1 inline-flex items-center gap-1 text-xs font-semibold', ok ? 'text-emerald-700' : 'text-amber-800')}>
                    {ok ? <CircleCheck className="size-3.5" aria-hidden /> : <TriangleAlert className="size-3.5" aria-hidden />}
                    {ok ? 'In range' : 'Out of range'}
                  </p>
                </div>
                <div className="col-span-2 pr-1.5">
                  <Sparkline values={history[t.label] ?? [t.value]} min={t.min} max={t.max} label={t.label} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {temps.length > 0 && (
        <p className={cn('border-t border-ink-100 px-5 py-3 text-xs sm:px-6', allInRange ? 'bg-emerald-50/60 text-emerald-800' : 'bg-amber-50 text-amber-900')}>
          {allInRange
            ? delivered
              ? 'Every reading stayed within the safe range from sealing to handover.'
              : 'All compartments within the safe range. The shaded band is the permitted range.'
            : 'A reading is outside the safe range. The unit must not be transfused until the blood centre has reviewed the logger.'}
        </p>
      )}
    </Card>
  )
}
