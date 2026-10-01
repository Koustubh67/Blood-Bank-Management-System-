import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Building2,
  Check,
  FileBadge,
  FileCheck2,
  Headset,
  IdCard,
  Landmark,
  Plug,
  Receipt,
  Rocket,
  Scale,
  ShieldCheck,
  Siren,
  Snowflake,
  Stethoscope,
  Thermometer,
  UserCheck,
  Zap,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, LiveDot, SectionHeading } from '@/components/ui/primitives'
import { Accordion } from '@/components/ui/disclosure'
import { useNow } from '@/hooks/useNow'
import { BRAND, FEES } from '@/config/brand'
import { PRIORITIES } from '@/data/blood'
import { useCity } from '@/services/location'
import { formatClock, formatINR } from '@/lib/utils'

const TARGET = PRIORITIES.emergency.targetMinutes

const VALUE_PROPS = [
  {
    icon: Siren,
    title: `${TARGET}-minute emergency dispatch target`,
    body: 'Emergency requests are verified first and dispatched from the nearest centre that has the units. Ten minutes is our target, and your dashboard shows the real times.',
  },
  {
    icon: Headset,
    title: 'Dedicated 24×7 hospital desk',
    body: 'A direct line for your blood bank, ICU and emergency teams, day and night, to chase, change or cancel an order.',
  },
  {
    icon: Receipt,
    title: 'Monthly credit terms',
    body: 'Verified hospitals can order against a purchase order and settle once a month, with GST invoices for the logistics fee.',
  },
  {
    icon: Thermometer,
    title: 'Live cold-chain logs for audits',
    body: 'Every box carries a temperature logger. Readings, handover OTP and timestamps are kept per order for your quality and accreditation audits.',
  },
  {
    icon: Zap,
    title: 'One-tap emergency orders',
    body: 'Presets for O− red cells, AB plasma and platelets, prefilled at emergency priority, one tap from your dashboard.',
  },
  {
    icon: Plug,
    title: 'Dashboard today, HIS and API next',
    body: 'A live board of every delivery to your facility today. Direct integration with your hospital information system is on the roadmap.',
    soon: true,
  },
]

const STEPS = [
  { icon: Building2, title: 'Register online', body: 'Create a hospital account with your facility and registration number. About five minutes.' },
  { icon: FileCheck2, title: 'Share documents', body: 'Upload the documents listed alongside. Scans or clear photos are fine.' },
  { icon: UserCheck, title: 'Verification call', body: 'Our team checks the documents and speaks to your authorised signatory. Orders stay locked until this is done.' },
  { icon: Rocket, title: 'Go live', body: 'Your team gets the dashboard and one-tap ordering. Credit terms are reviewed once you are verified.' },
]

const DOCUMENTS = [
  { icon: FileBadge, title: 'Clinical Establishment registration', body: "Certificate under the Clinical Establishments Act or your state's equivalent." },
  { icon: IdCard, title: 'Authorised signatory ID', body: 'Government photo ID and an authorisation letter on hospital letterhead.' },
  { icon: Landmark, title: 'Blood centre or storage licence', body: 'Only if your facility runs a blood centre or blood storage centre.' },
  { icon: Receipt, title: 'GSTIN', body: 'For invoices and monthly credit terms.' },
]

const COMPLIANCE = [
  { icon: Scale, text: 'Blood is never sold. Invoices carry only the processing charge capped under NBTC guidance, plus a logistics fee.' },
  { icon: Stethoscope, text: "Deliveries go only to registered hospitals and nursing homes, against a treating doctor's requisition." },
  { icon: BadgeCheck, text: 'Units are issued only by blood centres licensed under the Drugs and Cosmetics Rules.' },
  { icon: ShieldCheck, text: 'Transfusion happens only at your facility. Cross-matching and bedside checks stay with your team.' },
  { icon: Snowflake, text: 'Cold boxes are validated for each component and logged from packing to handover.' },
  { icon: UserCheck, text: 'Patient data is processed under the DPDP Act, 2023 and shared only with the issuing centre.' },
]

function DashboardPreview() {
  const now = useNow(1000)
  const reduce = useReducedMotion()
  const loop = 9 * 60 + 12
  const eta = (loop - (Math.floor(now / 1000) % loop)) * 1000
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="relative mx-auto w-full max-w-md"
      aria-hidden
    >
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-linear-to-br from-blood-200/60 via-transparent to-ice-100/70 blur-2xl" />
      <div className="rounded-5xl border border-ink-100 bg-white p-4 shadow-lift sm:p-5">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-ink-950">Your hospital</p>
          <Badge tone="neutral" className="text-[10px]">
            Illustrative preview
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { g: 'O-', t: 'Red cells ×2' },
            { g: 'AB+', t: 'Plasma ×2' },
          ].map((p) => (
            <div key={p.g} className="rounded-2xl border border-blood-100 bg-blood-50/60 p-3">
              <span className="inline-grid h-7 min-w-9 place-items-center rounded-lg bg-blood-600 px-1.5 font-display text-sm font-bold text-white">{p.g}</span>
              <p className="mt-2 text-sm font-semibold text-ink-950">{p.t}</p>
              <p className="text-[11px] text-ink-500">One tap · emergency</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-3xl bg-ink-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-blood-300">
              <LiveDot className="size-2" /> Out for delivery
            </span>
            <span className="font-mono text-[11px] text-ink-400">RF-DEMO01</span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold">2 × O- red cells</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                <Bike className="size-3.5" /> Rider on the way
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">ETA</p>
              <p className="text-3xl font-semibold tabular">{formatClock(eta)}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blood-500 transition-[width] duration-1000 ease-linear" style={{ width: `${(1 - eta / (loop * 1000)) * 100}%` }} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl bg-ice-50 px-4 py-3 text-ice-700">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Snowflake className="size-4" /> Red cell compartment
          </span>
          <span className="text-sm font-semibold tabular">4.2 °C</span>
        </div>
      </div>
    </motion.div>
  )
}

