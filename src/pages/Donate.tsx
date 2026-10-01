import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarHeart, Stethoscope } from 'lucide-react'
import { SectionHeading } from '@/components/ui/primitives'
import { DonateHero } from '@/components/donate/DonateHero'
import { CompatibilityExplorer } from '@/components/donate/CompatibilityExplorer'
import { EligibilityChecker, type EligibilityPrefill } from '@/components/donate/EligibilityChecker'
import { DonorBooking } from '@/components/donate/DonorBooking'
import { BookingList } from '@/components/donate/BookingList'
import { DonationProcess } from '@/components/donate/DonationProcess'
import { MythsFacts } from '@/components/donate/MythsFacts'
import { CampsCallout } from '@/components/donate/CampsCallout'
import { isUpcoming } from '@/components/donate/slots'
import { useMyDonations } from '@/services/donors'
import { useCurrentUser } from '@/services/auth'

export default function Donate() {
  const user = useCurrentUser()
  const bookings = useMyDonations()
  const upcomingCount = useMemo(() => bookings.filter((b) => isUpcoming(b)).length, [bookings])
  const [prefill, setPrefill] = useState<(EligibilityPrefill & { nonce: number }) | null>(null)

  const goBook = (p: EligibilityPrefill) => {
    setPrefill({ ...p, nonce: Date.now() })
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <DonateHero />

      {user && bookings.length > 0 && (
        <section className="container-page -mt-4 pb-12 sm:pb-16" aria-labelledby="my-bookings">
          <div className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-blood-50 text-blood-600">
                  <CalendarHeart className="size-5" />
                </span>
                <div>
                  <h2 id="my-bookings" className="text-xl font-bold sm:text-2xl">
                    Your donation bookings
                  </h2>
                  <p className="text-sm text-ink-500">
                    {upcomingCount > 0 ? `${upcomingCount} upcoming. Thank you for showing up.` : 'Nothing upcoming right now.'}
                  </p>
                </div>
              </div>
              <Link to="/account" className="text-sm font-semibold text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline">
                Manage in account
              </Link>
            </div>
            <BookingList bookings={bookings} compact />
          </div>
        </section>
      )}

      <section className="border-y border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Who your blood helps"
            title="Pick your group. See who you could save."
            description="Red cells must match the patient’s group. Some groups can go to many people; others are rare and precious."
          />
          <div className="mt-10 sm:mt-12">
            <CompatibilityExplorer />
          </div>
        </div>
      </section>

      <section id="eligibility" className="scroll-mt-20 py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Eligibility check"
            title="Can I donate today?"
            description="A quick self-check against national donor criteria. It is a guide, not a medical assessment."
          />
          <div className="mt-10 sm:mt-12">
            <EligibilityChecker onBook={goBook} />
          </div>
        </div>
      </section>

      <section id="book" className="scroll-mt-20 border-y border-ink-100 bg-ink-50/60 py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Book a slot"
            title="Choose a centre and a time that suits you"
            description="All centres below are licensed blood centres in our network. Booking is free and takes under two minutes."
          />
          <div className="mt-10 sm:mt-12">
            <DonorBooking prefill={prefill} />
          </div>
          <div className="mt-10 sm:mt-12">
            <CampsCallout />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="On the day" title="What happens when you donate" description="Plan for about 45 minutes in all. The needle part takes under 10." />
          <div className="mt-10 sm:mt-12">
            <DonationProcess />
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Myths vs facts" title="Worried about donating? Start here." />
          <div className="mt-10 sm:mt-12">
            <MythsFacts />
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-5xl bg-ink-950 p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-blood-600/40 blur-3xl" aria-hidden />
          <div className="flex max-w-2xl gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10">
              <Stethoscope className="size-6 text-blood-300" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">The medical officer has the final say</h2>
              <p className="mt-3 text-ink-300">
                Online checks are a guide. Whether you can donate is decided at the centre by its medical officer after a haemoglobin test
                and a short examination, to keep both you and the patient safe. Donation in India is voluntary and unpaid.
              </p>
            </div>
          </div>
          <a
            href="#eligibility"
            className="inline-flex h-13 shrink-0 items-center justify-center rounded-full bg-white px-7 font-semibold text-ink-950 transition hover:bg-ink-100"
          >
            Check eligibility
          </a>
        </div>
      </section>
    </>
  )
}
