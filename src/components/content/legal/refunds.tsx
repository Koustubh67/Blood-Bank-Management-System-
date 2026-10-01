import { CircleCheck, CircleX, ReceiptIndianRupee } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { BRAND } from '@/config/brand'
import { STATUS_LABEL } from '@/services/orders'
import { cn } from '@/lib/utils'
import { Callout, DocLink, GrievanceCard, List, Mailto, type LegalDoc } from './blocks'

const ROWS: { status: OrderStatus; cancel: boolean; outcome: string }[] = [
  { status: 'pending_payment', cancel: true, outcome: 'Nothing has been charged.' },
  { status: 'payment_failed', cancel: true, outcome: 'Any amount debited is reversed by your bank or the gateway.' },
  { status: 'placed', cancel: true, outcome: 'Full refund of everything you paid.' },
  { status: 'verified', cancel: true, outcome: 'Full refund of everything you paid.' },
  { status: 'packed', cancel: false, outcome: 'Call support. Units have left controlled storage.' },
  { status: 'dispatched', cancel: false, outcome: 'Call support. The box is on its way.' },
  { status: 'arriving', cancel: false, outcome: 'Call support. The box is at the hospital.' },
  { status: 'delivered', cancel: false, outcome: 'Units cannot be returned once handed over.' },
]

function StatusTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white text-[15px]">
      <div
        className="hidden grid-cols-[1.1fr_0.9fr_1.6fr] gap-4 bg-ink-50 px-5 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase sm:grid"
        aria-hidden
      >
        <span>Order status</span>
        <span>Cancel in app?</span>
        <span>What happens</span>
      </div>
      <ul className="divide-y divide-ink-100">
        {ROWS.map((r) => (
          <li key={r.status} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[1.1fr_0.9fr_1.6fr] sm:items-center sm:gap-4">
            <span className="font-semibold text-ink-950">{STATUS_LABEL[r.status]}</span>
            <span
              className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', r.cancel ? 'text-emerald-700' : 'text-blood-700')}
            >
              {r.cancel ? <CircleCheck className="size-4" aria-hidden /> : <CircleX className="size-4" aria-hidden />}
              {r.cancel ? 'Yes, free' : 'No'}
            </span>
            <span className="text-sm text-ink-600">{r.outcome}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const REFUNDS: LegalDoc = {
  key: 'refunds',
  title: 'Cancellation & Refund Policy',
  tabLabel: 'Refunds',
  description: 'When you can cancel an order, how much comes back, and how long it takes.',
  icon: ReceiptIndianRupee,
  summary: [
    'Cancel free of charge until the order is verified and before it is packed.',
    'Once packed or dispatched, orders cannot be cancelled in the app. Call support.',
    'Refunds go back to the original payment method within 5–7 working days.',
    'If we cancel, or a delivery fails because of us, you get a full refund.',
    'Units cannot be returned once handed over at the hospital, for safety reasons.',
  ],
  sections: [
    {
      title: 'Why cancellation has a cut-off',
      content: (
        <p>
          Until an order is packed, the units are still in the blood centre's validated storage and go straight back on the shelf if you
          cancel. Once they are issued and sealed into a cold box, they have left controlled storage, and the blood centre may not be able
          to reissue them. That is why the app stops accepting cancellations at the packing stage.
        </p>
      ),
    },
    {
      title: 'When you can cancel',
      content: (
        <>
          <p>This table shows each order status, as it appears in the app, and what cancelling means at that point.</p>
          <StatusTable />
        </>
      ),
    },
    {
      title: 'How to cancel',
      content: (
        <List
          ordered
          items={[
            <>
              Open <DocLink to="/orders">My orders</DocLink> and select the order.
            </>,
            'Tap "Cancel order" and tell us briefly why. This helps us improve.',
            'You will see the cancellation confirmed on screen straight away.',
            <>
              If the button is not shown, the order is already packed or on its way. Call us on {BRAND.supportPhone} and we will do what we
              safely can.
            </>,
          ]}
        />
      ),
    },
    {
      title: 'How much is refunded',
      content: (
        <List
          items={[
            <>
              <strong>Cancelled before packing:</strong> a full refund of processing charges, the logistics fee and GST.
            </>,
            <>
              <strong>Cancelled by us</strong> (for example, stock became unavailable, the requisition could not be verified or the hospital
              is not a partner): a full refund.
            </>,
            <>
              <strong>Delivery failed because of us</strong>, including a broken seal or a cold-chain excursion in our care: a full refund.
            </>,
            <>
              <strong>Stopped after packing at your request:</strong> handled case by case with the blood centre. We will explain any
              deduction in writing before processing it, and never charge more than the costs actually incurred.
            </>,
          ]}
        />
      ),
    },
    {
      title: 'Refund timelines and method',
      content: (
        <>
          <p>
            We start the refund as soon as the cancellation is confirmed. The money goes back to the original payment method, usually within
            5–7 working days. UPI refunds are often quicker; card and netbanking timelines depend on your bank.
          </p>
          <p>For hospital credit orders, we issue a credit note against the purchase-order number instead of a cash refund.</p>
        </>
      ),
    },
    {
      title: 'Failed or duplicate payments',
      content: (
        <p>
          If your account was debited but the payment shows as failed, or you were charged twice, the gateway normally reverses the extra
          amount automatically within 5–7 working days. If it has not arrived after that, write to <Mailto /> with your order ID and
          transaction reference and we will chase it for you.
        </p>
      ),
    },
    {
      title: 'Units cannot be returned',
      content: (
        <Callout tone="red" title="For patient safety">
          Once a unit has been handed over at the hospital's transfusion desk, it cannot be returned or re-issued to anyone else, because we
          can no longer guarantee how it was stored. Please check the order carefully before paying.
        </Callout>
      ),
    },
    {
      title: 'Questions and complaints',
      content: (
        <>
          <p>
            For anything about a cancellation or refund, contact us at <Mailto /> or {BRAND.supportPhone}. If you are not satisfied, our
            Grievance Officer will review it. See also our <DocLink to="/legal/terms">Terms of Service</DocLink>.
          </p>
          <GrievanceCard />
        </>
      ),
    },
  ],
}
