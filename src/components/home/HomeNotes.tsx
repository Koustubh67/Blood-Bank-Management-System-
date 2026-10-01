import { Link } from 'react-router'
import { BRAND } from '@/config/brand'

/**
 * Every caveat on the home page in one quiet place, instead of a small-print
 * paragraph under each section.
 */
export function HomeNotes() {
  return (
    <aside aria-labelledby="notes-title" className="container-page pb-12 sm:pb-16">
      <div className="max-w-4xl border-t border-ink-100 pt-6 text-xs leading-relaxed text-ink-500">
        <h2 id="notes-title" className="font-sans text-[11px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
          Notes
        </h2>
        <p className="mt-2">
          Counter-route waits are illustrative, drawn from commonly reported experiences, and vary by city, hospital and time of day. {BRAND.name}{' '}
          times, including the {BRAND.promiseMinutes}-minute dispatch, are targets for emergency orders, not guarantees: distance, traffic, stock and
          requisition checks can add time, you always see a live ETA, and the hospital still cross-matches every unit before transfusion. Charges are
          indicative caps based on NBTC guidance and the 2024 DCGI advisory; processing is GST-exempt and GST applies only to logistics (
          <Link to="/legal/refunds" className="font-medium text-ink-700 underline underline-offset-2 hover:text-blood-700">
            cancellation &amp; refunds
          </Link>
          ). Eligibility is a pre-check; the centre&rsquo;s medical officer decides after a haemoglobin test.
        </p>
        <p className="mt-2">
          This is a prototype: centres, outlets, partner hospitals, stock and fridge readings are simulated. Camp schedule from e-RaktKosh, Ministry
          of Health &amp; Family Welfare; hospital locations &copy; OpenStreetMap contributors. {BRAND.name} is not affiliated with either, and a
          hospital listed here is not necessarily a partner.
        </p>
      </div>
    </aside>
  )
}
