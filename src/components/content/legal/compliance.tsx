import type { ReactNode } from 'react'
import {
  BadgeCheck,
  Building2,
  CreditCard,
  FileText,
  HandHeart,
  IndianRupee,
  Landmark,
  LockKeyhole,
  Microscope,
  Scale,
  Snowflake,
  Truck,
} from 'lucide-react'
import { BRAND } from '@/config/brand'
import { COMPONENTS } from '@/data/blood'
import { cn } from '@/lib/utils'
import { Callout, DocLink, GrievanceCard, List, type LegalDoc } from './blocks'

const CARDS: { icon: ReactNode; title: string; body: string; basis: string; tone: 'red' | 'ice' | 'dark' | 'neutral' }[] = [
  {
    icon: <Truck className="size-5" />,
    title: 'Not a blood bank',
    body: 'We coordinate and transport. We never collect, test, store or own blood.',
    basis: 'Our operating model',
    tone: 'dark',
  },
  {
    icon: <IndianRupee className="size-5" />,
    title: 'Blood is never sold',
    body: 'Only capped processing charges and a flat, itemised logistics fee.',
    basis: 'NBTC guidelines · 2024 DCGI advisory',
    tone: 'red',
  },
  {
    icon: <BadgeCheck className="size-5" />,
    title: 'Licensed centres only',
    body: 'Every unit comes from a blood centre holding a valid licence.',
    basis: 'Drugs and Cosmetics Act, 1940 and Rules, 1945',
    tone: 'neutral',
  },
  {
    icon: <Building2 className="size-5" />,
    title: 'Registered hospitals only',
    body: 'Delivery only to a partner hospital or nursing home, never a home.',
    basis: 'Clinical establishment registration laws',
    tone: 'neutral',
  },
  {
    icon: <FileText className="size-5" />,
    title: 'Prescription required',
    body: 'A requisition signed by a registered medical practitioner, verified by the centre.',
    basis: 'Blood centre issue requirements',
    tone: 'neutral',
  },
  {
    icon: <Microscope className="size-5" />,
    title: 'Screened units',
    body: 'HIV-1 & 2, hepatitis B & C, syphilis and malaria. NAT where available.',
    basis: 'Mandatory testing in India',
    tone: 'neutral',
  },
  {
    icon: <Snowflake className="size-5" />,
    title: 'Validated cold chain',
    body: `Red cells ${COMPONENTS.PRBC.tempRange}, platelets ${COMPONENTS.PLT.tempRange.replace(' with agitation', '')}, plasma ${COMPONENTS.FFP.tempRange}.`,
    basis: 'Component storage standards',
    tone: 'ice',
  },
  {
    icon: <LockKeyhole className="size-5" />,
    title: 'Privacy by design',
    body: 'Consent, purpose limitation, minimal health data and user rights.',
    basis: 'DPDP Act, 2023 · IT Act, 2000 · SPDI Rules, 2011',
    tone: 'neutral',
  },
  {
    icon: <Scale className="size-5" />,
    title: 'Fair to consumers',
    body: 'Clear prices, refund terms and a named Grievance Officer.',
    basis: 'Consumer Protection (E-Commerce) Rules, 2020',
    tone: 'neutral',
  },
  {
    icon: <CreditCard className="size-5" />,
    title: 'Safe payments',
    body: 'Card data never stored by us; processed by a PCI-DSS compliant gateway.',
    basis: 'RBI payment aggregator rules',
    tone: 'neutral',
  },
  {
    icon: <HandHeart className="size-5" />,
    title: 'Voluntary donors',
    body: 'We promote only voluntary, unpaid donation and national donor criteria.',
    basis: 'NBTC donor selection guidelines, 2017',
    tone: 'neutral',
  },
  {
    icon: <Landmark className="size-5" />,
    title: 'Haemovigilance support',
    body: 'Logger and delivery records available to support reaction reporting.',
    basis: 'Haemovigilance Programme of India',
    tone: 'neutral',
  },
]

const TILE = {
  red: 'bg-blood-600 text-white',
  ice: 'bg-ice-600 text-white',
  dark: 'bg-ink-950 text-white',
  neutral: 'bg-ink-50 text-ink-800 ring-1 ring-ink-100',
}

