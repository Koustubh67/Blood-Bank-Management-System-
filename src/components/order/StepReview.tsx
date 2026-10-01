import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, Clock, FileText, Hospital, Pencil, ReceiptText, Stethoscope, UserRound } from 'lucide-react'
import type { DeliveryPlan, OrderItem, PartnerHospital, PriceBreakdown } from '@/types'
import { COMPONENTS, PRIORITIES } from '@/data/blood'
import type { CentreMatch } from '@/services/orders'
import { Badge } from '@/components/ui/primitives'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { cn, formatDistance } from '@/lib/utils'
import { etaMinutes, formatBytes, unitsLabel, type Draft } from './draft'
import { Fact, NeverSoldNote, PriceLines } from './parts'

const GENDER_LABEL = { female: 'Female', male: 'Male', other: 'Other' } as const

export function StepReview({
  draft,
  hospital,
  items,
  price,
  best,
  plan,
  onEdit,
}: {
  draft: Draft
  hospital?: PartnerHospital
  items: OrderItem[]
  price: PriceBreakdown
  best?: CentreMatch
  plan: DeliveryPlan | null
  onEdit: (step: number) => void
}) {
  const p = draft.patient
  const priority = PRIORITIES[draft.priority]
  return (
    <div className="space-y-4">
      <ReviewSection index={0} title="Patient & hospital" icon={<UserRound className="size-4" />} onEdit={onEdit}>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Fact label="Deliver to" className="sm:col-span-2">
            <span className="flex items-start gap-2">
              <Hospital className="mt-0.5 size-4 shrink-0 text-ice-600" aria-hidden />
              <span>
                {hospital?.name ?? '—'}
                {hospital && <span className="block text-xs font-normal text-ink-500">Blood transfusion desk · {hospital.area}</span>}
              </span>
            </span>
          </Fact>
          <Fact label="Patient">
            {p.name}
            <span className="font-normal text-ink-500">
              {' '}
              · {p.age} y{p.gender ? ` · ${GENDER_LABEL[p.gender]}` : ''}
            </span>
          </Fact>
          <Fact label="Blood group">{p.bloodGroup ? <BloodGroupBadge group={p.bloodGroup} size="sm" /> : '—'}</Fact>
          {p.uhid && <Fact label="UHID / IP no.">{p.uhid}</Fact>}
          {p.ward && <Fact label="Ward / bed">{p.ward}</Fact>}
          {p.diagnosis && (
            <Fact label="Diagnosis / indication" className="sm:col-span-2">
              <span className="font-normal">{p.diagnosis}</span>
            </Fact>
          )}
        </dl>
      </ReviewSection>

      <ReviewSection index={1} title="Blood & urgency" icon={<Clock className="size-4" />} onEdit={onEdit}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={draft.priority === 'emergency' ? 'red' : draft.priority === 'urgent' ? 'amber' : 'neutral'}>{priority.label}</Badge>
          <span className="text-sm text-ink-500">Target {priority.targetMinutes} min from payment</span>
        </div>
        <ul className="mt-4 divide-y divide-ink-100 rounded-2xl border border-ink-100">
          {items.map((i) => (
            <li key={`${i.component}-${i.group}`} className="flex items-center gap-3 p-3">
              <BloodGroupBadge group={i.group} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink-950">{COMPONENTS[i.component].name}</span>
                <span className="block text-xs text-ink-500">
                  {COMPONENTS[i.component].tempRange} · {COMPONENTS[i.component].shelfLife.toLowerCase()}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-800 tabular">{unitsLabel(i.units)}</span>
            </li>
          ))}
        </ul>
        {best?.fulfillable && plan && (
          <div className="mt-4 flex flex-col gap-1 rounded-2xl bg-ice-50/70 p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-ink-700">
              From <span className="font-semibold text-ink-950">{best.centre.name}</span>
              <span className="text-ink-500 tabular"> · {formatDistance(best.distanceM)}</span>
            </span>
            <span className="font-semibold text-ice-700 tabular">Est. handover ~{etaMinutes(plan)} min</span>
          </div>
        )}
      </ReviewSection>

      <ReviewSection index={2} title="Prescription & consent" icon={<Stethoscope className="size-4" />} onEdit={onEdit}>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Fact label="Treating doctor">{draft.prescriber.doctorName}</Fact>
          <Fact label="Registration no.">{draft.prescriber.registrationNo}</Fact>
          <Fact label="Requisition form" className="sm:col-span-2">
            <span className="inline-flex max-w-full items-center gap-2 rounded-xl bg-ink-50 px-3 py-2">
              <FileText className="size-4 shrink-0 text-blood-600" aria-hidden />
              <span className="truncate">{draft.prescriber.fileName}</span>
              {draft.prescriber.fileSize > 0 && <span className="shrink-0 text-xs font-normal text-ink-500">{formatBytes(draft.prescriber.fileSize)}</span>}
            </span>
          </Fact>
          {draft.notes.trim() && (
            <Fact label="Notes for the centre" className="sm:col-span-2">
              <span className="font-normal whitespace-pre-line">{draft.notes.trim()}</span>
            </Fact>
          )}
        </dl>
        <ul className="mt-4 flex flex-wrap gap-2">
          {['Genuine signed requisition', 'Transfusion at hospital only', 'Terms & privacy accepted'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Check className="size-3.5" strokeWidth={3} aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </ReviewSection>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="rounded-3xl border border-ink-100 bg-white p-5 sm:p-6"
        aria-labelledby="review-charges"
      >
        <h3 id="review-charges" className="mb-4 flex items-center gap-2 font-sans text-base font-semibold">
          <ReceiptText className="size-4 text-ink-500" aria-hidden /> Charges
        </h3>
        <PriceLines items={items} price={price} />
        <NeverSoldNote className="mt-5" />
      </motion.section>
    </div>
  )
}

function ReviewSection({
  index,
  title,
  icon,
  onEdit,
  children,
}: {
  index: number
  title: string
  icon: ReactNode
  onEdit: (step: number) => void
  children: ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('rounded-3xl border border-ink-100 bg-white p-5 sm:p-6')}
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-sans text-base font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-ink-50 text-ink-600">{icon}</span>
          {title}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(index)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-blood-700 hover:bg-blood-50"
          aria-label={`Edit ${title}`}
        >
          <Pencil className="size-3.5" aria-hidden /> Edit
        </button>
      </div>
      {children}
    </motion.section>
  )
}
