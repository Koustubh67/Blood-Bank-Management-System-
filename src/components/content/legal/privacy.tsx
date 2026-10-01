import { LockKeyhole } from 'lucide-react'
import { BRAND, DEMO_MODE } from '@/config/brand'
import { Callout, DocLink, GrievanceCard, List, Mailto, type LegalDoc } from './blocks'

export const PRIVACY: LegalDoc = {
  key: 'privacy',
  title: 'Privacy Policy',
  tabLabel: 'Privacy',
  description: `What personal and health data ${BRAND.name} collects, why, who sees it, and the rights you have over it.`,
  icon: LockKeyhole,
  summary: [
    'We collect only what is needed to fulfil a blood order safely and lawfully.',
    'Health details go only to the blood centre and hospital handling your order. Riders never see them.',
    'We never sell your data or use it for advertising.',
    'Card details are handled by a PCI-DSS compliant gateway and never stored by us.',
    'You can access, correct or erase your data, withdraw consent, and complain to our Grievance Officer.',
  ],
  sections: [
    {
      title: 'Who we are and what this covers',
      content: (
        <>
          <p>
            {BRAND.company} is the data fiduciary for personal data processed through the {BRAND.name} Platform. This policy explains how we
            handle that data under the Digital Personal Data Protection Act, 2023 ("DPDP Act") and, while they continue to apply, the
            Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive
            Personal Data or Information) Rules, 2011 ("SPDI Rules").
          </p>
          <p>
            It covers patients' families, hospital staff, donors and anyone else who uses the Platform. Blood centres and hospitals are
            separately responsible for the medical records they keep themselves.
          </p>
        </>
      ),
    },
    {
      title: 'The data we collect',
      content: (
        <List
          items={[
            <>
              <strong>Account details:</strong> name, mobile number, email, password (stored only as a secure hash) and, for hospitals, the
              facility and its registration number.
            </>,
            <>
              <strong>Order and health details:</strong> the patient's name, age, gender, blood group, ward and hospital ID (UHID), the
              components and units requested, the uploaded requisition form, and the prescribing doctor's name and registration number. A
              diagnosis field is optional.
            </>,
            <>
              <strong>Payment details:</strong> transaction and gateway references, amount, status and a masked instrument (for example, the
              last four digits of a card or a UPI ID). We never receive or store full card numbers or CVVs.
            </>,
            <>
              <strong>Donor details:</strong> name, phone, blood group, age, weight, last donation date, eligibility answers and the slot
              you book.
            </>,
            <>
              <strong>Delivery data:</strong> order status, rider location while a delivery is in progress, cold-box temperature readings
              and handover time.
            </>,
            <>
              <strong>Technical data:</strong> device and browser type, and logs needed to keep the Platform secure and working.
            </>,
          ]}
        />
      ),
    },
    {
      title: 'Why we use it',
      content: (
        <>
          <p>We use personal data only for the specific purposes it was collected for:</p>
          <List
            items={[
              'to verify, fulfil, deliver and track your order, and to support you if something goes wrong;',
              'to let the blood centre verify the requisition and the hospital prepare for handover;',
              'to take payments, issue invoices and process refunds;',
              'to investigate safety incidents and support haemovigilance by hospitals;',
              'to meet legal, tax and regulatory record-keeping obligations;',
              'to improve the service, using aggregated or de-identified data wherever possible.',
            ]}
          />
          <p>We do not sell personal data, and we do not use health data for advertising or profiling.</p>
        </>
      ),
    },
    {
      title: 'Consent and legitimate uses',
      content: (
        <>
          <p>
            We ask for your consent through a clear notice when you create an account or place an order. You can withdraw consent at any
            time by writing to <Mailto />; withdrawal does not affect processing already done, and we may be unable to fulfil an order in
            progress without the data it needs.
          </p>
          <p>
            The DPDP Act also allows processing without consent for certain legitimate uses, such as responding to a medical emergency that
            threatens someone's life or health, or complying with the law. We rely on these only where they genuinely apply.
          </p>
          <Callout title="Ordering for someone else">
            When you enter a patient's details on their behalf, you confirm that the patient (or their lawful guardian) has agreed, or that
            the patient cannot consent because of their medical condition and the order is for their treatment.
          </Callout>
        </>
      ),
    },
    {
      title: 'Who we share it with',
      content: (
        <>
          <List
            items={[
              <>
                <strong>The licensed blood centre</strong> fulfilling your order: patient, requisition and prescriber details, so its
                medical officer can verify the request.
              </>,
              <>
                <strong>The destination hospital</strong>: order, patient and delivery details, so its transfusion desk can receive and
                cross-match the units.
              </>,
              <>
                <strong>Riders</strong>: only the order ID, pickup and drop-off desks and the handover step. Riders never see diagnosis or
                requisition details.
              </>,
              <>
                <strong>Our payment gateway</strong>: what is needed to process a payment or refund.
              </>,
              <>
                <strong>Service providers</strong> such as cloud hosting and messaging, under contracts that limit them to our instructions.
              </>,
              <>
                <strong>Authorities</strong>, where the law requires it.
              </>,
            ]}
          />
        </>
      ),
    },
    {
      title: 'Health data minimisation',
      content: (
        <p>
          Health data is sensitive, so we minimise it by design. We ask only for what the requisition needs, keep diagnosis optional, mask
          health details wherever a screen does not need them, restrict staff access on a need-to-know basis, and log who accessed what.
        </p>
      ),
    },
    {
      title: 'Payment data',
      content: (
        <p>
          Card, UPI and netbanking payments are processed by an RBI-authorised payment aggregator that is compliant with the Payment Card
          Industry Data Security Standard (PCI-DSS). In line with RBI rules, we do not store full card details. We keep only the references
          we need to reconcile payments and issue refunds.
        </p>
      ),
    },
    {
      title: 'How we protect it',
      content: (
        <>
          <p>
            We use reasonable security safeguards, including encryption in transit, access controls, audit logs, secure development
            practices and regular reviews, consistent with the practices expected under the SPDI Rules and the DPDP Act.
          </p>
          <p>
            If a personal data breach occurs, we will notify the Data Protection Board of India and affected users as the law requires, and
            tell you what we are doing about it.
          </p>
        </>
      ),
    },
    {
      title: 'How long we keep it',
      content: (
        <p>
          We keep personal data only as long as needed for the purposes above, or as long as the law requires us to keep records (for
          example, for tax, payment and blood-safety traceability purposes). After that, we delete it or anonymise it so that it can no
          longer identify you. Exact retention periods will be confirmed with legal counsel before launch.
        </p>
      ),
    },
    {
      title: 'Your rights',
      content: (
        <>
          <p>Under the DPDP Act you can:</p>
          <List
            items={[
              'get a summary of the personal data we hold about you and how we process it;',
              'ask us to correct, complete or update inaccurate or incomplete data;',
              'ask us to erase data we no longer need, unless the law requires us to keep it;',
              'withdraw consent you have given;',
              'have your grievance addressed by our Grievance Officer;',
              'nominate someone to exercise these rights for you in the event of death or incapacity.',
            ]}
          />
          <p>
            To use any of these rights, write to <Mailto /> from your registered email. We may need to verify your identity before acting.
          </p>
        </>
      ),
    },
    {
      title: "Children's data",
      content: (
        <p>
          Accounts are for adults only. Where a patient is under 18, a parent or lawful guardian provides the patient's details and consents
          on their behalf. We do not track or target children, or use their data for advertising.
        </p>
      ),
    },
    {
      title: 'Cookies and local storage',
      content: (
        <p>
          We use only the cookies and browser storage needed to keep you signed in and remember preferences. We do not use advertising
          trackers.
          {DEMO_MODE &&
            ' In this prototype, all demo accounts, orders and stock are stored only in your own browser and can be cleared with "Reset demo".'}
        </p>
      ),
    },
    {
      title: 'Where your data is stored',
      content: (
        <p>
          We aim to store personal data in India. Any transfer outside India will happen only as permitted under the DPDP Act and any
          restrictions notified by the Government.
        </p>
      ),
    },
    {
      title: 'Changes to this policy',
      content: (
        <p>
          We will update this policy when our practices or the law change, show the latest date at the top of this page, and tell you about
          material changes before they take effect. See also our <DocLink to="/legal/terms">Terms of Service</DocLink>.
        </p>
      ),
    },
    {
      title: 'Grievances and the Data Protection Board',
      content: (
        <>
          <p>
            Please contact our Grievance Officer first with any privacy concern. If you are not satisfied with our response, you may
            approach the Data Protection Board of India in the manner the law provides.
          </p>
          <GrievanceCard />
        </>
      ),
    },
  ],
}
