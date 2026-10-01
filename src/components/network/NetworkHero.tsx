import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, Hospital, MapPinned, Motorbike, Snowflake, Thermometer, Timer } from 'lucide-react'
import { useCity } from '@/services/location'
import { OUTLETS } from '@/data/outlets'
import { outletTelemetry } from '@/services/outlets'
import { useNow } from '@/hooks/useNow'
import { buttonClass } from '@/components/ui/Button'
import { LiveNumber } from '@/components/stock/LiveNumber'
import { Person } from '@/components/characters/Person'
import { Prop } from '@/components/characters/Prop'
import { SpeechBubble } from '@/components/characters/SpeechBubble'
import { EASE_OUT } from '@/components/home/Reveal'
import { formatDistance } from '@/lib/utils'
import { SERVE_RADIUS_M } from './geo'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
})

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse justify-end rounded-2xl border border-ink-100 bg-white/80 p-3 backdrop-blur sm:p-4">
      <dt className="mt-1 text-[11px] leading-snug font-medium text-ink-500 sm:text-xs">{label}</dt>
      <dd className="font-display text-2xl font-bold whitespace-nowrap text-ink-950 tabular sm:text-3xl">{children}</dd>
    </div>
  )
}

// Route from the outlet (top) to the hospital door, in the scene's 100 × 90 box.
const ROUTE = 'M56 24 C 40 34, 52 56, 76 58'

