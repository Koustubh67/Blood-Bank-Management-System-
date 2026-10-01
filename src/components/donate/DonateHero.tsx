import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, CalendarCheck, Clock, HeartHandshake, ShieldCheck } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { COMPONENTS } from '@/data/blood'
import { DonateSwitch } from './DonateSwitch'

const SPLIT = [
  { code: 'PRBC', label: 'Red cells', color: 'var(--color-blood-600)', uses: 'Surgery, trauma, anaemia' },
  { code: 'FFP', label: 'Plasma', color: '#d97706', uses: 'Burns, liver disease, bleeding' },
  { code: 'PLT', label: 'Platelets', color: 'var(--color-ice-600)', uses: 'Dengue, cancer care' },
] as const

const FACTS = [
  { icon: Clock, text: 'About 45 minutes, start to finish' },
  { icon: ShieldCheck, text: 'Sterile single-use kit, every time' },
  { icon: HeartHandshake, text: 'Voluntary and unpaid, as the law requires' },
]

export function DonateHero() {
  const reduce = useReducedMotion()
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] as const } }

  return (
    <section className="relative isolate overflow-hidden">
      <div className="grain absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute -top-40 right-[-10%] -z-10 size-144 rounded-full bg-blood-100/70 blur-3xl" aria-hidden />
      <DonateSwitch />

      <div className="container-page grid grid-cols-1 items-center gap-12 pt-6 pb-16 sm:pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pt-10 lg:pb-24">
        <div>
          <motion.p {...rise(0)} className="eyebrow">
            Become a blood donor
          </motion.p>
          <motion.h1 {...rise(0.05)} className="mt-4 text-5xl leading-[0.98] font-extrabold sm:text-6xl lg:text-7xl">
            One donation.
            <br />
            <span className="text-blood-600">Up to three patients.</span>
          </motion.h1>
          <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-lg text-ink-600 sm:text-xl">
            A single whole-blood donation can be separated into red cells, plasma and platelets, so it can go on to help up to three
            different people. Book a slot at a licensed centre near you in under two minutes.
          </motion.p>
          <motion.div {...rise(0.18)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#eligibility" className={buttonClass({ size: 'lg' })}>
              Check if you can donate <ArrowDown className="size-4" />
            </a>
            <a href="#book" className={buttonClass({ size: 'lg', variant: 'outline' })}>
              <CalendarCheck className="size-4" /> Book a slot
            </a>
          </motion.div>
          <motion.ul {...rise(0.24)} className="mt-10 flex flex-col gap-3 text-sm text-ink-700 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {FACTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 text-blood-600" /> {text}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Split visual */}
        <motion.figure
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="relative mx-auto w-full max-w-lg rounded-5xl bg-white p-6 shadow-lift sm:p-8"
          aria-label="One whole-blood donation is separated into red cells, plasma and platelets"
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-blood-500/30" aria-hidden />
              <div className="relative grid size-24 animate-heartbeat place-items-center rounded-full bg-blood-600 text-white shadow-glow sm:size-28">
                <svg viewBox="0 0 24 24" className="size-11 sm:size-12" fill="currentColor" aria-hidden>
                  <path d="M12 2.5c-3.6 4.9-6.2 8.3-6.2 11.7a6.2 6.2 0 0 0 12.4 0c0-3.4-2.6-6.8-6.2-11.7z" />
                </svg>
              </div>
            </div>
            <p className="mt-4 font-display text-xl font-bold">1 whole-blood donation</p>
            <p className="text-sm text-ink-500">350–450 ml · separated at the centre</p>
          </div>

          <svg viewBox="0 0 300 70" className="my-2 h-16 w-full" fill="none" aria-hidden>
            {[50, 150, 250].map((x, i) => (
              <motion.path
                key={x}
                d={`M150 0 C150 35, ${x} 30, ${x} 70`}
                stroke={SPLIT[i].color}
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease: 'easeInOut' }}
              />
            ))}
          </svg>

          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {SPLIT.map((s, i) => (
              <motion.li
                key={s.code}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.12 }}
                className="flex flex-col items-center rounded-3xl border border-ink-100 bg-paper px-2 py-4 text-center"
              >
                <span className="size-3 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="mt-2 text-sm font-semibold text-ink-950">{s.label}</span>
                <span className="mt-1 text-[11px] leading-snug text-ink-500">{s.uses}</span>
                <span className="mt-2 hidden text-[10px] font-medium text-ink-400 sm:block">{COMPONENTS[s.code].shelfLife}</span>
              </motion.li>
            ))}
          </ul>
          <figcaption className="mt-5 text-center text-xs text-ink-500">
            How many patients a donation helps depends on which components the centre separates and what patients need.
          </figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
