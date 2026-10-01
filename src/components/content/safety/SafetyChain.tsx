import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { ClipboardCheck, FlaskConical, KeyRound, Microscope, PackageCheck, Refrigerator, Route, Stethoscope, Tag } from 'lucide-react'
import { COMPONENTS } from '@/data/blood'
import { cn } from '@/lib/utils'

type Phase = 'centre' | 'transit' | 'hospital'

const PHASES: Record<Phase, { label: string; who: string; chip: string; tile: string; dot: string }> = {
  centre: {
    label: 'At the blood centre',
    who: 'Licensed blood centre',
    chip: 'bg-blood-50 text-blood-700 ring-blood-100',
    tile: 'bg-blood-600 text-white shadow-glow',
    dot: 'bg-blood-600',
  },
  transit: {
    label: 'Cold chain & transit',
    who: 'RaktFlow, with the blood centre',
    chip: 'bg-ice-50 text-ice-700 ring-ice-100',
    tile: 'bg-ice-600 text-white shadow-[0_10px_30px_-10px_rgb(8_145_178/0.6)]',
    dot: 'bg-ice-600',
  },
  hospital: {
    label: 'At the hospital',
    who: 'Partner hospital',
    chip: 'bg-ink-100 text-ink-800 ring-ink-200',
    tile: 'bg-ink-950 text-white shadow-lift',
    dot: 'bg-ink-950',
  },
}

interface ChainStep {
  phase: Phase
  icon: ReactNode
  title: string
  body: string
  facts: string[]
}

const STEPS: ChainStep[] = [
  {
    phase: 'centre',
    icon: <Stethoscope className="size-5" />,
    title: 'Donor screening',
    body: "A medical officer checks every volunteer against national donor-selection criteria: age, weight, haemoglobin, blood pressure, pulse and health history. Anyone who shouldn't donate today is deferred, for their safety and the patient's.",
    facts: ['Voluntary, unpaid donors', '18–65 years, 45 kg+', 'Haemoglobin & vitals'],
  },
  {
    phase: 'centre',
    icon: <Microscope className="size-5" />,
    title: 'Mandatory infection testing',
    body: 'Before release, every unit is grouped and screened for five infections required by law in India. Many centres add nucleic acid testing (NAT) to narrow the window period. Reactive units are discarded, never issued.',
    facts: ['HIV-1 & 2', 'Hepatitis B', 'Hepatitis C', 'Syphilis', 'Malaria', 'NAT where available'],
  },
  {
    phase: 'centre',
    icon: <Tag className="size-5" />,
    title: 'Component separation & labelling',
    body: 'Whole blood is separated into red cells, plasma, platelets and cryoprecipitate, so one donation can help several patients. Each bag is labelled with a unique unit number, group, component and expiry.',
    facts: ['Unique unit number', 'ABO & Rh group', 'Expiry date'],
  },
  {
    phase: 'centre',
    icon: <Refrigerator className="size-5" />,
    title: 'Validated storage',
    body: 'Each component waits in equipment matched to its needs, with temperatures logged and alarmed around the clock.',
    facts: [
      `${COMPONENTS.PRBC.short} ${COMPONENTS.PRBC.tempRange}`,
      `${COMPONENTS.PLT.short} ${COMPONENTS.PLT.tempRange}`,
      `${COMPONENTS.FFP.short} ${COMPONENTS.FFP.tempRange}`,
    ],
  },
  {
    phase: 'centre',
    icon: <ClipboardCheck className="size-5" />,
    title: 'Order verification by a medical officer',
    body: "Nothing is issued until the blood centre's medical officer has checked the signed requisition from a registered medical practitioner, the patient details and the destination hospital. No requisition, no blood.",
    facts: ['Signed requisition', 'Registered doctor', 'Partner hospital only'],
  },
  {
    phase: 'transit',
    icon: <PackageCheck className="size-5" />,
    title: 'Sealed cold box with a logger',
    body: 'Group-matched units go into a validated, pre-conditioned cold box with a separate compartment for each temperature range. A tamper-evident seal closes it and a temperature logger starts recording.',
    facts: ['Tamper-evident seal', 'Per-component compartments', 'Logger from packing'],
  },
  {
    phase: 'transit',
    icon: <Route className="size-5" />,
    title: 'Live-tracked transit',
    body: 'A trained rider carries the sealed box on the fastest route. Location and box temperature stream to your tracking page, and our control room is alerted the moment either drifts.',
    facts: ['Live GPS', 'Temperature alerts', 'Riders never open the box'],
  },
  {
    phase: 'hospital',
    icon: <KeyRound className="size-5" />,
    title: 'OTP handover at the transfusion desk',
    body: "The box is handed over only at the hospital's blood transfusion desk. Staff check the seal and the logger, then give the rider the 4-digit handover OTP. It never goes to a ward corridor, a relative or a home.",
    facts: ['4-digit OTP', 'Seal & logger check', 'Desk-to-desk'],
  },
  {
    phase: 'hospital',
    icon: <FlaskConical className="size-5" />,
    title: 'Cross-match & bedside check',
    body: "The hospital's blood bank cross-matches each unit against the patient's own sample. At the bedside, staff confirm the patient's identity against the unit label, and the transfusion runs under medical supervision.",
    facts: ['Cross-match', 'Bedside identity check', 'Monitored transfusion'],
  },
]

export function SafetyChain() {
  const listRef = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="eyebrow mb-3">From vein to vein</p>
        <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Nine checkpoints. Every unit, every time.</h2>
        <p className="mt-4 max-w-[60ch] text-lg text-ink-600">
          Speed never skips a step. Most of the safety work happens before we are ever involved, and the last word always belongs to the
          hospital treating the patient.
        </p>
        <ul className="mt-8 space-y-3">
          {(Object.keys(PHASES) as Phase[]).map((p) => {
            const count = STEPS.filter((s) => s.phase === p).length
            return (
              <li key={p} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-soft">
                <span className={cn('size-3 rounded-full', PHASES[p].dot)} aria-hidden />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink-950">{PHASES[p].label}</span>
                  <span className="block text-xs text-ink-500">Responsible: {PHASES[p].who}</span>
                </span>
                <span className="text-sm font-semibold text-ink-400 tabular">
                  {count} step{count > 1 ? 's' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <ol ref={listRef} className="relative">
        {/* Track + scroll-linked fill */}
        <span className="absolute top-6 bottom-6 left-5.75 w-0.5 rounded-full bg-ink-100" aria-hidden />
        <motion.span
          className="absolute top-6 bottom-6 left-5.75 w-0.5 origin-top rounded-full bg-linear-to-b from-blood-600 via-ice-500 to-ink-950 print:hidden"
          style={{ scaleY: progress }}
          aria-hidden
        />
        {STEPS.map((s, i) => {
          const phase = PHASES[s.phase]
          return (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
              className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-4 pb-6 last:pb-0 sm:gap-6 print:transform-none! print:opacity-100!"
            >
              {i === STEPS.length - 1 && (
                // Hide the connector below the final checkpoint.
                <span className="absolute top-12 bottom-0 left-5.25 w-1 bg-paper" aria-hidden />
              )}
              <span className={cn('relative z-10 grid size-12 place-items-center rounded-2xl', phase.tile)} aria-hidden>
                {s.icon}
              </span>
              <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold text-ink-300 tabular">{String(i + 1).padStart(2, '0')}</span>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1', phase.chip)}>{phase.label}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold sm:text-2xl">{s.title}</h3>
                <p className="mt-2 max-w-[62ch] text-ink-600">{s.body}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Key checks">
                  {s.facts.map((f) => (
                    <li key={f} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-ink-100">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
