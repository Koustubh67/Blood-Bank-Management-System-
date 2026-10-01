import { motion } from 'motion/react'
import { CircleCheck, LockKeyhole, Navigation, Snowflake } from 'lucide-react'
import { COMPONENTS } from '@/data/blood'
import { LiveDot } from '@/components/ui/primitives'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'

const TICK_MS = 2000
const HISTORY = 36

/** Deterministic logger wobble so the readout feels live without randomness. */
function reading(base: number, amp: number, k: number, phase: number) {
  const v = base + Math.sin(k / 3.3 + phase) * amp + Math.sin(k / 1.4 + phase * 2) * amp * 0.35
  return Math.round(v * 10) / 10
}

const fmt = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)} °C`

interface Compartment {
  label: string
  detail: string
  value: number
  /** Scale shown on the mini bar */
  scale: [number, number]
  /** Safe band on the scale */
  band: [number, number]
  bar: string
}

export function ColdBoxVisual() {
  const now = useNow(TICK_MS)
  const k = Math.floor(now / TICK_MS)

  const compartments: Compartment[] = [
    {
      label: COMPONENTS.PRBC.short,
      detail: COMPONENTS.PRBC.tempRange,
      value: reading(4, 0.55, k, 0),
      scale: [0, 8],
      band: [2, 6],
      bar: 'bg-blood-500',
    },
    {
      label: COMPONENTS.PLT.short,
      detail: 'Agitated · ' + COMPONENTS.PLT.tempRange.replace(' with agitation', ''),
      value: reading(22, 0.6, k, 1.7),
      scale: [18, 26],
      band: [20, 24],
      bar: 'bg-amber-400',
    },
    {
      label: `${COMPONENTS.FFP.short} & ${COMPONENTS.CRYO.short.toLowerCase()}`,
      detail: COMPONENTS.FFP.tempRange,
      value: reading(-33, 0.9, k, 3.1),
      scale: [-40, -22],
      band: [-40, -30],
      bar: 'bg-ice-400',
    },
  ]

  // Sparkline of the red-cell compartment: one reading every 2 s.
  const series = Array.from({ length: HISTORY }, (_, i) => reading(4, 0.55, k - (HISTORY - 1 - i), 0))
  const W = 300
  const H = 88
  const PAD_Y = 8
  const yMin = 0
  const yMax = 8
  const x = (i: number) => (i / (HISTORY - 1)) * W
  const y = (v: number) => PAD_Y + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD_Y * 2)
  const path = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const last = series[series.length - 1]

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[3rem] bg-ice-500/10 blur-2xl" aria-hidden />
      <div
        className="relative rounded-4xl bg-white/6 p-5 ring-1 ring-white/12 backdrop-blur-sm sm:p-6"
        role="img"
        aria-label={`Illustration of a sealed cold box logger. Red cells at ${fmt(last)}, all compartments within their safe range.`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-ice-400 uppercase">
              <LiveDot color="bg-ice-400" className="size-2" /> Live logger
            </p>
            <p className="mt-1.5 font-display text-lg font-bold text-white">Cold box CB-0427</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
            <LockKeyhole className="size-3.5" aria-hidden /> Seal intact
          </span>
        </div>

        {/* Sparkline */}
        <div className="mt-5 rounded-3xl bg-ink-950/60 p-4 ring-1 ring-white/10">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-ink-400">Red cell compartment · last 72 s</p>
            <p className="font-display text-2xl font-bold text-white tabular">{fmt(last)}</p>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-20 w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
            <rect x="0" y={y(6)} width={W} height={y(2) - y(6)} rx="6" fill="rgb(34 211 238 / 0.10)" />
            <line
              x1="0"
              x2={W}
              y1={y(6)}
              y2={y(6)}
              stroke="rgb(34 211 238 / 0.35)"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              x2={W}
              y1={y(2)}
              y2={y(2)}
              stroke="rgb(34 211 238 / 0.35)"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              fill="none"
              stroke="var(--color-ice-400)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="mt-1 flex justify-between text-[11px] text-ink-500">
            <span>Safe band 2–6 °C</span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CircleCheck className="size-3.5" aria-hidden /> In range
            </span>
          </div>
        </div>

        {/* Compartments */}
        <ul className="mt-4 space-y-3">
          {compartments.map((c) => {
            const span = c.scale[1] - c.scale[0]
            const pos = (v: number) => `${((Math.min(Math.max(v, c.scale[0]), c.scale[1]) - c.scale[0]) / span) * 100}%`
            return (
              <li key={c.label} className="rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/8">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{c.label}</p>
                  <p className="font-semibold text-white tabular">{fmt(c.value)}</p>
                </div>
                <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
                  <span
                    className={cn('absolute inset-y-0 rounded-full opacity-60', c.bar)}
                    style={{ left: pos(c.band[0]), width: `calc(${pos(c.band[1])} - ${pos(c.band[0])})` }}
                  />
                  <motion.span
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-ink-950"
                    animate={{ left: pos(c.value) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-400">{c.detail}</p>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-ink-300 ring-1 ring-white/10">
            <Navigation className="size-3.5 text-blood-400" aria-hidden /> GPS · en route
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-ink-300 ring-1 ring-white/10">
            <Snowflake className="size-3.5 text-ice-400" aria-hidden /> 3 compartments
          </span>
          <span className="ml-auto text-[11px] text-ink-500">Illustrative data</span>
        </div>
      </div>
    </div>
  )
}
