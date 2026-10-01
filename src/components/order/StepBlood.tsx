import { AnimatePresence, motion } from 'motion/react'
import {
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  Droplets,
  Phone,
  Plus,
  Siren,
  Thermometer,
  Timer,
  Trash,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import type { BloodCentre, BloodGroup, ComponentCode, DeliveryPlan, PartnerHospital, Priority } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, COMPONENT_CODES, PRIORITIES } from '@/data/blood'
import { BRAND } from '@/config/brand'
import type { CentreMatch } from '@/services/orders'
import { LiveDot, Select } from '@/components/ui/primitives'
import { cn, formatDistance, formatINR } from '@/lib/utils'
import { MAX_UNITS, PRIORITY_KEYS, etaMinutes, lineGroup, newLine, unitsLabel, type LineAvailability, type LineDraft } from './draft'
import { ChoiceCard, ComponentDot, Note, SubHeading, UnitStepper } from './parts'
import type { StepProps } from './StepPatient'

const PRIORITY_ICON: Record<Priority, typeof Siren> = { emergency: Siren, urgent: Zap, scheduled: CalendarClock }

export function StepBlood({
  draft,
  setDraft,
  errors,
  clearError,
  hospital,
  best,
  plan,
  lineStock,
}: StepProps & {
  hospital?: PartnerHospital
  centres: BloodCentre[]
  best?: CentreMatch
  plan: DeliveryPlan | null
  lineStock: Record<string, LineAvailability | undefined>
}) {
  const patientGroup = draft.patient.bloodGroup

  const setPriority = (p: Priority) => setDraft((d) => ({ ...d, priority: p }))

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }))
    clearError(`line.${key}.group`, `line.${key}.units`, `line.${key}.stock`, 'stock', 'lines')
  }

  const removeLine = (key: string) => {
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== key) }))
    clearError(`line.${key}.group`, `line.${key}.units`, `line.${key}.stock`, 'stock')
  }

  const addLine = () => {
    const used = new Set(draft.lines.map((l) => l.component))
    const next = COMPONENT_CODES.find((c) => !used.has(c)) ?? 'PRBC'
    setDraft((d) => ({ ...d, lines: [...d.lines, newLine({ component: next })] }))
    clearError('lines')
  }

  return (
    <div className="space-y-10">
      {/* ---------- Priority ---------- */}
      <section aria-labelledby="urgency-heading">
        <div id="urgency-heading">
          <SubHeading icon={<Timer className="size-4" />} title="How urgently is it needed?" hint="Emergency orders jump the queue at the nearest centre with stock." />
        </div>
        <div role="radiogroup" aria-label="Urgency" className="grid gap-3 sm:grid-cols-3">
          {PRIORITY_KEYS.map((p) => {
            const info = PRIORITIES[p]
            const Icon = PRIORITY_ICON[p]
            const on = draft.priority === p
            return (
              <ChoiceCard key={p} selected={on} onSelect={() => setPriority(p)} className="p-4">
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'grid size-10 place-items-center rounded-xl transition-colors',
                      on ? (p === 'emergency' ? 'bg-blood-600 text-white' : 'bg-ink-950 text-white') : 'bg-ink-50 text-ink-600',
                    )}
                  >
                    <Icon className={cn('size-5', on && p === 'emergency' && 'animate-heartbeat')} aria-hidden />
                  </span>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold tabular', on ? 'bg-white text-ink-950 shadow-soft' : 'bg-ink-50 text-ink-600')}>
                    Target {info.targetMinutes < 60 ? `${info.targetMinutes} min` : `${info.targetMinutes / 60} h`}
                  </span>
                </span>
                <span className="mt-3 block font-display text-lg font-bold text-ink-950">{info.label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-600">{info.hint}</span>
              </ChoiceCard>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Targets are measured from payment to handover at the hospital. They depend on distance, traffic and the centre's checks, and are not a guarantee.
        </p>
      </section>

      {/* ---------- Components ---------- */}
      <section aria-labelledby="components-heading">
        <div id="components-heading">
          <SubHeading
            icon={<Droplets className="size-4" />}
            title="What does the requisition ask for?"
            hint="Add one line per component. Charges are the capped processing charge per unit."
          />
        </div>

        <ul className="space-y-4">
          <AnimatePresence initial={false}>
            {draft.lines.map((line, idx) => (
              <motion.li
                key={line.key}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              >
                <LineCard
                  index={idx}
                  line={line}
                  group={lineGroup(line, draft)}
                  patientGroup={patientGroup}
                  stock={lineStock[line.key]}
                  errors={errors}
                  canRemove={draft.lines.length > 1}
                  onChange={(patch) => updateLine(line.key, patch)}
                  onRemove={() => removeLine(line.key)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {errors.lines && (
          <p className="mt-3 text-sm font-medium text-blood-700" role="alert">
            {errors.lines}
          </p>
        )}

        {draft.lines.length < COMPONENT_CODES.length + 1 && (
          <button
            type="button"
            onClick={addLine}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 py-3.5 text-sm font-semibold text-ink-700 transition hover:border-blood-300 hover:bg-blood-50/50 hover:text-blood-700"
          >
            <Plus className="size-4" aria-hidden /> Add another component
          </button>
        )}
      </section>

      {/* ---------- Matched centre ---------- */}
      <section aria-live="polite">
        {errors.stock && (
          <Note tone="amber" icon={<TriangleAlert />} title="Can't be supplied from one centre" className="mb-4" role="alert">
            {errors.stock} Or call our 24×7 desk on{' '}
            <a href={`tel:${BRAND.supportPhone}`} className="font-semibold underline underline-offset-2">
              {BRAND.supportPhone}
            </a>
            .
          </Note>
        )}
        {hospital && best?.fulfillable && plan ? (
          <MatchedCentre match={best} plan={plan} priority={draft.priority} />
        ) : null}
      </section>
    </div>
  )
}

// ---------- line card ----------

function LineCard({
  index,
  line,
  group,
  patientGroup,
  stock,
  errors,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number
  line: LineDraft
  group: BloodGroup | null
  patientGroup: BloodGroup | null
  stock?: LineAvailability
  errors: Record<string, string>
  canRemove: boolean
  onChange: (patch: Partial<LineDraft>) => void
  onRemove: () => void
}) {
  const info = COMPONENTS[line.component]
  const groupError = errors[`line.${line.key}.group`]
  const substituted = group && patientGroup && group !== patientGroup
  const selectId = `line-${line.key}-group`

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-white p-4 shadow-soft sm:p-5',
        groupError || errors[`line.${line.key}.stock`] ? 'border-blood-200' : 'border-ink-100',
      )}
      data-invalid={groupError ? 'true' : undefined}
      tabIndex={groupError ? -1 : undefined}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: info.tone }} />

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Component {index + 1}</p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="-mt-1.5 -mr-1.5 inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ink-500 hover:bg-blood-50 hover:text-blood-700"
            aria-label={`Remove component ${index + 1}`}
          >
            <Trash className="size-3.5" aria-hidden /> Remove
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label={`Component ${index + 1} type`} className="relative no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 mask-[linear-gradient(to_right,black_82%,transparent)] sm:flex-wrap sm:mask-none">
        {COMPONENT_CODES.map((c) => {
          const on = c === line.component
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ component: c as ComponentCode })}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all',
                on ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
              )}
            >
              <ComponentDot code={c} className={on ? 'ring-2 ring-white/40' : ''} />
              {COMPONENTS[c].short}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
        <span className="font-semibold text-ink-900">{info.name}</span>
        <span className="inline-flex items-center gap-1 text-ink-500">
          <Thermometer className="size-3.5" aria-hidden /> {info.tempRange}
        </span>
        <span className="text-ink-500">{info.usedFor}</span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3 sm:grid-cols-[minmax(0,15rem)_auto_1fr]">
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <label htmlFor={selectId} className="text-sm font-medium text-ink-800">
            Blood group
          </label>
          <Select
            id={selectId}
            value={line.group ?? ''}
            onChange={(e) => onChange({ group: (e.target.value || null) as BloodGroup | null })}
            aria-invalid={!!groupError || undefined}
          >
            <option value="">{patientGroup ? `Same as patient (${patientGroup})` : 'Choose group'}</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
                {g === patientGroup ? ' (patient)' : ''}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm font-medium text-ink-800" aria-hidden>
            Units
          </span>
          <UnitStepper value={line.units} onChange={(n) => onChange({ units: n })} max={MAX_UNITS} label={`Units of component ${index + 1}`} />
        </div>
        <div className="text-right sm:pb-2.5">
          <p className="text-xs text-ink-500 tabular">
            {line.units} × {formatINR(info.processingCharge)}
          </p>
          <p className="font-display text-lg font-bold text-ink-950 tabular">{formatINR(info.processingCharge * line.units)}</p>
        </div>
      </div>

      {groupError && (
        <p className="mt-2 text-xs font-medium text-blood-700" role="alert">
          {groupError}
        </p>
      )}
      {!groupError && substituted && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Compatible substitute for a {patientGroup} patient. Order only if the treating doctor approves substitution.
        </p>
      )}

      {stock && <Availability stock={stock} units={line.units} component={line.component} patientGroup={patientGroup} onChange={onChange} />}
    </div>
  )
}

