import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BadgeCheck, Check, ShieldCheck, Snowflake } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { BRAND } from '@/config/brand'

const TRUST = [
  { icon: BadgeCheck, text: 'Units only from licensed blood centres' },
  { icon: Snowflake, text: 'Sealed, temperature-logged cold boxes' },
  { icon: ShieldCheck, text: 'Blood is never sold. Only capped processing charges.' },
]

const FLOW = ['Requisition verified', 'Packed at 4.1 °C', 'Out for delivery']

/** Split layout used by sign-in and sign-up: brand panel + form. */
export function AuthShell({
  eyebrow,
  title,
  description,
  panelTitle,
  children,
}: {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  panelTitle: ReactNode
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <section className="container-page py-6 sm:py-10 lg:py-14">
      <div className="grid grid-cols-1 overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-lift lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:rounded-5xl">
        {/* Brand panel */}
        <aside className="relative isolate hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col xl:p-12">
          <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[18px_18px]" />
          <div className="absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-blood-600/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 -z-10 size-96 rounded-full bg-blood-900/50 blur-3xl" />

          <Logo light />

          <div className="mt-16 flex-1">
            <p className="eyebrow text-blood-300">{BRAND.tagline}</p>
            <p className="mt-4 max-w-md font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance text-white xl:text-5xl">{panelTitle}</p>

            <svg viewBox="0 0 420 80" className="mt-10 w-full max-w-md" fill="none" aria-hidden>
              <path
                d="M0 40h120l14-26 20 54 16-40 10 12h240"
                stroke="rgb(255 255 255 / 0.12)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 40h120l14-26 20 54 16-40 10 12h240"
                stroke="var(--color-blood-500)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="600"
                className="animate-ecg"
              />
            </svg>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-10 max-w-sm animate-float rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              aria-hidden
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase">How every order moves</p>
              <ol className="mt-4 space-y-3">
                {FLOW.map((step, i) => (
                  <li key={step} className="flex items-center gap-3 text-sm">
                    <span className={i === FLOW.length - 1 ? 'grid size-6 place-items-center rounded-full bg-blood-600' : 'grid size-6 place-items-center rounded-full bg-white/15'}>
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className={i === FLOW.length - 1 ? 'font-semibold text-white' : 'text-ink-300'}>{step}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          <ul className="mt-12 space-y-3 border-t border-white/10 pt-8">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-ink-300">
                <Icon className="size-4 shrink-0 text-blood-400" />
                {text}
              </li>
            ))}
          </ul>
        </aside>

        {/* Form panel */}
        <div className="px-5 py-8 sm:px-10 sm:py-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 text-ink-600">{description}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Returns a same-site path from `?next=`, or null when missing/unsafe. */
export function safeNext(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null
  if (next.startsWith('/login') || next.startsWith('/signup')) return null
  return next
}
