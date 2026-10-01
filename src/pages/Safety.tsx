import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  Bone,
  Droplet,
  EyeOff,
  FileText,
  Hand,
  House,
  IndianRupee,
  Mail,
  Phone,
  ShieldAlert,
  Siren,
  Snowflake,
  Thermometer,
  ThermometerSnowflake,
  Wind,
} from 'lucide-react'
import { BRAND } from '@/config/brand'
import { buttonClass } from '@/components/ui/Button'
import { SectionHeading } from '@/components/ui/primitives'
import { Reveal } from '@/components/content/common'
import { ColdBoxVisual } from '@/components/content/safety/ColdBoxVisual'
import { SafetyChain } from '@/components/content/safety/SafetyChain'
import { ColdChainTable, TemperatureRuler } from '@/components/content/safety/ColdChain'
import { CompatibilityChecker } from '@/components/content/safety/CompatibilityChecker'

const HERO_STATS = [
  { value: '5', label: 'mandatory infection screens on every unit' },
  { value: '2–6 °C', label: 'for red cells, door to door' },
  { value: 'OTP', label: 'handover at the transfusion desk' },
  { value: '0', label: 'home deliveries, ever' },
]

const NEVER: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <House className="size-5" />,
    title: 'Deliver blood to a home',
    body: 'Transfusion needs a hospital: cross-matching, monitoring and a team ready for reactions. We deliver only to the transfusion desk of registered partner hospitals.',
  },
  {
    icon: <FileText className="size-5" />,
    title: 'Dispatch without a signed requisition',
    body: "Every order needs a requisition signed by a registered medical practitioner, checked by the blood centre's medical officer before anything is issued.",
  },
  {
    icon: <IndianRupee className="size-5" />,
    title: 'Sell blood',
    body: 'Blood is a gift, not a product. You pay only the processing charges capped under NBTC guidelines and a flat, itemised logistics fee.',
  },
  {
    icon: <ThermometerSnowflake className="size-5" />,
    title: 'Break the cold chain',
    body: 'If the logger shows a unit left its safe range, it is not handed over for transfusion. It goes back to the blood centre, whose medical officer decides what happens next.',
  },
  {
    icon: <EyeOff className="size-5" />,
    title: 'Share health data without consent',
    body: 'Patient details go only to the blood centre and hospital handling the order. Riders see an order ID and a desk, not a diagnosis. No ads, no data sales.',
  },
]

const SIGNS: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <Thermometer className="size-5" />, title: 'Fever', body: 'A rise in temperature, or feeling suddenly hot and flushed.' },
  { icon: <Snowflake className="size-5" />, title: 'Chills or shivering', body: 'Shaking or feeling cold, even under a blanket.' },
  { icon: <Wind className="size-5" />, title: 'Breathlessness', body: 'Difficulty breathing, wheezing, chest tightness or a cough.' },
  { icon: <Hand className="size-5" />, title: 'Rash or itching', body: 'Hives, redness, itching or swelling of the lips or face.' },
  { icon: <Bone className="size-5" />, title: 'Back or loin pain', body: 'New pain in the lower back, sides or at the drip site.' },
  { icon: <Droplet className="size-5" />, title: 'Dark urine', body: 'Red, brown or cola-coloured urine, or passing much less.' },
]

const REPORT_ITEMS = [
  'A broken, missing or tampered seal on the cold box',
  'A temperature alarm or out-of-range logger reading',
  'A label that does not match the requisition',
  'A delayed, misrouted or mishandled delivery',
  'Any other safety concern about an order',
]