function ComplianceCards() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((c) => (
        <li key={c.title} className="flex flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
          <span className={cn('grid size-10 place-items-center rounded-xl', TILE[c.tone])} aria-hidden>
            {c.icon}
          </span>
          <p className="mt-4 font-display text-lg leading-snug font-bold text-ink-950">{c.title}</p>
          <p className="mt-1 flex-1 text-[15px] leading-relaxed text-ink-600">{c.body}</p>
          <p className="mt-4 border-t border-ink-100 pt-3 text-xs font-medium text-ink-500">{c.basis}</p>
        </li>
      ))}
    </ul>
  )
}

type Party = 'Blood centre' | typeof BRAND.name | 'Hospital'

const MATRIX: { step: string; who: Party[] }[] = [
  { step: 'Donor selection and collection', who: ['Blood centre'] },
  { step: 'Infection screening, grouping and component preparation', who: ['Blood centre'] },
  { step: 'Storage in validated equipment', who: ['Blood centre'] },
  { step: 'Checking the requisition and issuing units', who: ['Blood centre'] },
  { step: 'Packing into a sealed, logged cold box', who: ['Blood centre', BRAND.name] },
  { step: 'Transport, live tracking and temperature monitoring', who: [BRAND.name] },
  { step: 'OTP handover at the transfusion desk', who: [BRAND.name, 'Hospital'] },
  { step: 'Cross-match, bedside check and transfusion', who: ['Hospital'] },
  { step: 'Pricing transparency, payments, refunds and grievances', who: [BRAND.name] },
]

const PARTY_STYLE: Record<string, string> = {
  'Blood centre': 'bg-blood-50 text-blood-700 ring-blood-100',
  [BRAND.name]: 'bg-ice-50 text-ice-700 ring-ice-100',
  Hospital: 'bg-ink-100 text-ink-800 ring-ink-200',
}

