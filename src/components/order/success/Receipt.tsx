import type { ReactNode } from 'react'
import type { BloodCentre, Order, PartnerHospital, PaymentMethod, PaymentRecord } from '@/types'
import { PRIORITIES } from '@/data/blood'
import { BRAND, DEMO_MODE } from '@/config/brand'
import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { PriceLines } from '../parts'

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  credit: 'Hospital credit',
}

function fullDate(ts: number) {
  return new Date(ts).toLocaleString(BRAND.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Receipt card. Everything around it is hidden when printing
 * (`print:hidden` on siblings, header/footer/nav via global CSS),
 * so "Download receipt" -> window.print() gives a clean one-pager.
 */
export function Receipt({
  order,
  payment,
  hospital,
  centre,
  className,
}: {
  order: Order
  payment?: PaymentRecord
  hospital?: PartnerHospital
  centre?: BloodCentre
  className?: string
}) {
  return (
    <article
      aria-labelledby="receipt-title"
      className={cn(
        'rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8',
        'print:rounded-none print:border-0 print:p-0 print:shadow-none',
        className,
      )}
    >
      <style>{'@media print { @page { margin: 14mm; } }'}</style>

      <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-5">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-9 print:[print-color-adjust:exact]" />
          <div>
            <p className="font-display text-lg leading-none font-bold text-ink-950">{BRAND.name}</p>
            <p className="mt-1 text-xs text-ink-500">{BRAND.company}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 id="receipt-title" className="font-sans text-base font-semibold">
            Payment receipt
          </h2>
          <p className="mt-0.5 text-xs text-ink-500 tabular">{payment ? fullDate(payment.paidAt) : '—'}</p>
        </div>
      </div>

      {DEMO_MODE && (
        <p className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3.5 py-2 text-center text-xs font-semibold text-amber-900">
          Test-mode transaction · no real money was charged
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <ReceiptFact label="Order ID" mono>
          {order.id}
        </ReceiptFact>
        <ReceiptFact label="Status">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden /> Paid
          </span>
        </ReceiptFact>
        {payment && (
          <>
            <ReceiptFact label="Payment method">
              {METHOD_LABEL[payment.method]}
              <span className="block truncate text-xs font-normal text-ink-500">{payment.instrument}</span>
            </ReceiptFact>
            <ReceiptFact label="Priority">{PRIORITIES[order.priority].label}</ReceiptFact>
            <ReceiptFact label="Transaction ID" mono>
              {payment.transactionId}
            </ReceiptFact>
            <ReceiptFact label="Gateway reference" mono>
              {payment.gatewayRef}
            </ReceiptFact>
          </>
        )}
      </dl>

      <div className="mt-6 rounded-3xl bg-ink-50/70 p-4 sm:p-5 print:bg-transparent print:p-0">
        <PriceLines items={order.items} price={order.price} totalLabel="Total paid" />
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 print:grid-cols-2">
        <ReceiptFact label="Supplied by (licensed blood centre)">
          {centre?.name ?? order.centreId}
          {centre && (
            <span className="block text-xs font-normal text-ink-500">
              Licence {centre.licenseNo} · {centre.area}
            </span>
          )}
        </ReceiptFact>
        <ReceiptFact label="Delivered to">
          {hospital?.name ?? order.hospitalId}
          {hospital && (
            <span className="block text-xs font-normal text-ink-500">
              Transfusion desk · Reg. {hospital.registrationNo}
            </span>
          )}
        </ReceiptFact>
        <ReceiptFact label="Patient">
          {order.patient.name}
          <span className="block text-xs font-normal text-ink-500">
            {order.patient.age} y · {order.patient.bloodGroup}
            {order.patient.uhid ? ` · UHID ${order.patient.uhid}` : ''}
          </span>
        </ReceiptFact>
        <ReceiptFact label="Prescribed by">
          {order.prescriber.doctorName}
          <span className="block text-xs font-normal text-ink-500">Reg. {order.prescriber.registrationNo}</span>
        </ReceiptFact>
      </dl>

      <div className="mt-6 border-t border-dashed border-ink-200 pt-5 text-xs leading-relaxed text-ink-500">
        <p>
          <span className="font-semibold text-ink-700">Blood is not sold.</span> Charges are the per-unit processing charges levied by the
          licensed blood centre within government (NBTC) caps, plus a cold-chain logistics fee. GST applies to the logistics fee only.
        </p>
        <p className="mt-2">
          Computer-generated receipt; no signature required. Questions: {BRAND.supportPhone} · {BRAND.supportEmail}
        </p>
      </div>
    </article>
  )
}

function ReceiptFact({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className={cn('mt-0.5 font-medium wrap-break-word text-ink-900', mono && 'font-mono text-[13px] break-all')}>{children}</dd>
    </div>
  )
}
