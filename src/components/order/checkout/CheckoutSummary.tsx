import type { ReactNode } from 'react'
import { BadgeCheck, Hospital, LockKeyhole, Timer, UserRound } from 'lucide-react'
import type { BloodCentre, Order, PartnerHospital } from '@/types'
import { COMPONENTS, PRIORITIES } from '@/data/blood'
import { buildPlan } from '@/services/orders'
import { Badge } from '@/components/ui/primitives'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn, distanceMeters, formatDistance } from '@/lib/utils'
import { etaMinutes, unitsLabel } from '../draft'
import { NeverSoldNote, PriceLines } from '../parts'

export function CheckoutSummary({
  order,
  hospital,
  centre,
  className,
  showPrice = true,
}: {
  order: Order
  hospital?: PartnerHospital
  centre?: BloodCentre
  className?: string
  showPrice?: boolean
}) {
  const plan = order.plan ?? (centre && hospital ? buildPlan(order.priority, centre.location, hospital.location) : null)
  const priority = PRIORITIES[order.priority]
  return (
    <div className={cn('rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-500">Order</p>
          <p className="font-display text-xl font-bold tracking-wide text-ink-950">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="mt-5 space-y-2.5" aria-label="Items">
        {order.items.map((i) => (
          <li key={`${i.component}-${i.group}`} className="flex items-center gap-3 rounded-2xl bg-ink-50/70 p-2.5 pr-3.5">
            <BloodGroupBadge group={i.group} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-950">{COMPONENTS[i.component].name}</span>
              <span className="block text-xs text-ink-500">{COMPONENTS[i.component].tempRange}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink-700 tabular">{unitsLabel(i.units)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-3.5 text-sm">
        <SummaryRow label="Deliver to" icon={<Hospital className="mt-0.5 size-4 shrink-0 text-ice-600" aria-hidden />}>
          <span className="block font-semibold text-ink-950">{hospital?.name ?? 'Partner hospital'}</span>
          <span className="text-xs text-ink-500">Blood transfusion desk{hospital ? ` · ${hospital.area}` : ''}</span>
        </SummaryRow>
        {centre && (
          <SummaryRow label="Supplied by" icon={<BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />}>
            <span className="block font-semibold text-ink-950">{centre.name}</span>
            <span className="text-xs text-ink-500">
              Licence {centre.licenseNo}
              {hospital && <span className="tabular"> · {formatDistance(distanceMeters(centre.location, hospital.location))}</span>}
            </span>
          </SummaryRow>
        )}
        <SummaryRow label="Patient" icon={<UserRound className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />}>
          <span className="text-ink-700">
            {order.patient.name} · {order.patient.age} y · {order.patient.bloodGroup}
          </span>
        </SummaryRow>
        {plan && (
          <SummaryRow label="Estimated delivery" icon={<Timer className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />}>
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-ink-700">
                Est. handover <span className="font-semibold text-ink-950 tabular">~{etaMinutes(plan)} min</span> after payment
              </span>
              <Badge tone={order.priority === 'emergency' ? 'red' : order.priority === 'urgent' ? 'amber' : 'neutral'}>{priority.label}</Badge>
            </span>
          </SummaryRow>
        )}
      </dl>

      {showPrice && (
        <>
          <div className="mt-6 border-t border-ink-100 pt-5">
            <PriceLines items={order.items} price={order.price} />
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs text-ink-500">
            <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden />
            Secured by our payment gateway partner. We never see or store your full card number or CVV.
          </p>
          <NeverSoldNote className="mt-4" />
        </>
      )}
    </div>
  )
}

function SummaryRow({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="flex gap-3">
        {icon}
        <span className="min-w-0 flex-1">{children}</span>
      </dd>
    </div>
  )
}