export default function Safety() {
  return (
    <MotionConfig reducedMotion="user">
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden bg-ink-950 text-ink-300">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[18px_18px]"
          aria-hidden
        />
        <div className="absolute -top-40 -right-32 -z-10 size-144 rounded-full bg-ice-500/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-48 -left-40 -z-10 size-128 rounded-full bg-blood-600/20 blur-3xl" aria-hidden />

        <div className="container-page grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-28">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow text-blood-400">
              Safety &amp; cold chain
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-4 text-5xl leading-[1.02] font-bold text-white sm:text-6xl lg:text-7xl"
            >
              Fast is nothing <br className="hidden sm:block" />
              without <span className="text-ice-400">safe.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="mt-6 max-w-[56ch] text-lg text-ink-300 sm:text-xl"
            >
              {BRAND.name} moves only units that a licensed blood centre has screened, tested and released, in sealed and temperature-logged
              cold boxes, to a registered hospital's transfusion desk, against a doctor's signed requisition.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a href="#chain" className={buttonClass({ size: 'lg' })}>
                See the safety chain <ArrowRight className="size-4" aria-hidden />
              </a>
              <a href="#compatibility" className={buttonClass({ variant: 'white', size: 'lg' })}>
                Compatibility checker
              </a>
            </motion.div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-display text-2xl font-bold text-white tabular sm:text-3xl">{s.value}</span>
                    <span className="mt-1 block text-sm text-ink-400">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.2, 0.65, 0.3, 1] }}
          >
            <ColdBoxVisual />
          </motion.div>
        </div>
      </section>

      {/* ---------- Safety chain ---------- */}
      <section id="chain" className="container-page scroll-mt-24 py-20 sm:py-28">
        <SafetyChain />
      </section>

      {/* ---------- Cold chain ---------- */}
      <section id="cold-chain" className="scroll-mt-24 border-y border-ink-100 bg-white py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Temperature is safety"
              title="The cold chain, component by component"
              description="Each component has its own safe range. Our cold boxes carry separate compartments so red cells, platelets and frozen plasma travel together without compromising one another."
            />
          </Reveal>
          <Reveal className="mt-12" delay={0.05}>
            <TemperatureRuler />
          </Reveal>
          <Reveal className="mt-6" delay={0.1}>
            <ColdChainTable />
          </Reveal>
          <Reveal className="mt-6">
            <p className="max-w-[70ch] text-sm text-ink-500">
              Shelf lives are typical upper limits and depend on the collection bag, additive solution and the blood centre's own validated
              processes. The expiry printed on each unit's label is what counts.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- Compatibility ---------- */}
      <section id="compatibility" className="container-page scroll-mt-24 py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Interactive"
            title="Who can receive from whom?"
            description="Explore ABO and Rh compatibility for red cells and plasma, as a patient or as a donor. The rules for plasma run the other way round."
          />
        </Reveal>
        <Reveal className="mt-12" delay={0.05}>
          <CompatibilityChecker />
        </Reveal>
      </section>

      {/* ---------- Never ---------- */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="relative isolate overflow-hidden rounded-5xl bg-ink-950 px-5 py-12 text-ink-300 sm:px-10 sm:py-16 lg:px-16">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] bg-size-[18px_18px]"
            aria-hidden
          />
          <div className="absolute -top-32 -left-24 -z-10 size-96 rounded-full bg-blood-600/20 blur-3xl" aria-hidden />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
            <Reveal>
              <p className="font-display text-7xl leading-none font-bold text-blood-500 sm:text-8xl lg:text-9xl" aria-hidden>
                Never.
              </p>
              <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">Five lines we will not cross, however urgent the request.</h2>
              <p className="mt-4 max-w-[52ch] text-ink-400">
                Being fast means saying no quickly and clearly when a request is unsafe. These rules are built into the product, not left to
                judgement at 3 a.m.
              </p>
            </Reveal>
            <ol className="divide-y divide-white/10">
              {NEVER.map((n, i) => (
                <li key={n.title} className="py-5 first:pt-0 last:pb-0">
                  <Reveal delay={i * 0.05} className="flex gap-4 sm:gap-5">
                    <span
                      className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-white/5 text-white ring-1 ring-white/10"
                      aria-hidden
                    >
                      {n.icon}
                      <span className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 -rotate-45 rounded-full bg-blood-500" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white sm:text-xl">
                        <span className="sr-only">Never: </span>
                        {n.title}
                      </h3>
                      <p className="mt-1 max-w-[60ch] text-ink-400">{n.body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Warning signs ---------- */}
      <section id="reactions" className="scroll-mt-24 border-t border-ink-100 bg-white py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-14">
            <div>
              <Reveal>
                <SectionHeading
                  eyebrow="For patients & families"
                  title="Know the warning signs of a transfusion reaction"
                  description="Most transfusions go smoothly. If you notice any of these in the person receiving blood, act straight away."
                />
              </Reveal>
              <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                {SIGNS.map((s, i) => (
                  <li key={s.title}>
                    <Reveal delay={i * 0.04} className="flex h-full gap-4 rounded-3xl border border-ink-100 bg-paper p-5">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                        aria-hidden
                      >
                        {s.icon}
                      </span>
                      <div>
                        <h3 className="font-sans text-base font-semibold">{s.title}</h3>
                        <p className="mt-0.5 text-sm text-ink-600">{s.body}</p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </div>

            <Reveal delay={0.1} className="lg:pt-24">
              <div className="rounded-4xl bg-blood-600 p-6 text-white shadow-glow sm:p-8" role="note">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/15" aria-hidden>
                  <ShieldAlert className="size-6" />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-white sm:text-3xl">Tell the nurse or doctor immediately.</h3>
                <p className="mt-3 text-blood-50">
                  Don't wait to see if it passes. Staff can stop or slow the transfusion and check the patient at once.
                </p>
                <p className="mt-3 text-blood-50">
                  Reactions can happen during a transfusion or in the hours and days after it. If you notice these signs after leaving
                  hospital, contact the treating hospital or call {BRAND.emergencyPhone}.
                </p>
                <a
                  href={`tel:${BRAND.emergencyPhone}`}
                  className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-blood-700 transition hover:bg-blood-50"
                >
                  <Siren className="size-4" aria-hidden /> Call {BRAND.emergencyPhone}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Incident reporting ---------- */}
      <section id="report" className="container-page scroll-mt-24 py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Reveal>
            <div className="h-full rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-10">
              <p className="eyebrow">Incident reporting</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">See something wrong? Tell us now.</h2>
              <p className="mt-4 max-w-[60ch] text-ink-600">
                Hospital staff, riders, patients and families can all report a safety concern, any time. Please quote your order ID (it
                starts with RF-). We log every report, alert the blood centre and hospital involved, and follow up with you.
              </p>
              <ul className="mt-6 space-y-2.5">
                {REPORT_ITEMS.map((r) => (
                  <li key={r} className="flex gap-3 text-ink-700">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blood-600" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-[60ch] text-sm text-ink-500">
                Suspected transfusion reactions should be reported to the treating team first. Hospitals report adverse reactions through
                the national Haemovigilance Programme of India, and we support any investigation with our logger and delivery records.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex h-full flex-col gap-3">
              <a
                href={`tel:${BRAND.supportPhone}`}
                className="group flex flex-1 flex-col justify-between rounded-4xl bg-ink-950 p-6 text-white transition hover:bg-ink-900 sm:p-8"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/10" aria-hidden>
                    <Phone className="size-5" />
                  </span>
                  <ArrowUpRight
                    className="size-5 text-ink-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                    aria-hidden
                  />
                </span>
                <span className="mt-8 block">
                  <span className="block text-sm text-ink-400">Safety line · 24×7 toll-free</span>
                  <span className="mt-1 block font-display text-3xl font-bold tabular">{BRAND.supportPhone}</span>
                </span>
              </a>
              <a
                href={`mailto:${BRAND.supportEmail}?subject=${encodeURIComponent('Safety incident report')}`}
                className="group flex items-center gap-4 rounded-4xl border border-ink-100 bg-white p-6 shadow-soft transition hover:border-ink-200"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blood-50 text-blood-600" aria-hidden>
                  <Mail className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink-500">Email a report</span>
                  <span className="block truncate font-semibold text-ink-950">{BRAND.supportEmail}</span>
                </span>
              </a>
              <a
                href={`tel:${BRAND.emergencyPhone}`}
                className="flex items-center gap-4 rounded-4xl bg-blood-50 p-6 text-blood-800 ring-1 ring-blood-100 transition hover:bg-blood-100"
              >
                <Siren className="size-5 shrink-0" aria-hidden />
                <span className="font-semibold">Someone's life at risk? Call {BRAND.emergencyPhone} first.</span>
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <div className="flex flex-col items-start justify-between gap-4 rounded-4xl border border-dashed border-ink-200 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
            <p className="max-w-[60ch] text-ink-600">Want the full picture of the licences, rules and guidelines behind this page?</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/legal/compliance" className={buttonClass({ variant: 'dark', size: 'md' })}>
                Regulatory compliance
              </Link>
              <Link to="/guide" className={buttonClass({ variant: 'outline', size: 'md' })}>
                User manual
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </MotionConfig>
  )
}
