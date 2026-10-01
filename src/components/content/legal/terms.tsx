import { ScrollText } from 'lucide-react'
import { BRAND, FEES } from '@/config/brand'
import { formatINR } from '@/lib/utils'
import { Callout, DocLink, GrievanceCard, List, Mailto, type LegalDoc } from './blocks'

const gstPct = Math.round(FEES.logisticsGstRate * 100)

export const TERMS: LegalDoc = {
  key: 'terms',
  title: 'Terms of Service',
  tabLabel: 'Terms',
  description: `The agreement between you and ${BRAND.company} when you use ${BRAND.name} to order, track or receive blood components.`,
  icon: ScrollText,
  summary: [
    `${BRAND.name} arranges and transports blood; it is not a blood bank and does not give medical advice.`,
    'Blood is never sold. You pay NBTC-capped processing charges and a flat logistics fee, shown before you pay.',
    'We deliver only to registered partner hospitals, against a requisition signed by a registered doctor.',
    'Delivery times are targets, not guarantees. Safety checks are never skipped to meet them.',
    'Complaints go to our Grievance Officer, who acknowledges within 48 hours.',
  ],
  sections: [
    {
      title: 'About these terms',
      content: (
        <>
          <p>
            These Terms of Service ("Terms") govern your use of the {BRAND.name} website, apps and related services (together, the
            "Platform"), operated by {BRAND.company} ("{BRAND.name}", "we", "us"). By creating an account or placing an order, you agree to
            these Terms, our <DocLink to="/legal/privacy">Privacy Policy</DocLink> and our{' '}
            <DocLink to="/legal/refunds">Cancellation &amp; Refund Policy</DocLink>.
          </p>
          <p>
            You must be at least 18 years old and able to enter into a binding contract under Indian law. If you use the Platform for a
            hospital or nursing home, you confirm that you are authorised to act for that facility.
          </p>
        </>
      ),
    },
    {
      title: 'What we are, and what we are not',
      content: (
        <>
          <p>
            {BRAND.name} is a logistics and coordination platform. We connect requests from patients' families and hospitals with blood
            centres licensed under the Drugs and Cosmetics Act, 1940 and the Drugs and Cosmetics Rules, 1945, and we transport issued units
            to registered hospitals in validated cold boxes.
          </p>
          <List
            items={[
              'We do not collect, test, process, store or own blood. Those activities are carried out by licensed blood centres.',
              'We do not provide medical advice, diagnosis or treatment. Decisions about transfusion are made by the treating doctor.',
              'Compatibility testing (cross-matching) and the transfusion itself are carried out by the receiving hospital, under its own medical supervision.',
            ]}
          />
        </>
      ),
    },
    {
      title: 'Your account',
      content: (
        <>
          <p>
            You agree to give accurate, current information and to keep your password confidential. You are responsible for activity on your
            account. Tell us straight away at <Mailto /> if you suspect unauthorised use.
          </p>
          <p>
            Hospital accounts are activated for credit and other facility features only after we verify the facility's registration and the
            authorised signatory. We may refuse, suspend or close an account that we reasonably believe is inaccurate, misused or unsafe.
          </p>
        </>
      ),
    },
    {
      title: 'Placing an order',
      content: (
        <>
          <p>Every order must meet all of these conditions:</p>
          <List
            items={[
              'It is supported by a blood requisition form signed by a registered medical practitioner, uploaded with the order.',
              'Patient details match the requisition and the hospital record.',
              'Delivery is to the blood transfusion desk of a partner hospital or nursing home registered under applicable clinical establishment laws. We never deliver to homes or other addresses.',
              'The transfusion will take place at that facility under medical supervision.',
            ]}
          />
          <p>
            An order is accepted only when payment succeeds and the blood centre's medical officer has verified the requisition. The blood
            centre may decline to issue units for clinical, regulatory or stock reasons, in which case you receive a full refund. Orders are
            limited to 10 units per line in the app; larger requests are handled by our hospital desk.
          </p>
        </>
      ),
    },
    {
      title: 'Charges and payment',
      content: (
        <>
          <p>Blood is never sold on the Platform. The price you see before paying has up to three parts:</p>
          <List
            items={[
              <>
                <strong>Processing charges</strong> set by the licensed blood centre for each unit, within the limits in National Blood
                Transfusion Council (NBTC) guidelines and the 2024 advisory from the Drugs Controller General of India that blood centres
                may levy only processing charges. We pass these on without mark-up.
              </>,
              <>
                A flat <strong>cold-chain logistics fee</strong>, currently {formatINR(FEES.logistics)} per order, for transport, cold
                boxes, monitoring and handover.
              </>,
              <>
                <strong>GST</strong> at {gstPct}% on the logistics fee. The tax treatment of processing charges will be confirmed with a
                qualified tax adviser before launch.
              </>,
            ]}
          />
          <p>
            Payments are processed by an RBI-authorised payment aggregator. We do not store your full card details. Verified hospitals may
            be offered credit terms under a separate written agreement, which prevails over these Terms where they conflict.
          </p>
        </>
      ),
    },
    {
      title: 'Delivery, handover and the cold chain',
      content: (
        <>
          <p>
            Delivery times shown in the app, including our {BRAND.promiseMinutes}-minute dispatch target for emergency orders, are estimates
            based on stock, distance and traffic. They are not guarantees, and no safety step will be skipped to meet them.
          </p>
          <p>
            Units travel in sealed, validated cold boxes with temperature loggers. The box is handed over only at the hospital's blood
            transfusion desk, against the 4-digit handover OTP. Hospital staff should check the seal and logger reading before accepting.
            Responsibility for the units passes to the hospital once the OTP-verified handover is complete.
          </p>
          <Callout tone="ice" title="If the cold chain is broken">
            If a seal is broken or a logger shows a unit outside its safe temperature range, the unit will not be handed over for
            transfusion. It is returned to the blood centre, and you will not be charged for a failed delivery caused by us.
          </Callout>
        </>
      ),
    },
    {
      title: 'Cancellations and refunds',
      content: (
        <p>
          You can cancel free of charge until the order is verified and before it is packed. After that, orders cannot be cancelled in the
          app. Refunds are made to the original payment method, usually within 5–7 working days. Full details are in our{' '}
          <DocLink to="/legal/refunds">Cancellation &amp; Refund Policy</DocLink>.
        </p>
      ),
    },
    {
      title: 'Acceptable use',
      content: (
        <>
          <p>You must not:</p>
          <List
            items={[
              'upload a forged, altered or reused requisition, or impersonate a doctor, patient or hospital;',
              'resell, redirect or attempt to take possession of blood units outside a registered hospital;',
              'offer or request payment for blood donation, which is not permitted in India;',
              'harass, threaten or obstruct riders, blood centre staff or hospital staff;',
              'interfere with the Platform, probe its security, or scrape it by automated means.',
            ]}
          />
          <p>We may report misuse to the relevant authorities and cooperate with any investigation.</p>
        </>
      ),
    },
    {
      title: 'Medical disclaimer',
      content: (
        <Callout tone="red" title="In an emergency, call first">
          <p>
            Nothing on the Platform is medical advice. Educational content, such as the compatibility explainer, is for general information
            and does not replace a doctor or a laboratory cross-match. If someone's life is at risk, call {BRAND.emergencyPhone}{' '}
            immediately.
          </p>
        </Callout>
      ),
    },
    {
      title: 'Our responsibility to you',
      content: (
        <>
          <p>
            We will provide our services with reasonable care and skill, and in line with applicable law. To the extent permitted by law, we
            are not responsible for the clinical decisions or acts of independent blood centres, hospitals or doctors, or for delays caused
            by events beyond our reasonable control.
          </p>
          <p>
            Nothing in these Terms limits any liability that cannot be limited under Indian law, including your rights as a consumer under
            the Consumer Protection Act, 2019.
          </p>
        </>
      ),
    },
    {
      title: 'Intellectual property',
      content: (
        <p>
          The Platform, its design, software, text and the {BRAND.name} name and logo belong to {BRAND.company} or its licensors. You may
          use the Platform for its intended purpose only and may not copy or reuse its content without our written permission.
        </p>
      ),
    },
    {
      title: 'Suspension and termination',
      content: (
        <p>
          You may close your account at any time by writing to <Mailto />. We may suspend or close an account for breach of these Terms, for
          safety reasons or where required by law. Orders already in progress will be completed or refunded, and records we must keep by law
          will be retained as described in our Privacy Policy.
        </p>
      ),
    },
    {
      title: 'Changes to these terms',
      content: (
        <p>
          We may update these Terms as our service or the law changes. We will show the date of the latest version at the top of this page
          and tell you about material changes in the app or by email before they take effect. Orders placed before a change are governed by
          the Terms in force when they were placed.
        </p>
      ),
    },
    {
      title: 'Governing law and disputes',
      content: (
        <p>
          These Terms are governed by the laws of India. Please contact our Grievance Officer first so we can try to resolve any issue
          quickly. Subject to your statutory rights as a consumer, the courts at [city to be confirmed before launch] will have
          jurisdiction.
        </p>
      ),
    },
    {
      title: 'Grievance redressal and contact',
      content: (
        <>
          <p>
            If you have a complaint about an order, a charge, your data or these Terms, contact our Grievance Officer. Please include your
            order ID where relevant.
          </p>
          <GrievanceCard />
        </>
      ),
    },
  ],
}
