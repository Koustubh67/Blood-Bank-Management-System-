import type { ReactNode } from 'react'
import { Building2, HandHeart, Users } from 'lucide-react'
import { BRAND, FEES } from '@/config/brand'
import { PRIORITIES } from '@/data/blood'
import { TEST_INSTRUMENTS } from '@/services/payments'
import { formatINR } from '@/lib/utils'
import {
  MockCancel,
  MockCrossmatch,
  MockDashboard,
  MockDonorThanks,
  MockDonationDay,
  MockEligibility,
  MockEmergency,
  MockHandover,
  MockHospitalPick,
  MockOrderBasics,
  MockPayment,
  MockRequisition,
  MockReview,
  MockSignup,
  MockSlots,
  MockSuccess,
  MockTracking,
} from './mocks'

export type Audience = 'patients' | 'hospitals' | 'donors'

export interface ManualStep {
  title: string
  body: ReactNode
  points?: ReactNode[]
  mock: ReactNode
  link?: { to: string; label: string }
}

export interface Manual {
  key: Audience
  label: string
  /** Tab label on phones */
  short: string
  icon: ReactNode
  title: string
  intro: string
  steps: ManualStep[]
}

const gstPct = Math.round(FEES.logisticsGstRate * 100)

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-900">{children}</code>
}

