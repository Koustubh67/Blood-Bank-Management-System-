import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Building2, Check, Users, type LucideIcon } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { hospitalsInCity } from '@/data/network'
import { useCity } from '@/services/location'
import { ButtonLink } from '@/components/ui/Button'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Person } from '@/components/characters/Person'
import { cn } from '@/lib/utils'
import { EASE_OUT, HomeHeading, Reveal, SECTION_Y } from './Reveal'

type Audience = 'families' | 'hospitals'

const TABS: { id: Audience; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'families', label: "Patients' families", short: 'Families', icon: Users },
  { id: 'hospitals', label: 'Hospitals & nursing homes', short: 'Hospitals', icon: Building2 },
]

const FAMILY_POINTS = [
  'Live stock across licensed centres before you order',
  'One itemised bill: capped processing plus a flat logistics fee',
  "Delivered to the hospital's blood desk, never to homes",
  'Live tracking with an OTP-verified handover',
]

const HOSPITAL_POINTS = [
  'One-tap emergency orders and bulk requests for planned surgeries',
  'Monthly credit terms against purchase orders for verified hospitals',
  'A live dashboard of every order coming to your facility',
  'Requisition, payment and handover records in one place',
]

const SAMPLE_ROWS: { id: string; group: 'O-' | 'B+' | 'A+'; what: string; status: OrderStatus }[] = [
  { id: 'RF-7K2M9Q', group: 'O-', what: '2 × Red cells · ICU', status: 'arriving' },
  { id: 'RF-4TX8HD', group: 'B+', what: '4 × Platelets · Ward 3', status: 'packed' },
  { id: 'RF-9PW3LE', group: 'A+', what: '3 × Plasma · OT 2', status: 'delivered' },
]

/** Pill-shaped tab switch: arrow keys move between options, only the active one is in the tab order. */
function SegmentedSwitch({ value, onChange, idBase }: { value: Audience; onChange: (v: Audience) => void; idBase: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TABS.length
    const next =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    onChange(TABS[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label="Show details for" className="inline-flex rounded-full bg-ink-100 p-1 ring-1 ring-ink-200/60">
      {TABS.map(({ id, label, short, icon: Icon }, i) => {
        const active = id === value
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`${idBase}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${idBase}-panel-${id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors sm:px-5',
              active ? 'text-ink-950' : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${idBase}-pill`}
                className="absolute inset-0 rounded-full bg-white shadow-soft ring-1 ring-ink-100"
                transition={{ type: 'spring', damping: 30, stiffness: 380 }}
              />
            )}
            <Icon className={cn('relative size-4', active && 'text-blood-600')} aria-hidden />
            <span className="relative sm:hidden">{short}</span>
            <span className="relative hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Point({ children }: { children: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-blood-50 text-blood-600">
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
      <span>{children}</span>
    </li>
  )
}

/** Illustrative order card a family sees while the box is on its way. */
function FamilyVisual() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <BloodGroupBadge group="O-" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-950">2 × Red cells</p>
            <p className="truncate text-[11px] text-ink-500">To the hospital blood desk</p>
          </div>
        </div>
        <span className="hidden shrink-0 min-[400px]:block">
          <StatusBadge status="dispatched" />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i < 4 ? 'h-1.5 rounded-full bg-blood-600' : 'h-1.5 rounded-full bg-ink-100'} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-paper px-2 py-2">
          <dt className="text-[10px] font-semibold tracking-wide text-ink-500 uppercase">ETA</dt>
          <dd className="font-display text-lg font-bold tracking-tight text-ink-950 tabular">06:12</dd>
        </div>
        <div className="rounded-xl bg-ice-50 px-2 py-2">
          <dt className="text-[10px] font-semibold tracking-wide text-ice-700 uppercase">Cold box</dt>
          <dd className="font-display text-lg font-bold tracking-tight whitespace-nowrap text-ice-700 tabular">3.9 °C</dd>
        </div>
        <div className="rounded-xl bg-paper px-2 py-2">
          <dt className="text-[10px] font-semibold tracking-wide text-ink-500 uppercase">Handover</dt>
          <dd className="font-display text-lg font-bold tracking-tight text-ink-950">OTP</dd>
        </div>
      </dl>
    </div>
  )
}