/** Outlet → scooter → hospital, with a doctor asking for blood. Decorative. */
function HeroScene() {
  const reduce = useReducedMotion()
  const now = useNow(5000)
  const tempC = outletTelemetry(OUTLETS[0], undefined, now).tempC

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 }}
      className="relative mx-auto w-full max-w-132 min-w-0"
      aria-hidden
    >
      <div className="relative aspect-10/9 w-full">
        <div className="absolute inset-[8%] -z-10 rounded-full bg-blood-100/70 blur-3xl" />

        {/* A little city map */}
        <div className="absolute inset-x-[2%] top-[7%] bottom-[5%] overflow-hidden rounded-[2.25rem] bg-white/75 shadow-lift ring-1 ring-ink-100 backdrop-blur">
          <div className="grain absolute inset-0" />
          <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0 size-full text-ink-100" fill="none">
            <path d="M-2 22 C 30 18, 62 30, 102 24" stroke="currentColor" strokeWidth="6" vectorEffect="non-scaling-stroke" />
            <path d="M-2 62 C 26 56, 70 70, 102 60" stroke="currentColor" strokeWidth="6" vectorEffect="non-scaling-stroke" />
            <path d="M30 -2 C 26 30, 36 52, 28 82" stroke="currentColor" strokeWidth="5" vectorEffect="non-scaling-stroke" />
            <path d="M78 -2 C 82 26, 72 50, 80 82" stroke="currentColor" strokeWidth="5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        {/* Dotted ride from outlet to hospital */}
        <svg viewBox="0 0 100 90" className="absolute inset-0 size-full overflow-visible" fill="none">
          <path d={ROUTE} stroke="var(--color-blood-100)" strokeWidth="3.2" strokeLinecap="round" />
          <motion.path
            d={ROUTE}
            stroke="var(--color-blood-600)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="0.1 2.6"
            animate={reduce ? undefined : { strokeDashoffset: [0, -10.8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
        </svg>

        <Prop icon={Thermometer} tone="ice" float delay={0.9} className="absolute top-[4%] left-[82%] w-[11%]" />

        {/* Outlet */}
        <div className="absolute top-[17.8%] left-[56%] w-[14%] -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 animate-pulse-ring rounded-[30%] bg-blood-500/30" />
          <div className="relative grid aspect-square w-full place-items-center rounded-[30%] bg-blood-600 text-white shadow-glow ring-[3px] ring-white">
            <Snowflake className="h-1/2 w-1/2" strokeWidth={2.4} />
          </div>
        </div>
        <div className="absolute top-[12%] right-[52%] rounded-2xl bg-white px-2.5 py-1.5 shadow-soft ring-1 ring-ink-100 sm:px-3 sm:py-2">
          <p className="text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap text-ink-500 uppercase sm:text-[11px]">Outlet fridge</p>
          <p className="flex items-center gap-1.5 font-display text-sm font-bold whitespace-nowrap text-ice-700 tabular sm:text-base">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {tempC.toFixed(1)} °C
          </p>
        </div>

        <Prop icon={Motorbike} tone="ink" float delay={0.4} className="absolute top-[42%] left-[44%] w-[13%]" />
        <span className="absolute top-[33%] left-[60%] inline-flex items-center gap-1 rounded-full bg-ink-950 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-lift sm:text-xs">
          <Timer className="size-3.5 text-blood-400" /> ≈ 4 min
        </span>

        <Prop icon={Hospital} tone="indigo" className="absolute top-[54%] left-[67%] w-[18%]" />
        <Person who="doctor" mood="happy" className="absolute bottom-[5%] left-[2%] w-[28%]" />

        {/* SpeechBubble is position: relative itself, so it needs a positioned wrapper. */}
        <div className="absolute bottom-[17%] left-[29%] max-w-[38%]">
          <SpeechBubble tail="left" className="px-3 py-2 text-[12px] sm:px-4 sm:py-2.5 sm:text-[15px]">
            O− for bed 12? It&rsquo;s 4 minutes away.
          </SpeechBubble>
        </div>
      </div>
    </motion.div>
  )
}

export function NetworkHero({
  outletCount,
  open24,
  servedCount,
  medianRideMin,
}: {
  outletCount: number
  open24: number
  /** Real hospitals within the serve radius of at least one outlet */
  servedCount: number
  medianRideMin: number | null
}) {
  const city = useCity()
  return (
    <section aria-labelledby="network-title" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(50% 45% at 85% 20%, var(--color-blood-100) 0%, transparent 70%), radial-gradient(40% 40% at 65% 95%, var(--color-ice-50) 0%, transparent 70%), radial-gradient(35% 30% at 0% 25%, var(--color-ink-100) 0%, transparent 70%)',
        }}
      />
      <div aria-hidden className="grain absolute inset-0 -z-10 mask-[radial-gradient(70%_60%_at_25%_20%,black,transparent)]" />

      <div className="container-page grid grid-cols-1 items-center gap-10 pt-10 pb-14 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:pt-16 lg:pb-20">
        <div className="min-w-0">
          <motion.p {...rise(0)} className="eyebrow">
            <MapPinned className="size-4" aria-hidden /> Our network · {city.name}
          </motion.p>
          <motion.h1
            {...rise(0.06)}
            id="network-title"
            className="mt-4 text-[2.6rem] leading-[0.98] font-extrabold tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem] xl:text-7xl"
          >
            Blood stored <span className="text-blood-600">minutes</span> from the hospital.
          </motion.h1>
          <motion.p {...rise(0.14)} className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl">
            Our outlets are licensed blood storage centres, each stocked by a licensed partner blood centre and placed beside the city&rsquo;s
            busiest hospitals. When a unit is needed in an emergency, its ride starts minutes away, not across town.
          </motion.p>

          <motion.dl {...rise(0.22)} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="RaktFlow outlets">{outletCount}</Stat>
            <Stat label={`Real hospitals within ${formatDistance(SERVE_RADIUS_M)} of an outlet`}>
              <LiveNumber value={servedCount} showDelta={false} />
            </Stat>
            <Stat label="Median emergency ride to them">
              {medianRideMin === null ? (
                '—'
              ) : (
                <>
                  ≈{medianRideMin}
                  <span className="ml-0.5 text-base text-ink-400">min</span>
                </>
              )}
            </Stat>
            <Stat label="Open 24×7">
              {open24}
              <span className="text-base text-ink-400">/{outletCount}</span>
            </Stat>
          </motion.dl>

          <motion.div {...rise(0.3)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#explore" className={buttonClass({ size: 'lg', className: 'w-full sm:w-auto' })}>
              Find hospitals near you <ArrowDown className="size-5" aria-hidden />
            </a>
            <a href="#how-outlets" className={buttonClass({ size: 'lg', variant: 'outline', className: 'w-full sm:w-auto' })}>
              How outlets work
            </a>
          </motion.div>
        </div>

        <HeroScene />
      </div>
    </section>
  )
}
