import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BadgeCheck, Building2, ChevronRight, FileCheck, Receipt, User } from 'lucide-react'
import type { BloodCentre, Order, PartnerHospital } from '@/types'
import { COMPONENTS } from '@/data/blood'
import { formatDateTime, formatINR } from '@/lib/utils'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { Card } from '@/components/ui/primitives'
import { maskName, paidRecord } from './helpers'

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-3.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <div className="mt-0.5 text-sm text-ink-900">{children}</div>
      </div>
    </div>
  )
}

export function OrderDetailsCard({
  order,
  hospital,
  centre,
  isOwner,
}: {
  order: Order
  hospital?: PartnerHospital
  centre?: BloodCentre
  /** Payment instrument and receipt are shown only to the account that placed the order. */
  isOwner: boolean
}) {
  const payment = paidRecord(order)

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Order details</h2>
        <p className="text-xs text-ink-500 tabular">{order.id}</p>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {order.items.map((item, i) => (
          <li key={`${item.group}-${item.component}-${i}`} className="flex items-center gap-3 rounded-2xl bg-ink-50 p-2.5 pr-4">
            <BloodGroupBadge group={item.group} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-950">{COMPONENTS[item.component].name}</p>
              <p className="text-xs text-ink-500">{COMPONENTS[item.component].tempRange}</p>
            </div>
            <span className="font-display text-lg font-bold text-ink-950 tabular">×{item.units}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 divide-y divide-ink-100">
        <Row icon={<User className="size-4" aria-hidden />} label="Patient">
          <span className="font-medium">{maskName(order.patient.name)}</span>
          <span className="text-ink-500"> · {order.patient.bloodGroup}</span>
        </Row>
        {hospital && (
          <Row icon={<Building2 className="size-4" aria-hidden />} label="Deliver to · blood transfusion desk">
            <p className="font-medium">{hospital.name}</p>
            <p className="text-xs text-ink-500">
              {hospital.area} · Reg. {hospital.registrationNo}
            </p>
          </Row>
        )}
        {centre && (
          <Row icon={<BadgeCheck className="size-4" aria-hidden />} label="Issued by · licensed blood centre">
            <p className="font-medium">{centre.name}</p>
            <p className="text-xs text-ink-500">
              {centre.area} · Licence {centre.licenseNo}
            </p>
          </Row>
        )}
        <Row icon={<FileCheck className="size-4" aria-hidden />} label="Requisition">
          <p className="font-medium">Dr. {order.prescriber.doctorName.replace(/^dr\.?\s*/i, '')}</p>
          <p className="text-xs text-ink-500">Reg. {order.prescriber.registrationNo}</p>
        </Row>
        <Row icon={<Receipt className="size-4" aria-hidden />} label={payment ? 'Amount paid' : 'Order total'}>
          <p className="font-display text-lg font-bold text-ink-950 tabular">{formatINR(payment?.amount ?? order.price.total)}</p>
          <p className="text-xs text-ink-500">
            {payment ? (isOwner ? `${payment.instrument} · ${formatDateTime(payment.paidAt)}` : `Paid ${formatDateTime(payment.paidAt)}`) : 'Not paid'} ·
            Processing charges and logistics only. Blood is never sold.
          </p>
        </Row>
      </div>

      {isOwner && payment && (
        <Link
          to={`/order/${order.id}/success`}
          className="group mt-2 flex items-center justify-between rounded-2xl border border-ink-100 px-4 py-3 text-sm font-semibold text-ink-900 transition hover:border-ink-200 hover:bg-ink-50"
        >
          <span className="inline-flex items-center gap-2">
            <Receipt className="size-4 text-ink-500" aria-hidden /> View receipt
          </span>
          <ChevronRight className="size-4 text-ink-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </Card>
  )
}
