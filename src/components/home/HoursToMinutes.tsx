import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Droplets, FileCheck, IndianRupee, Navigation, type LucideIcon } from 'lucide-react'
import { BRAND, FEES } from '@/config/brand'
import { useCity } from '@/services/location'
import { Person } from '@/components/characters/Person'
import { cn, formatINR } from '@/lib/utils'
import { EASE_OUT, HomeHeading, Reveal, SECTION_Y } from './Reveal'

/** Where a family's day goes on the counter route. `hours` is the middle of each typical range and only sizes the bar. */
const LEGS = [
  { label: 'Requisition', time: '~30 min', hours: 0.5, color: 'var(--color-amber-200)' },
  { label: 'Phone round', time: '1–3 h', hours: 2, color: 'var(--color-amber-300)' },
  { label: 'Counter queue', time: '~1 h', hours: 1, color: 'var(--color-orange-300)' },
  { label: 'Donor hunt', time: '2–6 h', hours: 4, color: 'var(--color-orange-400)' },
  { label: 'Issue wait', time: '1–2 h', hours: 1.5, color: 'var(--color-blood-400)' },
  { label: 'Carry back', time: '~1 h', hours: 1, color: 'var(--color-blood-600)' },
]

const TOTAL_HOURS = LEGS.reduce((s, l) => s + l.hours, 0)
const FAST_HOURS = 0.25
const TICKS = [0, 2, 4, 6, 8, 10]

interface Step {
  icon: LucideIcon
  title: string
  body: (city: string) => string
  /** Target time for this step on the RaktFlow route */
  time: string
  /** The counter-route chore this step removes */
  replaces: string
}

const STEPS: Step[] = [
  {
    icon: Droplets,
    title: 'Check live stock',
    body: (city) => `Pick the group, component and units, see what licensed centres in ${city} hold right now, then choose the hospital.`,
    time: 'Instant',
    replaces: 'phone rounds',
  },
  {
    icon: FileCheck,
    title: 'Upload the requisition',
    body: () => "The ward uploads the doctor's signed form. The centre's medical officer verifies it online before any unit is issued.",
    time: '≤ 3 min',
    replaces: 'counter queues',
  },
  {
    icon: IndianRupee,
    title: 'Pay processing only',
    body: () => `Capped processing per unit plus a flat ${formatINR(FEES.logistics)} cold-chain fee, itemised first. No replacement donor needed.`,
    time: '1 min',
    replaces: 'donor hunts',
  },
  {
    icon: Navigation,
    title: 'Track the cold box',
    body: () => 'Packed at a nearby outlet, ridden to the blood desk in a sealed, logged box and released against a 4-digit OTP.',
    time: `≈ ${BRAND.promiseMinutes} min`,
    replaces: 'carrying the bag',
  },
]

function Bar({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-9 w-full overflow-hidden rounded-xl bg-ink-50 ring-1 ring-ink-100 sm:h-11">
      {children}
    </div>
  )
}

function RouteLabel({ mood, title, note, total, hot }: { mood: 'worried' | 'happy'; title: string; note: string; total: string; hot?: boolean }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Person who="priya" mood={mood} backdrop={hot ? 'var(--color-blood-50)' : 'var(--color-ice-50)'} className="w-10 shrink-0 sm:w-11" />
        <div className="min-w-0">
          <p className="font-display text-base leading-tight font-semibold text-ink-950">{title}</p>
          <p className="text-xs text-ink-500">{note}</p>
        </div>
      </div>
      <p className={cn('shrink-0 font-display text-2xl leading-none font-bold tracking-tight tabular sm:text-3xl', hot ? 'text-blood-700' : 'text-emerald-600')}>
        {total}
      </p>
    </div>
  )
}

/**
 * Why the product exists and how it works, in one place: the counter route a
 * family runs today against the RaktFlow route on the same time scale, then the
 * four steps that replace those hours.
 */
export function HoursToMinutes() {
  const city = useCity()
  return (
    <section aria-labelledby="hours-title" className={SECTION_Y}>
      <div className="container-page">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <HomeHeading
            size="md"
            id="hours-title"
            eyebrow="From hours to minutes"
            title={
              <>
                A blood request shouldn&rsquo;t <span className="text-blood-600">take all day.</span>
              </>
            }
          />
          <Reveal delay={0.05} className="max-w-md lg:mb-1.5">
            <p className="leading-relaxed text-ink-600 sm:text-lg">
              At many blood-bank counters the family still does the legwork. Here is where the hours go, and the four steps that replace them.
            </p>
            <Link
              to="/guide"
              className="group mt-3 inline-flex items-center gap-1.5 font-semibold text-ink-900 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-blood-700 hover:decoration-blood-300"
            >
              Read the full guide
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <Reveal className="mt-8 overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-soft sm:mt-10">
          {/* Same time scale for both routes, so the gap speaks for itself */}
          <div className="p-5 sm:p-8">
            <RouteLabel mood="worried" title="Counter route, today" note="Typical; varies by city and hospital" total="5–13 h" hot />
            <Bar label={`Counter route: about ${TOTAL_HOURS} hours across six steps`}>
              {LEGS.map((l, i) => (
                <motion.span
                  key={l.label}
                  className="h-full shrink-0 border-r-2 border-white last:border-r-0"
                  style={{ background: l.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(l.hours / TOTAL_HOURS) * 100}%` }}
                  viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                  transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 + i * 0.1 }}
                />
              ))}
            </Bar>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-600 sm:flex sm:flex-wrap sm:gap-x-6">
              {LEGS.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: l.color }} aria-hidden />
                  {l.label}
                  <span className="text-ink-400 tabular">{l.time}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <RouteLabel mood="happy" title={`${BRAND.name} route`} note="Emergency target, requisition to blood desk" total="≈ 15 min" />
              <Bar label={`${BRAND.name} route: about 15 minutes`}>
                <motion.span
                  className="h-full shrink-0 bg-emerald-500"
                  style={{ minWidth: 6 }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(FAST_HOURS / TOTAL_HOURS) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.8 }}
                />
                <span className="flex items-center pl-3 text-xs font-semibold text-emerald-700 sm:text-sm">
                  <ArrowLeft className="mr-1 size-3.5" aria-hidden /> that&rsquo;s the whole trip
                </span>
              </Bar>
              <div aria-hidden className="mt-2.5 hidden justify-between text-[11px] font-medium text-ink-400 tabular sm:flex">
                {TICKS.map((t) => (
                  <span key={t}>{t} h</span>
                ))}
              </div>
            </div>
          </div>

          {/* How it works: each step names the chore it removes */}
          <ol aria-label={`How ${BRAND.name} works`} className="grid grid-cols-2 gap-px border-t border-ink-100 bg-ink-100 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body, time, replaces }, i) => (
              <li key={title} className="flex flex-col gap-3 bg-paper p-4 sm:gap-4 sm:p-6">
                <div className="flex shrink-0 items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-blood-600 shadow-soft ring-1 ring-ink-100">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-sm font-bold text-ink-300 tabular" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="text-[0.95rem] leading-snug font-bold sm:text-[1.05rem]">{title}</h3>
                  {/* Phones get the headline version; the detail is repeated further down the page. */}
                  <p className="mt-1 hidden text-sm leading-relaxed text-ink-600 sm:block">{body(city.name)}</p>
                  <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs text-ink-500 sm:pt-4">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-100 tabular">{time}</span>
                    <span>
                      instead of <s className="decoration-blood-400/70">{replaces}</s>
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