export function HospitalLanding() {
  const city = useCity()
  const reduce = useReducedMotion()
  const fadeUp = (i = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { delay: i * 0.06, duration: 0.45 },
        }

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="grain absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div className="container-page grid grid-cols-1 items-center gap-14 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-20 lg:pb-24">
          <div>
            <motion.p initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
              For hospitals &amp; nursing homes
            </motion.p>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-5xl leading-[0.98] font-extrabold sm:text-6xl lg:text-7xl"
            >
              Emergency blood at your desk, <span className="text-blood-600">in minutes.</span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-ink-600 sm:text-xl"
            >
              {BRAND.name} connects registered hospitals and nursing homes in {city.name} to licensed blood centres, with a {TARGET}-minute
              emergency dispatch target, a 24×7 desk and cold-chain records you can hand to an auditor.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <ButtonLink to="/signup?role=hospital" size="lg">
                Register your hospital <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink to="/login?demo=hospital" size="lg" variant="outline">
                Try the demo hospital account
              </ButtonLink>
            </motion.div>
            <p className="mt-5 text-sm text-ink-500">
              Free to join. Per order you pay only the capped processing charge and a {formatINR(FEES.logistics)} + GST logistics fee.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why hospitals partner with us"
            title="Built for the blood bank desk at 3 a.m."
            description="Everything your team needs to get the right units in, fast, and to prove how they travelled."
          />
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUE_PROPS.map((v, i) => (
              <motion.li key={v.title} {...fadeUp(i % 3)} className="group relative flex flex-col rounded-3xl border border-ink-100 bg-paper p-6 transition hover:bg-white hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink-950 text-white transition-colors group-hover:bg-blood-600">
                    <v.icon className="size-5" />
                  </span>
                  {v.soon && <Badge tone="blue">Coming soon</Badge>}
                </div>
                <h3 className="mt-5 text-xl font-bold">{v.title}</h3>
                <p className="mt-2 text-ink-600">{v.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Onboarding */}
      <section className="py-16 sm:py-24">
        <div className="container-page grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Onboarding" title="Live in four steps" description="Most of it happens online. We only call to confirm who is authorised to order." />
            <ol className="relative mt-10 flex flex-col gap-6 border-l border-dashed border-ink-200 pl-8">
              {STEPS.map((s, i) => (
                <motion.li key={s.title} {...fadeUp(i)} className="relative">
                  <span className="absolute top-0 left-[-3.14rem] grid size-9 place-items-center rounded-full bg-white text-sm font-bold text-ink-950 shadow-soft ring-1 ring-ink-100">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <s.icon className="size-4 text-blood-600" />
                    <h3 className="font-sans text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-ink-600">{s.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>

          <motion.div {...fadeUp(1)} className="self-start rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
            <p className="eyebrow">Documents required</p>
            <h3 className="mt-3 text-2xl font-bold">Keep these ready</h3>
            <ul className="mt-6 flex flex-col gap-4">
              {DOCUMENTS.map((d) => (
                <li key={d.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blood-50 text-blood-700">
                    <d.icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-950">{d.title}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{d.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-ink-50 p-4 text-xs text-ink-600">
              PDF or JPG scans are fine. In this prototype no documents are collected and hospital accounts are verified instantly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Compliance */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="relative isolate overflow-hidden rounded-5xl bg-ink-950 p-6 text-white sm:p-12">
          <div className="absolute -top-32 -left-24 -z-10 size-96 rounded-full bg-blood-700/30 blur-3xl" aria-hidden />
          <div className="max-w-2xl">
            <p className="eyebrow text-blood-300">Compliance by design</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">The rules are the product</h2>
            <p className="mt-3 text-ink-300">We built the flow around Indian blood-safety and data-protection law, so your team never has to work around it.</p>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMPLIANCE.map((c) => (
              <li key={c.text} className="flex gap-3 rounded-3xl border border-white/10 bg-white/3 p-5">
                <c.icon className="mt-0.5 size-5 shrink-0 text-blood-400" />
                <p className="text-sm text-ink-200">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <SectionHeading eyebrow="Questions" title="What hospital teams ask us" />
          <Accordion
            items={[
              {
                q: 'Does this replace our blood bank or storage centre?',
                a: `No. ${BRAND.name} is a logistics and coordination layer. Units are issued by licensed blood centres; your blood bank or transfusion team still cross-matches and administers.`,
              },
              {
                q: 'What exactly do we pay?',
                a: `The issuing centre's processing charge per unit, capped under NBTC guidance, plus a flat logistics fee of ${formatINR(FEES.logistics)} + GST per order. Blood itself is never charged for.`,
              },
              {
                q: 'Who at our hospital can order?',
                a: "Your blood bank, emergency, ICU and OT coordinators, using the hospital account. Every order needs a signed requisition from the treating doctor.",
              },
              {
                q: 'Can patient families order to our hospital?',
                a: 'Yes, if you are a partner facility. Those orders appear on your dashboard so your desk knows what is coming. They are paid by the family.',
              },
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col items-start gap-6 rounded-5xl border border-blood-100 bg-linear-to-br from-blood-50 via-white to-white p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Be ready before the next emergency.</h2>
            <p className="mt-3 text-lg text-ink-600">Set up takes minutes. See the full dashboard first with our demo hospital.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink to="/signup?role=hospital" size="lg">
              Register your hospital
            </ButtonLink>
            <ButtonLink to="/login?demo=hospital" size="lg" variant="outline" icon={<Check className="size-4" />}>
              Try the demo
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
