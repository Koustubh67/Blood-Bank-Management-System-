import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronUp, Hospital, TriangleAlert, UserRound } from 'lucide-react'
import type { DeliveryPlan, OrderItem, PartnerHospital, PriceBreakdown, Priority } from '@/types'
import { COMPONENTS, PRIORITIES } from '@/data/blood'
import type { CentreMatch } from '@/services/orders'
import { Badge, LiveDot } from '@/components/ui/primitives'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { cn, formatDistance, formatINR } from '@/lib/utils'
import { etaMinutes, totalUnitsOf, unitsLabel, type Draft } from './draft'
import { NeverSoldNote, PriceLines } from './parts'

export interface SummaryData {
  draft: Draft
  hospital?: PartnerHospital
  items: OrderItem[]
  price: PriceBreakdown
  best?: CentreMatch
  plan: DeliveryPlan | null
}

const PRIORITY_TONE: Record<Priority, 'red' | 'amber' | 'neutral'> = { emergency: 'red', urgent: 'amber', scheduled: 'neutral' }

function SummaryBody({ draft, hospital, items, price, best, plan }: SummaryData) {
  const p = draft.patient
  return (
    <div className="space-y-5">
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-ice-50 text-ice-700">
            <Hospital className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            {hospital ? (
              <>
                <p className="font-semibold leading-snug text-ink-950">{hospital.name}</p>
                <p className="text-xs text-ink-500">Transfusion desk · {hospital.area}</p>
              </>
            ) : (
              <p className="pt-1.5 text-ink-400">Hospital not chosen yet</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-600">
            <UserRound className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pt-1">
            {p.name.trim() ? (
              <p className="truncate font-semibold text-ink-950">
                {p.name.trim()}
                {p.age && <span className="font-normal text-ink-500"> · {p.age} y</span>}
              </p>
            ) : (
              <p className="text-ink-400">Patient details pending</p>
            )}
            {p.bloodGroup && <BloodGroupBadge group={p.bloodGroup} size="sm" />}
          </div>
        </div>
      </div>

      <div className="border-t border-ink-100 pt-4">
        <ul className="space-y-2.5" aria-label="Items">
          {items.map((i) => (
            <li key={`${i.component}-${i.group}`} className="flex items-center gap-2.5 text-sm">
              <span className="grid h-7 min-w-9 place-items-center rounded-lg bg-blood-50 px-1.5 font-display text-xs font-bold text-blood-700">{i.group}</span>
              <span className="min-w-0 flex-1 truncate text-ink-800">{COMPONENTS[i.component].short}</span>
              <span className="shrink-0 text-ink-500 tabular">× {i.units}</span>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-ink-400">No components added yet</li>}
        </ul>
      </div>

      <EtaBlock hospital={hospital} items={items} best={best} plan={plan} priority={draft.priority} />

      <div className="border-t border-ink-100 pt-4">
        <PriceLines items={items} price={price} showItems={false} compact />
      </div>
      <NeverSoldNote />
    </div>
  )
}

function EtaBlock({
  hospital,
  items,
  best,
  plan,
  priority,
}: {
  hospital?: PartnerHospital
  items: OrderItem[]
  best?: CentreMatch
  plan: DeliveryPlan | null
  priority: Priority
}) {
  if (!hospital || items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 p-3.5 text-xs text-ink-500">
        Estimated delivery appears once the hospital and blood group are set.
      </div>
    )
  if (!best?.fulfillable || !plan)
    return (
      <div className="flex gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-xs text-amber-900">
        <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden />
        No single centre has all these units right now. Adjust the order or call our desk.
      </div>
    )
  const eta = etaMinutes(plan)
  return (
    <div className="rounded-2xl bg-linear-to-br from-ice-50 to-white p-4 ring-1 ring-ice-100">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-ice-700">
          <LiveDot color="bg-ice-500" className="size-2" /> Estimated handover
        </p>
        <p className="text-xs text-ink-500">Target {PRIORITIES[priority].targetMinutes} min</p>
      </div>
      <p className="mt-1 font-display text-3xl font-bold text-ink-950 tabular">
        <motion.span key={eta} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
          ~{eta}
        </motion.span>
        <span className="ml-1 text-base font-semibold text-ink-500">min</span>
      </p>
      <p className="mt-1 truncate text-xs text-ink-600">
        from {best.centre.name} · <span className="tabular">{formatDistance(best.distanceM)}</span>
      </p>
    </div>
  )
}

export function OrderSummaryCard(props: SummaryData) {
  return (
    <div className="rounded-4xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-sans text-lg font-semibold">Order summary</h2>
        <Badge tone={PRIORITY_TONE[props.draft.priority]}>{PRIORITIES[props.draft.priority].label}</Badge>
      </div>
      <SummaryBody {...props} />
    </div>
  )
}

/** Mobile: sticky bottom bar with total + ETA that expands into the full summary. */
export function MobileOrderBar({ cta, ...props }: SummaryData & { cta: ReactNode }) {
  const [open, setOpen] = useState(false)
  const units = totalUnitsOf(props.items)
  const eta = props.best?.fulfillable && props.plan ? etaMinutes(props.plan) : null
  return (
    <div className="sticky bottom-0 z-400 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close summary"
            className="fixed inset-0 -z-10 bg-ink-950/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className="rounded-t-4xl border-t border-ink-100 bg-white shadow-[0_-12px_32px_-16px_rgb(15_12_11/0.25)]">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-summary"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="overflow-hidden"
            >
              <div className="max-h-[62dvh] overflow-y-auto px-4 pt-5 pb-2 sm:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-ink-950">Order summary</p>
                  <Badge tone={PRIORITY_TONE[props.draft.priority]}>{PRIORITIES[props.draft.priority].label}</Badge>
                </div>
                <SummaryBody {...props} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="container-page flex items-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-summary"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl py-1 text-left"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-50 text-ink-700">
              <ChevronUp className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-tight font-bold text-ink-950 tabular">{formatINR(props.price.total)}</span>
              <span className="block truncate text-xs text-ink-500">
                {units ? unitsLabel(units) : 'No units yet'}
                {eta ? ` · ~${eta} min` : ''}
                <span className="sr-only"> — {open ? 'hide' : 'show'} order summary</span>
              </span>
            </span>
          </button>
          {cta}
        </div>
      </div>
    </div>
  )
}