function ResponsibilityMatrix() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <ul className="divide-y divide-ink-100">
        {MATRIX.map((m, i) => (
          <li key={m.step} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <span className="flex gap-3 text-[15px] text-ink-900">
              <span className="w-5 shrink-0 font-semibold text-ink-300 tabular">{i + 1}</span>
              {m.step}
            </span>
            <span className="flex shrink-0 flex-wrap gap-1.5 pl-8 sm:pl-0">
              {m.who.map((w) => (
                <span key={w} className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', PARTY_STYLE[w])}>
                  {w}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const COMPLIANCE: LegalDoc = {
  key: 'compliance',
  title: 'Regulatory Compliance',
  tabLabel: 'Compliance',
  description: `How ${BRAND.name} fits into India's blood safety and consumer protection framework, in plain language.`,
  icon: Landmark,
  summary: [
    `${BRAND.name} is a logistics and coordination platform, not a blood bank.`,
    'Units come only from licensed blood centres and go only to registered hospitals, against a signed requisition.',
    'Users pay only capped processing charges plus a flat logistics fee. Blood is never sold.',
    'The hospital always performs the cross-match and bedside checks before transfusion.',
  ],
  intro: <ComplianceCards />,
  sections: [
    {
      title: 'Our role in the blood system',
      content: (
        <>
          <p>
            India's blood system rests on licensed blood centres, registered hospitals and voluntary donors. {BRAND.name} does not replace
            any of them. We make the journey between a licensed blood centre and a hospital's transfusion desk faster, more transparent and
            traceable. This matrix shows who is responsible for each step.
          </p>
          <ResponsibilityMatrix />
        </>
      ),
    },
    {
      title: 'Licensed blood centres',
      content: (
        <>
          <p>
            Blood centres in India must hold a licence under the Drugs and Cosmetics Act, 1940 and the Drugs and Cosmetics Rules, 1945,
            which set requirements for premises, equipment, staff, testing, storage and records. We onboard a blood centre only after
            checking its licence and its validity, and we recheck periodically.
          </p>
          <Callout>Demo mode: every centre shown in this prototype is fictional, and its licence number is marked "(demo)".</Callout>
        </>
      ),
    },
    {
      title: 'Processing charges only',
      content: (
        <>
          <p>
            Blood is not a commodity. National Blood Transfusion Council (NBTC) guidelines cap the processing charges blood centres may levy
            per unit, and a 2024 advisory from the Drugs Controller General of India reiterated that blood centres may charge only
            processing charges.
          </p>
          <List
            items={[
              'We show processing charges per unit, as set by the blood centre within those caps, and pass them on without mark-up.',
              'Our own fee is a flat, separately itemised cold-chain logistics fee, with GST shown separately.',
              'Charge caps can vary by component and may be revised. We will verify current caps, including any state-specific rules, before launch.',
            ]}
          />
        </>
      ),
    },
    {
      title: 'Prescriptions and where we deliver',
      content: (
        <List
          items={[
            "Blood is issued only against a requisition signed by a registered medical practitioner, verified by the blood centre's medical officer before issue.",
            'We deliver only to hospitals and nursing homes registered under the Clinical Establishments (Registration and Regulation) Act, 2010 or the equivalent state law, and only to their blood transfusion desk.',
            'We never deliver to homes, pharmacies or individuals, because transfusion must happen under medical supervision with compatibility testing.',
          ]}
        />
      ),
    },
    {
      title: 'Testing and quality',
      content: (
        <p>
          Every donated unit must be screened before release for HIV-1 and HIV-2, hepatitis B, hepatitis C, syphilis and malaria, and
          grouped for ABO and Rh. Many centres also use nucleic acid testing (NAT) where available. Testing and release are the blood
          centre's responsibility; we only carry units the centre has released, labelled and issued.
        </p>
      ),
    },
    {
      title: 'Cold chain and transport',
      content: (
        <>
          <p>
            Units travel in validated, pre-conditioned cold boxes with separate compartments for each temperature range, a tamper-evident
            seal and a temperature logger:
          </p>
          <List
            items={[
              `${COMPONENTS.PRBC.name} and ${COMPONENTS.WB.name.toLowerCase()}: ${COMPONENTS.PRBC.tempRange}`,
              `${COMPONENTS.PLT.name}: ${COMPONENTS.PLT.tempRange}`,
              `${COMPONENTS.FFP.name} and ${COMPONENTS.CRYO.name.toLowerCase()}: ${COMPONENTS.FFP.tempRange}`,
            ]}
          />
          <p>
            A unit with a broken seal or an out-of-range reading is not handed over for transfusion and goes back to the blood centre. See{' '}
            <DocLink to="/safety">Safety &amp; cold chain</DocLink> for the full journey.
          </p>
        </>
      ),
    },
    {
      title: 'Data protection',
      content: (
        <p>
          We follow the Digital Personal Data Protection Act, 2023: consent through clear notice, use limited to stated purposes, minimal
          health data, reasonable security safeguards, breach notification, and rights to access, correct and erase data with a grievance
          route. Until the DPDP Act fully replaces them, we also follow the Information Technology Act, 2000 and the SPDI Rules, 2011 for
          sensitive personal data such as health and financial information. Details are in our{' '}
          <DocLink to="/legal/privacy">Privacy Policy</DocLink>.
        </p>
      ),
    },
    {
      title: 'Consumer protection and payments',
      content: (
        <List
          items={[
            'Under the Consumer Protection (E-Commerce) Rules, 2020, we display who we are, a full price breakdown before payment, our cancellation and refund terms, and a Grievance Officer who acknowledges complaints within 48 hours and resolves them within one month.',
            'Payments are processed by an RBI-authorised payment aggregator. Under RBI rules we do not store card details; the gateway is PCI-DSS compliant.',
            'We do not use fake urgency, hidden charges or pre-ticked consents.',
          ]}
        />
      ),
    },
    {
      title: 'Donors',
      content: (
        <p>
          Paid (professional) blood donation is not permitted in India. We promote only voluntary, non-remunerated donation, and our
          eligibility pre-check follows the NBTC donor selection guidelines (2017), including age 18–65, a minimum weight of 45 kg and a gap
          of at least 90 days (men) or 120 days (women) between whole-blood donations. The blood centre's medical officer always makes the
          final decision.
        </p>
      ),
    },
    {
      title: 'Before launch',
      content: (
        <>
          <p>This prototype is not yet a live service. Before accepting real orders we will, at minimum:</p>
          <List
            items={[
              'have every policy reviewed and finalised by a qualified lawyer practising in India;',
              'verify licences, registrations and agreements with each blood centre and hospital partner;',
              'confirm current processing charge caps and GST treatment with regulators and tax advisers;',
              'appoint and publish the name of our Grievance Officer, and align with the DPDP Rules as notified;',
              'validate cold boxes and loggers, and put in place rider training and insurance.',
            ]}
          />
          <GrievanceCard />
        </>
      ),
    },
  ],
}