function Availability({
  stock,
  units,
  component,
  patientGroup,
  onChange,
}: {
  stock: LineAvailability
  units: number
  component: ComponentCode
  patientGroup: BloodGroup | null
  onChange: (patch: Partial<LineDraft>) => void
}) {
  const short = COMPONENTS[component].short.toLowerCase()
  if (!stock.shortEverywhere && stock.nearest) {
    return (
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50/70 px-3.5 py-2.5 text-sm text-emerald-900">
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        <p>
          <span className="font-semibold">In stock.</span> Nearest with {unitsLabel(units)}: {stock.nearest.centre.name},{' '}
          <span className="tabular">{formatDistance(stock.nearest.distanceM)}</span>
          <span className="text-emerald-700"> · {stock.network} across network</span>
        </p>
      </div>
    )
  }
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-950" role="status">
      <p className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
        <span>
          <span className="font-semibold">
            {stock.maxAtOne === 0
              ? `No ${stock.group} ${short} at any centre right now.`
              : `Only ${unitsLabel(stock.maxAtOne)} of ${stock.group} ${short} at any single centre.`}
          </span>{' '}
          {stock.network > 0 && <span className="text-amber-800">({stock.network} across the network.)</span>}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6">
        {stock.maxAtOne > 0 && stock.maxAtOne < units && (
          <button
            type="button"
            onClick={() => onChange({ units: stock.maxAtOne })}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-soft hover:bg-ink-50"
          >
            Reduce to {unitsLabel(stock.maxAtOne)}
          </button>
        )}
        <a
          href={`tel:${BRAND.supportPhone}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        >
          <Phone className="size-3.5" aria-hidden /> Call desk {BRAND.supportPhone}
        </a>
      </div>
      {stock.substitutes.length > 0 && patientGroup && (
        <div className="mt-3 border-t border-amber-200/70 pt-3 pl-6">
          <p className="text-xs font-semibold text-amber-900">
            Compatible groups in stock for a {patientGroup} patient — use a substitute only if the treating doctor approves substitution:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stock.substitutes.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ group: g === patientGroup ? null : g })}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-ink-900 hover:border-amber-400"
                aria-label={g === patientGroup ? `Switch this line to the patient's own group ${g}` : `Switch this line to ${g} (doctor approval required)`}
              >
                <span className="font-display text-sm">{g}</span>
                <span className="font-medium text-ink-500">{g === patientGroup ? "Patient's group" : 'Use'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- matched centre + ETA ----------

function MatchedCentre({ match, plan, priority }: { match: CentreMatch; plan: DeliveryPlan; priority: Priority }) {
  const eta = etaMinutes(plan)
  const target = PRIORITIES[priority].targetMinutes
  const within = eta <= target
  const segs = [
    { label: 'Requisition check', ms: plan.verifyAt, cls: 'bg-ink-300' },
    { label: 'Pack & dispatch', ms: plan.dispatchAt - plan.verifyAt, cls: 'bg-ice-400' },
    { label: 'Ride', ms: plan.arriveAt - plan.dispatchAt, cls: 'bg-blood-500' },
    { label: 'Handover', ms: plan.deliverAt - plan.arriveAt, cls: 'bg-emerald-500' },
  ]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-ice-100 bg-linear-to-br from-ice-50 via-white to-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-ice-700 uppercase">
            <LiveDot color="bg-ice-500" className="size-2" /> Matched blood centre
          </p>
          <p className="mt-2 font-display text-xl leading-tight font-bold text-ink-950">{match.centre.name}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
            <span>{match.centre.area}</span>
            <span className="tabular">{formatDistance(match.distanceM)} away</span>
            <span className="inline-flex items-center gap-1 text-ink-500">
              <BadgeCheck className="size-3.5 text-ice-600" aria-hidden /> Licence {match.centre.licenseNo}
            </span>
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xs font-medium text-ink-500">Estimated handover</p>
          <p className="font-display text-4xl leading-none font-bold text-ink-950 tabular">
            ~{eta}
            <span className="ml-1 text-lg font-semibold text-ink-500">min</span>
          </p>
          <p className={cn('mt-1.5 text-xs font-semibold', within ? 'text-emerald-700' : 'text-amber-700')}>
            {within ? `Within the ${target}-min target` : `Target ${target} min · distance adds time`}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full" aria-hidden>
          {segs.map((s, i) => (
            <motion.span
              key={s.label}
              className={cn('h-full rounded-full', s.cls)}
              initial={{ flexGrow: 0 }}
              animate={{ flexGrow: s.ms }}
              transition={{ delay: 0.1 + i * 0.08, type: 'spring', damping: 30, stiffness: 200 }}
              style={{ flexBasis: 0 }}
            />
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-600 sm:grid-cols-4">
          {segs.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', s.cls)} aria-hidden />
              {s.label}
              <span className="text-ink-400 tabular">{Math.max(1, Math.round(s.ms / 60_000))}m</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
