import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { ArrowRight, Droplets, House, MapPinned, Siren } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { buttonClass } from '@/components/ui/Button'

const LINKS: { to: string; label: string; hint: string; icon: ReactNode }[] = [
  { to: '/', label: 'Home', hint: 'Start from the beginning', icon: <House className="size-5" /> },
  { to: '/track', label: 'Track an order', hint: 'Follow a delivery live', icon: <MapPinned className="size-5" /> },
  { to: '/availability', label: 'Live blood stock', hint: 'See units available now', icon: <Droplets className="size-5" /> },
]

// A route that wanders off and breaks: the drop has lost its way.
const ROUTE = 'M58 212 C 120 212 132 150 186 150 S 250 214 306 196 S 356 96 410 110 S 470 168 500 132'

function LostRoute() {
  return (
    <svg
      viewBox="0 0 600 280"
      className="h-auto w-full"
      role="img"
      aria-label="A dotted delivery route that trails off, with a blood drop hovering beside a question mark"
    >
      <defs>
        <radialGradient id="nf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-blood-200)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-blood-200)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nf-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--color-ink-400)" />
          <stop offset="70%" stopColor="var(--color-ink-400)" />
          <stop offset="100%" stopColor="var(--color-ink-400)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Street grid */}
      <g stroke="var(--color-ink-100)" strokeWidth="10" strokeLinecap="round">
        <path d="M20 70 H580 M20 250 H580 M110 20 V260 M360 20 V260" />
      </g>
      <g stroke="var(--color-ink-100)" strokeWidth="4" strokeLinecap="round">
        <path d="M20 160 H580 M240 20 V260 M480 20 V260" />
      </g>

      {/* Planned route (ghost) */}
      <path d={ROUTE} fill="none" stroke="var(--color-ink-200)" strokeWidth="6" strokeLinecap="round" />

      {/* Dotted route, drawn in once through a mask, with dots marching along it */}
      <mask id="nf-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="280">
        <motion.path
          d={ROUTE}
          fill="none"
          stroke="white"
          strokeWidth="14"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
        />
      </mask>
      <path
        d={ROUTE}
        fill="none"
        stroke="url(#nf-fade)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="0.5 11.5"
        mask="url(#nf-reveal)"
        className="animate-ecg"
      />

      {/* Start: blood centre pin */}
      <g transform="translate(58 212)">
        <circle r="16" fill="white" stroke="var(--color-ink-950)" strokeWidth="4" />
        <circle r="5" fill="var(--color-ink-950)" />
      </g>

      {/* Scattered breadcrumbs where the route breaks */}
      {[
        [522, 120, 1],
        [540, 136, 0.6],
        [532, 158, 0.35],
      ].map(([x, y, o], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="3.5"
          fill="var(--color-ink-400)"
          initial={{ opacity: 0 }}
          animate={{ opacity: o }}
          transition={{ delay: 1.6 + i * 0.15 }}
        />
      ))}

      {/* The lost drop */}
      <circle cx="470" cy="70" r="70" fill="url(#nf-glow)" />
      <g className="animate-float" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
        <path d="M470 22c-14 19-24 32-24 45a24 24 0 0 0 48 0c0-13-10-26-24-45z" fill="var(--color-blood-600)" />
        <path d="M459 70a11 11 0 0 0 8 12" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* Question bubble */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, type: 'spring', damping: 14 }}
      >
        <rect x="508" y="14" width="44" height="40" rx="14" fill="var(--color-ink-950)" />
        <path d="M516 52 l-6 10 l14 -8z" fill="var(--color-ink-950)" />
        <text x="530" y="43" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="24" fill="white">
          ?
        </text>
      </motion.g>
    </svg>
  )
}

export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <section className="relative overflow-hidden">
        <div
          className="grain pointer-events-none absolute inset-0 opacity-60 mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-28">
          <div className="order-2 lg:order-1">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
              Error 404 · Route not found
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-4 text-4xl leading-[1.05] font-bold sm:text-6xl"
            >
              This drop took a <span className="text-blood-600">wrong turn.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-5 max-w-[52ch] text-lg text-ink-600"
            >
              We couldn't find a page at{' '}
              <code className="rounded-lg bg-ink-100 px-2 py-0.5 font-mono text-[0.9em] break-all text-ink-900">{pathname}</code>. Don't
              worry, every real delivery stays on its route. Let's get you back on yours.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mt-8 grid gap-2 sm:grid-cols-3"
            >
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="group flex h-full items-center gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift sm:flex-col sm:items-start sm:gap-4"
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blood-50 text-blood-600 transition group-hover:bg-blood-600 group-hover:text-white"
                      aria-hidden
                    >
                      {l.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-950">{l.label}</span>
                      <span className="block text-sm text-ink-500">{l.hint}</span>
                    </span>
                    <ArrowRight
                      className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-blood-600 sm:hidden"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.6 }}
              className="mt-6 flex flex-col gap-3 rounded-3xl bg-ink-950 p-5 text-ink-300 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <p className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blood-600 text-white" aria-hidden>
                  <Siren className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-white">Medical emergency?</span>
                  <span className="block text-sm text-ink-400">Don't wait for a page to load.</span>
                </span>
              </p>
              <a href={`tel:${BRAND.emergencyPhone}`} className={buttonClass({ size: 'md', className: 'shrink-0' })}>
                Call {BRAND.emergencyPhone}
              </a>
            </motion.div>
          </div>

          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 1] }}
          >
            <div className="relative rounded-5xl border border-ink-100 bg-white p-4 shadow-lift sm:p-8">
              <p
                className="pointer-events-none absolute top-4 left-6 font-display text-[5.5rem] leading-none font-bold tracking-tighter text-ink-100 select-none sm:top-6 sm:left-8 sm:text-[8rem]"
                aria-hidden
              >
                404
              </p>
              <div className="relative pt-10 sm:pt-16">
                <LostRoute />
              </div>
              <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-ink-500">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full border-2 border-ink-950 bg-white" aria-hidden /> Left the centre
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-blood-600" aria-hidden /> Destination unknown
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  )
}
