import { Link } from 'react-router'
import { ArrowUpRight, KeyRound, Layers, Microscope, Snowflake, TestTubes, UserCheck } from 'lucide-react'
import { FEES } from '@/config/brand'
import { COMPONENTS } from '@/data/blood'
import { quote } from '@/services/orders'
import { cn, formatINR } from '@/lib/utils'
import { HomeHeading, Reveal, RevealItem, SECTION_Y } from './Reveal'

const CHAIN = [
  { icon: UserCheck, title: 'Donor screening', body: "Questionnaire, haemoglobin check and a medical officer's exam.", tone: 'blood' },
  { icon: TestTubes, title: 'Infection testing', body: 'HIV, hepatitis B and C, syphilis and malaria, on every unit.', tone: 'blood' },
  { icon: Layers, title: 'Component separation', body: 'Red cells, plasma and platelets, each at its own temperature.', tone: 'blood' },
  { icon: Snowflake, title: 'Validated cold chain', body: 'Sealed, pre-conditioned boxes with a temperature logger.', tone: 'ice' },
  { icon: KeyRound, title: 'OTP handover', body: "Released only against the hospital desk's 4-digit code.", tone: 'ice' },
  { icon: Microscope, title: 'Hospital cross-match', body: 'Cross-match and bedside checks before any transfusion.', tone: 'ink' },
] as const

const TONE = {
  blood: 'bg-blood-50 text-blood-600 ring-blood-100',
  ice: 'bg-ice-50 text-ice-700 ring-ice-100',
  ink: 'bg-ink-100 text-ink-800 ring-ink-200',
}

const EXAMPLE_UNITS = 2
const EXAMPLE = quote([{ component: 'PRBC', group: 'B+', units: EXAMPLE_UNITS }])
const GST_PCT = Math.round(FEES.logisticsGstRate * 100)

const linkClass =
  'group inline-flex items-center gap-1 text-sm font-semibold text-ink-900 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-blood-700 hover:decoration-blood-300'

/** Safety and pricing side by side: the six checks every unit passes, and an itemised bill. */
export function SafeAndFair() {
  return (
    <section aria-labelledby="safe-title" className={cn('border-y border-ink-100 bg-white', SECTION_Y)}>
      <div className="container-page">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <HomeHeading
            size="md"
            id="safe-title"
            eyebrow="Safe and fair"
            title={
              <>
                Every check kept. <span className="text-ink-400">Every rupee shown.</span>
              </>
            }
          />
          <Reveal delay={0.05} className="max-w-md lg:mb-1.5">
            <p className="leading-relaxed text-ink-600 sm:text-lg">Speed never skips a step, and blood is never sold. Here is what protects the patient, and the whole bill.</p>
          </Reveal>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 lg:grid-cols-2 lg:gap-5">
          {/* Safety chain */}
          <Reveal className="flex flex-col rounded-4xl bg-paper p-5 ring-1 ring-ink-100 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl font-bold sm:text-2xl">Six checkpoints, donor to patient</h3>
              <Link to="/safety" className={linkClass}>
                Full safety chain
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
            <ol className="mt-6 flex flex-1 flex-col">
              {CHAIN.map(({ icon: Icon, title, body, tone }, i) => (
                <RevealItem key={title} delay={i * 0.05} y={12} className="relative flex flex-1 gap-4 pb-4 last:pb-0">
                  {i < CHAIN.length - 1 && <span aria-hidden className="absolute top-11 bottom-0.5 left-5 w-px bg-ink-200" />}
                  <span className={cn('relative grid size-10 shrink-0 place-items-center rounded-xl ring-1', TONE[tone])}>
                    <Icon className="size-[1.15rem]" aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] leading-tight font-semibold text-ink-950">
                      <span className="sr-only">Step {i + 1}: </span>
                      {title}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-ink-500">{body}</p>
                  </div>
                </RevealItem>
              ))}
            </ol>
          </Reveal>

          {/* Example bill */}
          <Reveal delay={0.08} className="flex flex-col rounded-4xl bg-paper p-5 ring-1 ring-ink-100 sm:p-8">
            <h3 className="text-xl font-bold sm:text-2xl">
              Blood is{' '}
              <span className="relative inline-block text-blood-600">
                never
                <svg viewBox="0 0 200 20" className="absolute bottom-[-0.14em] left-0 h-[0.2em] w-full text-blood-600" preserveAspectRatio="none" aria-hidden>
                  <path d="M3 14 C 50 4, 110 4, 197 11" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>{' '}
              sold.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Centres levy only a capped processing charge; we add one flat cold-chain fee. No charge for the blood itself, and GST only on logistics.
            </p>

            <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-100 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-ink-500 uppercase">Example bill</p>
                  <p className="mt-0.5 font-display text-lg font-bold tracking-tight">
                    {EXAMPLE_UNITS} units of {COMPONENTS.PRBC.short.toLowerCase()}
                  </p>
                </div>
                <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">Illustrative</span>
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-600">
                    Processing charge
                    <span className="block text-xs text-ink-400">
                      {EXAMPLE_UNITS} × {formatINR(COMPONENTS.PRBC.processingCharge)}, paid to the blood centre
                    </span>
                  </dt>
                  <dd className="font-semibold text-ink-900 tabular">{formatINR(EXAMPLE.processing)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-600">Cold-chain logistics, flat per order</dt>
                  <dd className="font-semibold text-ink-900 tabular">{formatINR(EXAMPLE.logistics)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-600">GST on logistics ({GST_PCT}%)</dt>
                  <dd className="font-semibold text-ink-900 tabular">{formatINR(EXAMPLE.logisticsGst)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 text-ink-400">
                  <dt>Blood</dt>
                  <dd className="font-semibold tabular">{formatINR(0)}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-end justify-between gap-4 border-t-2 border-dashed border-ink-100 pt-4">
                <p className="font-semibold text-ink-950">Total</p>
                <p className="font-display text-3xl font-bold tracking-[-0.03em] text-ink-950 tabular">{formatINR(EXAMPLE.total)}</p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-5">
              <Link to="/guide#glossary" className={linkClass}>
                Charges for every component
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
              <Link to="/legal/refunds" className={linkClass}>
                Cancellation &amp; refunds
                <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