export const MANUALS: Manual[] = [
  {
    key: 'patients',
    label: 'Patients & families',
    short: 'Families',
    icon: <Users className="size-4" />,
    title: 'For patients and families',
    intro:
      "You are probably ordering because a doctor has asked the family to arrange blood. Here's exactly what happens, from sign-up to the moment the hospital receives the sealed box.",
    steps: [
      {
        title: 'Create your account',
        body: (
          <p>
            Go to <strong>Sign up</strong> and choose <strong>Patient / family</strong>. Enter your name, mobile number, email and a
            password of at least 8 characters. You only need to do this once; your orders and receipts stay in one place.
          </p>
        ),
        points: [
          'Use a mobile number you will keep with you: the hospital may call it',
          'One account can place orders for any family member',
        ],
        mock: <MockSignup />,
        link: { to: '/signup', label: 'Create an account' },
      },
      {
        title: 'Choose urgency, blood group and component',
        body: (
          <p>
            Tap <strong>Order blood</strong>. Pick how urgent it is, then the patient's blood group and the component written on the
            requisition, such as red cells, platelets or plasma, with the number of units.
          </p>
        ),
        points: [
          <>
            <strong>{PRIORITIES.emergency.label}</strong>: {PRIORITIES.emergency.hint}
          </>,
          <>
            <strong>{PRIORITIES.urgent.label}</strong>: {PRIORITIES.urgent.hint}
          </>,
          <>
            <strong>{PRIORITIES.scheduled.label}</strong>: {PRIORITIES.scheduled.hint}
          </>,
          'Up to 10 units per line in the app; for more, call our hospital desk',
        ],
        mock: <MockOrderBasics />,
        link: { to: '/order', label: 'Start an order' },
      },
      {
        title: 'Add patient details and the hospital',
        body: (
          <p>
            Enter the patient's name, age, gender and blood group exactly as on the hospital record, plus the ward and UHID if you have
            them. Then choose the partner hospital where the patient is admitted. We deliver only to registered partner hospitals, never to
            a home.
          </p>
        ),
        points: [
          'Details must match the requisition, or the blood centre cannot verify it',
          'Diagnosis is optional; share only what the doctor has written',
        ],
        mock: <MockHospitalPick />,
      },
      {
        title: 'Upload the requisition and accept the declarations',
        body: (
          <p>
            Photograph or scan the blood requisition form signed by the treating doctor and upload it. Add the doctor's name and medical
            registration number. Then confirm the three declarations: the requisition is genuine, the transfusion will happen at the
            hospital, and you accept the terms.
          </p>
        ),
        points: [
          'A clear, flat photo in good light works best',
          "The blood centre's medical officer checks this before anything is issued",
        ],
        mock: <MockRequisition />,
      },
      {
        title: 'Review the price and pay',
        body: (
          <p>
            The review screen itemises every rupee. Blood itself is never charged for: you pay the processing charges set by the blood
            centre within NBTC caps, plus a flat {formatINR(FEES.logistics)} cold-chain logistics fee and {gstPct}% GST on that fee only.
            Pay by UPI, card or netbanking through our secure payment partner.
          </p>
        ),
        points: [
          <>
            <strong>Test mode:</strong> card <Code>{TEST_INSTRUMENTS.cardSuccess}</Code> succeeds and{' '}
            <Code>{TEST_INSTRUMENTS.cardDecline}</Code> is declined. Use any future expiry and any 3-digit CVV.
          </>,
          <>
            UPI <Code>{TEST_INSTRUMENTS.upiSuccess}</Code> succeeds and <Code>{TEST_INSTRUMENTS.upiFail}</Code> fails. In netbanking, "Test
            Bank" always fails.
          </>,
          'A failed payment never creates a duplicate order; you can retry from the same screen',
        ],
        mock: <MockReview />,
      },
      {
        title: 'Keep your handover OTP safe',
        body: (
          <p>
            Once payment succeeds you will see your order ID (it starts with RF-) and a 4-digit <strong>handover OTP</strong>. Give the OTP
            only to the staff at the hospital's blood transfusion desk. The rider releases the sealed box only after the desk reads it out.
          </p>
        ),
        points: [
          'Never share the OTP over the phone with anyone claiming to be a rider',
          'Tell the transfusion desk your order ID so they expect the box',
        ],
        mock: <MockSuccess />,
      },
      {
        title: 'Track the delivery live',
        body: (
          <p>
            Your tracking page shows each stage, from requisition verified to packed, out for delivery and delivered. Once the rider sets
            off you see them on the map with a live ETA, plus the cold-box temperature for each compartment.
          </p>
        ),
        points: [
          'Anyone with the order ID can open the tracking page, so share it with the hospital desk',
          'Temperatures show green while in range',
        ],
        mock: <MockTracking />,
        link: { to: '/track', label: 'Track an order' },
      },
      {
        title: 'Cancel or get a refund if plans change',
        body: (
          <p>
            You can cancel free of charge from <strong>My orders</strong> until the order is verified and before it is packed. Once the box
            is packed or on its way, it can't be cancelled in the app; call us on {BRAND.supportPhone} and we will do what we safely can.
            Refunds go back to your original payment method within 5–7 working days.
          </p>
        ),
        points: [
          'Cancelling before payment costs nothing: you are never charged',
          'Once handed over, units cannot be returned, for safety reasons',
        ],
        mock: <MockCancel />,
        link: { to: '/legal/refunds', label: 'Read the refund policy' },
      },
    ],
  },
  {
    key: 'hospitals',
    label: 'Hospitals',
    short: 'Hospitals',
    icon: <Building2 className="size-4" />,
    title: 'For hospitals and nursing homes',
    intro:
      'Built for the blood transfusion desk: verified facility accounts, one-tap emergency orders, credit terms and a clean handover record for every unit.',
    steps: [
      {
        title: 'Register and verify your facility',
        body: (
          <p>
            Sign up as a <strong>Hospital</strong>, choose your facility and enter its Clinical Establishments registration number. Our
            partnerships team verifies the registration and your authorised signatory before credit terms are switched on.
          </p>
        ),
        points: [
          'Use a shared desk email so the whole team can see orders',
          'Only registered hospitals and nursing homes can receive deliveries',
        ],
        mock: <MockSignup hospital />,
        link: { to: '/signup', label: 'Register a hospital' },
      },
      {
        title: 'Know your dashboard',
        body: (
          <p>
            The hospital dashboard brings together every active order for your facility, what is arriving now and the blood stock available
            nearby. Orders placed by patients' families for your facility appear here too, so the desk is never surprised.
          </p>
        ),
        mock: <MockDashboard />,
        link: { to: '/hospital', label: 'Open the dashboard' },
      },
      {
        title: 'Place a one-tap emergency order',
        body: (
          <p>
            In an emergency, the <strong>Emergency order</strong> button pre-fills your facility and sets the highest priority, so you only
            choose the group, component and units and attach the requisition. Emergency orders are dispatched first from the nearest centre
            that has every unit in stock.
          </p>
        ),
        points: [
          'The signed requisition is still required, even in an emergency',
          `Emergency target: about ${PRIORITIES.emergency.targetMinutes} minutes to dispatch`,
        ],
        mock: <MockEmergency />,
      },
      {
        title: 'Pay per order or on credit',
        body: (
          <p>
            Verified hospitals can choose <strong>Hospital credit</strong> at checkout and enter a purchase-order number, then settle
            against invoices as per your agreement with us. UPI, card and netbanking are always available too.
          </p>
        ),
        points: ['Invoices show processing charges, the logistics fee and GST as separate lines'],
        mock: <MockPayment credit />,
      },
      {
        title: 'Receive the box at the transfusion desk',
        body: (
          <p>
            When the rider arrives, check that the tamper-evident seal is intact, the logger reading is within range and the unit labels
            match the requisition. Then read the 4-digit OTP to the rider to complete the handover. If anything is wrong, do not accept the
            box: call us immediately.
          </p>
        ),
        points: ['Riders never enter wards or hand units to relatives', 'Seal broken or reading out of range? Refuse the box and call us'],
        mock: <MockHandover />,
      },
      {
        title: 'Cross-match and transfuse as usual',
        body: (
          <p>
            Your blood bank performs grouping and cross-matching against the patient's sample, and your staff complete the bedside identity
            check before transfusion under medical supervision. {BRAND.name} never replaces these checks.
          </p>
        ),
        points: ['Report adverse reactions through your haemovigilance process and let us know the order ID'],
        mock: <MockCrossmatch />,
        link: { to: '/safety', label: 'See the full safety chain' },
      },
    ],
  },
  {
    key: 'donors',
    label: 'Donors',
    short: 'Donors',
    icon: <HandHeart className="size-4" />,
    title: 'For blood donors',
    intro:
      'Every unit we deliver started with a volunteer. Donation is voluntary and unpaid, takes about ten minutes in the chair, and one donation can help more than one patient.',
    steps: [
      {
        title: 'Check that you are eligible',
        body: (
          <p>
            Take the 30-second self-check on the <strong>Donate</strong> page. It follows national donor-selection criteria: you should be
            18 to 65, weigh at least 45 kg, feel well, and leave at least 90 days (men) or 120 days (women) between whole-blood donations.
          </p>
        ),
        points: [
          'Wait 12 months after a tattoo, piercing or acupuncture',
          'Not during pregnancy or while breastfeeding',
          "The centre's medical officer makes the final call after a quick check-up",
        ],
        mock: <MockEligibility />,
        link: { to: '/donate', label: 'Check eligibility' },
      },
      {
        title: 'Pick a centre and a slot',
        body: (
          <p>
            Choose a licensed blood centre near you and a time that suits you. Your booking shows the centre, its area and your slot, so you
            can plan the trip and skip the queue.
          </p>
        ),
        mock: <MockSlots />,
        link: { to: '/donate', label: 'Book a slot' },
      },
      {
        title: 'On the day',
        body: (
          <p>
            Eat a light meal, drink plenty of water and carry a photo ID. At the centre you fill in a short health questionnaire and have a
            mini check-up for haemoglobin, blood pressure and weight. The donation itself usually takes about ten minutes.
          </p>
        ),
        points: ['Rest for 10–15 minutes afterwards and have the refreshments offered', 'Avoid heavy exercise for the rest of the day'],
        mock: <MockDonationDay />,
      },
      {
        title: 'After you donate',
        body: (
          <p>
            Your blood is tested and separated into components that can help several patients. If any screening test needs follow-up, the
            blood centre contacts you confidentially. You can donate whole blood again after 90 days (men) or 120 days (women).
          </p>
        ),
        points: ['Drink extra fluids for the next day or two', 'Feeling faint or unwell? Lie down, raise your legs and call the centre'],
        mock: <MockDonorThanks />,
      },
    ],
  },
]