/** Illustrative blood-desk list for a partner hospital in the visitor's city. */
function HospitalVisual({ desk }: { desk: string }) {
  return (
    <div className="rounded-2xl bg-white p-2 shadow-soft ring-1 ring-ink-100">
      <p className="truncate px-2.5 pt-1.5 pb-2 text-xs font-semibold text-ink-500">Today at {desk}</p>
      <ul className="divide-y divide-ink-100 rounded-xl bg-paper ring-1 ring-ink-100/70">
        {SAMPLE_ROWS.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
            <BloodGroupBadge group={r.group} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{r.what}</p>
              <p className="text-[11px] text-ink-500 tabular">{r.id}</p>
            </div>
            <span className="hidden shrink-0 min-[400px]:block">
              <StatusBadge status={r.status} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface PanelContent {
  title: ReactNode
  body: string
  points: string[]
  primary: { to: string; label: string }
  secondary: { to: string; label: string }
  visual: ReactNode
  person: ReactNode
}

/** Families and hospitals in one card, switched with a segmented control instead of two tall cards. */
export function Audiences() {
  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const city = useCity()
  const [audience, setAudience] = useState<Audience>('families')
  const partners = hospitalsInCity(city.id)

  const panels: Record<Audience, PanelContent> = {
    families: {
      title: (
        <>
          The doctor wrote the requisition. <span className="text-blood-600">We do the running.</span>
        </>
      ),
      body: `No more calling blood bank after blood bank in the middle of the night. See what's in stock in ${city.name}, order once, and follow the cold box to the hospital.`,
      points: FAMILY_POINTS,
      primary: { to: '/order', label: 'Order for a patient' },
      secondary: { to: '/availability', label: 'Check live stock' },
      visual: <FamilyVisual />,
      person: <Person who="priya" mood="calm" className="w-32" />,
    },
    hospitals: {
      title: (
        <>
          One tap for emergencies. <span className="text-ink-400">One dashboard for the rest.</span>
        </>
      ),
      body: `Give your transfusion desk a single place to order, track and reconcile every unit.${
        partners.length ? ` ${partners.length} partner hospitals and nursing homes in ${city.name} already do.` : ''
      }`,
      points: HOSPITAL_POINTS,
      primary: { to: '/hospital', label: 'Explore the hospital desk' },
      secondary: { to: '/signup', label: 'Register your hospital' },
      visual: <HospitalVisual desk={partners[0]?.name ?? 'your blood desk'} />,
      person: <Person who="doctor" mood="happy" className="w-32" />,
    },
  }

  return (
    <section aria-labelledby="audiences-title" className={SECTION_Y}>
      <div className="container-page">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <HomeHeading
            size="md"
            id="audiences-title"
            eyebrow="Built for both ends of the call"
            title={
              <>
                Holding a prescription, <span className="text-ink-400">or running a blood desk?</span>
              </>
            }
          />
          <Reveal delay={0.05} className="shrink-0 lg:mb-1">
            <SegmentedSwitch value={audience} onChange={setAudience} idBase={idBase} />
          </Reveal>
        </div>

        <Reveal delay={0.08} className="mt-8 rounded-4xl border border-ink-100 bg-white p-2 shadow-soft sm:mt-10">
          {/* Both panels share one grid cell, so the card keeps its height when switching. */}
          <div className="grid">
            {TABS.map(({ id }) => {
              const p = panels[id]
              const active = id === audience
              return (
                <div
                  key={id}
                  id={`${idBase}-panel-${id}`}
                  role="tabpanel"
                  aria-labelledby={`${idBase}-tab-${id}`}
                  inert={!active}
                  className={cn('col-start-1 row-start-1 min-w-0', !active && 'invisible')}
                >
                  <motion.div
                    key={active ? 'on' : 'off'}
                    initial={active ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    className="grid h-full grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
                  >
                    <div className="flex flex-col p-4 sm:p-7 lg:p-9">
                      <h3 className="text-2xl leading-[1.08] font-bold tracking-[-0.03em] sm:text-[2rem]">{p.title}</h3>
                      <p className="mt-3 max-w-lg text-ink-600">{p.body}</p>
                      <ul className="mt-6 grid gap-3 text-[15px] text-ink-800 sm:grid-cols-2 sm:gap-x-6">
                        {p.points.map((pt) => (
                          <Point key={pt}>{pt}</Point>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
                        <ButtonLink to={p.primary.to} size="lg" className="w-full sm:w-auto">
                          {p.primary.label} <ArrowRight className="size-5" aria-hidden />
                        </ButtonLink>
                        <Link to={p.secondary.to} className="inline-flex h-11 items-center justify-center rounded-full px-5 font-semibold text-ink-800 hover:bg-ink-100">
                          {p.secondary.label}
                        </Link>
                      </div>
                    </div>
                    {/* Illustrative product view; decorative (the points carry the content), so phones skip it */}
                    <div aria-hidden className="relative hidden flex-col justify-center overflow-hidden rounded-[1.6rem] bg-paper p-7 ring-1 ring-ink-100 sm:flex">
                      <div className="grain absolute inset-0 mask-[radial-gradient(80%_70%_at_80%_0%,black,transparent)]" />
                      <p className="absolute top-5 left-7 text-[10px] font-semibold tracking-[0.14em] text-ink-400 uppercase">Illustrative</p>
                      {/* The character stands just behind the card, shoulders tucked under its top edge */}
                      <div className="relative pt-34">
                        <div className="absolute top-0 right-6">{p.person}</div>
                        <div className="relative -mt-3">{p.visual}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
