import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BRAND, FEES } from '@/config/brand'
import { COMPONENTS, PRIORITIES } from '@/data/blood'
import { PARTNER_HOSPITALS } from '@/data/network'
import { CITIES } from '@/data/cities'
import { formatINR } from '@/lib/utils'

function A({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-blood-700 underline decoration-blood-200 underline-offset-4 hover:decoration-blood-600">
      {children}
    </Link>
  )
}

const gstPct = Math.round(FEES.logisticsGstRate * 100)

export const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Why can't you deliver blood to my home?",
    a: (
      <p>
        A transfusion is a medical procedure. Before blood goes into a patient, the hospital must cross-match it against the patient's own
        sample, check identity at the bedside and monitor for reactions, with a team ready to act. None of that is possible at home, so we
        deliver only to the blood transfusion desk of registered partner hospitals and nursing homes.
      </p>
    ),
  },
  {
    q: "If blood isn't sold, what am I paying for?",
    a: (
      <>
        <p>Two things, both shown line by line before you pay:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Processing charges</strong> set by the licensed blood centre for collecting, testing, separating and storing the unit,
            capped under National Blood Transfusion Council (NBTC) guidelines. For example, up to{' '}
            {formatINR(COMPONENTS.PRBC.processingCharge)} per unit of red cells.
          </li>
          <li>
            A flat <strong>cold-chain logistics fee</strong> of {formatINR(FEES.logistics)} per order, plus {gstPct}% GST on that fee only.
          </li>
        </ul>
        <p className="mt-2">The blood itself is always free. We never mark up processing charges.</p>
      </>
    ),
  },
  {
    q: 'How is a 10-minute dispatch possible?',
    a: (
      <p>
        For {PRIORITIES.emergency.label.toLowerCase()} orders our target is to have the sealed cold box leave the blood centre within about{' '}
        {BRAND.promiseMinutes} minutes of a confirmed order. We get there by verifying requisitions digitally, keeping validated cold boxes
        and riders ready at partner centres, and automatically choosing the nearest centre that has every unit in stock. Travel time then
        depends on distance and traffic, which you can watch live. It is a target we work to, not a guarantee, and safety checks are never
        skipped to meet it.
      </p>
    ),
  },
  {
    q: 'What if the blood group I need is out of stock?',
    a: (
      <p>
        You can check <A to="/availability">live stock</A> before ordering. If no nearby centre can supply the full order, the app tells you
        straight away instead of taking payment, and our team calls you to help find it through other licensed centres. If stock changes
        while you pay, the order is not confirmed and any amount debited is refunded.
      </p>
    ),
  },
  {
    q: 'What is the handover OTP, and who do I give it to?',
    a: (
      <p>
        It is a 4-digit code shown after payment. It proves the sealed box reached the right hands. Give it only to the staff at the
        hospital's blood transfusion desk; they read it to the rider once they have checked the seal and the temperature logger. Never share
        it over the phone with someone claiming to be a rider.
      </p>
    ),
  },
  {
    q: 'Can I cancel my order?',
    a: (
      <p>
        Yes, free of charge from <A to="/orders">My orders</A>, until the requisition is verified and before the units are packed. Once the
        box is packed or on its way, it cannot be cancelled in the app because the units have left the centre's controlled storage. Call us
        on {BRAND.supportPhone} and we will do what we safely can.
      </p>
    ),
  },
  {
    q: 'How long do refunds take?',
    a: (
      <p>
        Refunds go back to the original payment method within 5–7 working days of the cancellation. UPI refunds are often faster; card and
        bank timelines depend on your bank. See the full <A to="/legal/refunds">cancellation and refund policy</A>.
      </p>
    ),
  },
  {
    q: 'Is my medical data safe?',
    a: (
      <p>
        We collect only what the requisition needs, use it only to fulfil and support your order, and share it only with the blood centre
        and hospital handling it. Riders see an order ID and a desk, not a diagnosis. Card details are handled by a PCI-DSS compliant
        payment gateway and never stored by us. You can ask to access, correct or erase your data at any time; read our{' '}
        <A to="/legal/privacy">privacy policy</A>.
      </p>
    ),
  },
  {
    q: 'Which areas do you serve?',
    a: (
      <p>
        The prototype covers {CITIES.length} cities, at least one in every state and union territory, with {PARTNER_HOSPITALS.length}{' '}
        partner hospitals and nursing homes. Pick your city from the location bar at the top. All centres, partner hospitals and riders
        in the demo are fictional; the neighbourhoods they sit in, the donation camps and the hospitals on the map are real.
      </p>
    ),
  },
  {
    q: 'How do hospitals get credit terms?',
    a: (
      <p>
        Register your facility, and once our team has verified its Clinical Establishments registration and your authorised signatory, the{' '}
        <strong>Hospital credit</strong> option appears at checkout. You enter a purchase-order number with each order and settle against
        invoices as per your agreement. See the <A to="/hospital">hospital page</A>.
      </p>
    ),
  },
  {
    q: 'Can I choose a specific blood centre?',
    a: (
      <p>
        Orders are matched automatically to the nearest licensed centre that can supply every unit, because that is what keeps delivery fast
        and the box in one piece. If the treating doctor needs units from a particular centre, call us before ordering and we will try to
        arrange it.
      </p>
    ),
  },
  {
    q: 'What if the temperature goes out of range during transit?',
    a: (
      <p>
        The logger alerts our control room straight away. A unit that has left its safe range is not handed over for transfusion: it goes
        back to the blood centre, whose medical officer decides what happens to it, and we arrange a replacement where stock allows. You are
        not charged for a delivery that fails because of a cold-chain problem on our side.
      </p>
    ),
  },
  {
    q: "Do I really need a doctor's requisition?",
    a: (
      <p>
        Yes. Blood centres may issue blood only against a requisition from a registered medical practitioner, and the centre's medical
        officer checks it before anything leaves the shelf. Orders without a valid requisition cannot be fulfilled.
      </p>
    ),
  },
  {
    q: `Does ${BRAND.name} check that the blood matches the patient?`,
    a: (
      <p>
        The blood centre issues units of the group and component on the requisition. The final compatibility check is always done by the
        hospital, which cross-matches each unit against the patient's sample and performs a bedside identity check. Try our{' '}
        <A to="/safety#compatibility">compatibility explainer</A> to learn how it works.
      </p>
    ),
  },
  {
    q: 'Is this a real service?',
    a: (
      <p>
        Not yet. This is a working prototype: payments, stock and deliveries are simulated and no real blood is dispatched. In a medical
        emergency, call {BRAND.emergencyPhone}.
      </p>
    ),
  },
]

export const EXTRA_TERMS: { term: string; def: string }[] = [
  { term: 'Requisition form', def: 'The request for blood signed by the treating doctor, stating the patient, component and units.' },
  {
    term: 'Cross-match',
    def: "A laboratory test at the hospital that mixes the patient's sample with the donor unit to confirm compatibility.",
  },
  { term: 'Cold chain', def: 'Keeping each component within its safe temperature range from collection until transfusion.' },
  { term: 'Temperature logger', def: 'A small device sealed in the cold box that records temperature throughout the trip.' },
  { term: 'Handover OTP', def: 'A 4-digit code the transfusion desk shares with the rider to confirm the box reached the right hands.' },
  { term: 'NAT', def: 'Nucleic acid testing: a sensitive screen for viral infections that shortens the window period.' },
  { term: 'UHID', def: "Unique hospital ID: the patient's record number at the hospital, printed on admission papers." },
  { term: 'NBTC', def: 'National Blood Transfusion Council, which sets national policy and guidelines for blood services in India.' },
]
