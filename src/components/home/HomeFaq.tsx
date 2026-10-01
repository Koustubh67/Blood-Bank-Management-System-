import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Headset, MapPin } from 'lucide-react'
import { BRAND, FEES } from '@/config/brand'
import { Accordion } from '@/components/ui/disclosure'
import { ButtonLink } from '@/components/ui/Button'
import { formatINR } from '@/lib/utils'
import { PulseDrop } from './graphics'
import { HomeHeading, Reveal } from './Reveal'

/** The four questions people ask first; the rest live in the guide. */
const FAQ = [
  {
    q: `Is ${BRAND.name} selling blood?`,
    a: (
      <>
        No. Blood cannot be bought or sold in India, and we never charge for blood itself. The licensed blood centre levies only its capped processing
        charge per unit for testing, separation and storage, and we add a flat {formatINR(FEES.logistics)} cold-chain logistics fee per order. You see
        the itemised bill before paying.
      </>
    ),
  },
  {
    q: 'Can you deliver blood to my home?',
    a: (
      <>
        No. A transfusion must happen in a hospital under medical supervision. We deliver only to registered partner hospitals and nursing homes,
        where the blood desk receives the sealed box with an OTP and runs cross-matching and bedside checks before transfusion.
      </>
    ),
  },
  {
    q: 'What do I need to place an order?',
    a: (
      <>
        A blood requisition form signed by the treating doctor with their registration number, the patient&rsquo;s details and blood group, and the
        partner hospital where the patient is admitted. The blood centre&rsquo;s medical officer verifies the requisition before any unit is issued.
      </>
    ),
  },
  {
    q: `Is the ${BRAND.promiseMinutes}-minute delivery guaranteed?`,
    a: (
      <>
        It is a target, not a guarantee. Emergency orders are prioritised and dispatched from the nearest centre with stock, aiming to reach the
        hospital within {BRAND.promiseMinutes} minutes. Distance, traffic, stock and requisition checks can add time, and you always see a live ETA.
      </>
    ),
  },
]

const linkClass = 'w-fit font-semibold text-ink-900 underline decoration-ink-200 underline-offset-4 hover:text-blood-700 hover:decoration-blood-300'

/** Top questions, a human to call, and the one closing call to action. */
export function HomeFaq() {
  return (
    <>
      <section aria-labelledby="faq-title" className="pt-14 sm:pt-20">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-14">
            <div className="flex flex-col gap-6">
              <HomeHeading
                size="md"
                id="faq-title"
                eyebrow="Questions"
                title="Straight answers."
                description="Blood is regulated for good reasons, so we explain the rules as we go."
              />
              <Reveal delay={0.08} className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ice-50 text-ice-700 ring-1 ring-ice-100">
                  <Headset className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-ink-950">Talk to a person, any hour</p>
                  <p className="mt-0.5 text-ink-500">Toll-free, 24×7, for families and hospital teams.</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <a href={`tel:${BRAND.supportPhone}`} className={linkClass}>
                      {BRAND.supportPhone}
                    </a>
                    <Link to="/guide#faq" className={`group inline-flex items-center gap-1 ${linkClass}`}>
                      All FAQs
                      <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </Link>
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.05}>
              <Accordion items={FAQ} className="shadow-soft" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="cta-title" className="pt-10 pb-10 sm:pt-14 sm:pb-14">
        <div className="container-page">
          <Reveal className="flex flex-col gap-6 rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <PulseDrop className="mt-1 h-10 shrink-0" ring={false} />
              <div className="min-w-0">
                <h2 id="cta-title" className="text-2xl leading-tight font-bold tracking-tight sm:text-[1.75rem]">
                  When minutes matter, start here.
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-600">
                  <span className="font-semibold text-ink-900">Patient not in a hospital yet?</span> Call{' '}
                  <a href={`tel:${BRAND.emergencyPhone}`} className="font-bold text-ink-950 underline underline-offset-2 hover:text-blood-700">
                    {BRAND.emergencyPhone}
                  </a>{' '}
                  for an ambulance first. {BRAND.name} delivers blood to hospitals and is not an emergency medical service.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <ButtonLink to="/order?priority=emergency&component=PRBC" size="lg" className="w-full sm:w-auto">
                Start an emergency order <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/track" variant="outline" size="lg" icon={<MapPin className="size-5" aria-hidden />} className="w-full sm:w-auto">
                Track an order
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
