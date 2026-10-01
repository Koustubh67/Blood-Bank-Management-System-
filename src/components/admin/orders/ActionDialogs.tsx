import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BadgeCheck, Bike, FileText, KeyRound, PhoneCall, Zap } from 'lucide-react'
import type { Priority } from '@/types'
import type { OpsOrder } from '@/services/admin/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { COMPONENTS } from '@/data/blood'
import { playSound } from '@/lib/sound'
import { cn, formatDistance, formatINR } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { useOps } from '@/services/admin/store'
import { useRiderViews } from '@/services/admin/hooks'
import { riderOptions } from '@/services/admin/dispatch'
import { shortStoreName, storeById } from '@/services/admin/stores'
import { PRIORITY_LABEL, PRIORITY_ORDER } from '@/services/admin/priority'
import {
  approveRequisition,
  assignRider,
  callInOffShift,
  cancelOpsOrder,
  changePriority,
  confirmDelivery,
  rejectRequisition,
  setSurge,
} from '@/services/admin/actions'
import { hospitalName } from '@/services/admin/store'
import { Avatar, PriorityPill, RiderStateChip } from '../ui'
import { closeAction, useOrderById, useOrderUi } from './state'

function done(title: string, description?: string) {
  playSound('tap')
  toast.success(title, description)
  closeAction()
}

function ItemsList({ order }: { order: OpsOrder }) {
  return (
    <ul className="flex flex-col gap-2">
      {order.items.map((i, n) => (
        <li key={n} className="flex items-center gap-3 rounded-2xl bg-ink-50 px-3 py-2">
          <BloodGroupBadge group={i.group} size="sm" />
          <span className="min-w-0 flex-1 text-sm font-medium text-ink-900">{COMPONENTS[i.component].name}</span>
          <span className="text-sm font-semibold text-ink-950 tabular">× {i.units}</span>
        </li>
      ))}
    </ul>
  )
}

// ---------- verify ----------

const REJECT_PRESETS = [
  'Requisition unsigned by the treating doctor',
  'Doctor registration number missing or invalid',
  'Patient details do not match the sample label',
  'Requested group does not match the cross-match report',
]

function VerifyDialog({ order }: { order: OpsOrder }) {
  const [checks, setChecks] = useState([false, false, false])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState(REJECT_PRESETS[0])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const all = checks.every(Boolean)
  const labels = [
    `Signed by ${order.doctor} with registration no. ${order.doctorReg}`,
    `Patient ${order.patient}${order.ward ? `, ${order.ward}` : ''} matches the sample label`,
    'Group and component requested match the cross-match',
  ]
  const approve = () => {
    const r = approveRequisition(order.id)
    if (!r.ok) return setError(r.error)
    done('Requisition approved', `${order.id} moves to packing.`)
  }
  const reject = (e: FormEvent) => {
    e.preventDefault()
    const full = note.trim() ? `${reason}. ${note.trim()}` : reason
    const r = rejectRequisition(order.id, full)
    if (!r.ok) return setError(r.error)
    done('Order rejected', 'The hospital is told why, and a full refund is started.')
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
        <PriorityPill priority={order.priority} />
        <span className="font-mono text-xs">{order.id}</span>
        <span>· {hospitalName(order)}</span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 text-sm">
        <span className="grid size-10 place-items-center rounded-xl bg-blood-50 text-blood-600">
          <FileText className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink-950">{order.requisition}</span>
          <span className="block text-xs text-ink-500">Scanned requisition · simulated file</span>
        </span>
      </div>
      <ItemsList order={order} />
      {!rejecting ? (
        <>
          <fieldset className="flex flex-col gap-2.5 rounded-2xl border border-ink-100 p-4">
            <legend className="px-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">Checks before approval</legend>
            {labels.map((l, i) => (
              <Checkbox key={l} checked={checks[i]} onChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? v : x)))}>
                {l}
              </Checkbox>
            ))}
          </fieldset>
          {error && <p className="text-sm font-medium text-blood-700" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRejecting(true)}>
              Reject…
            </Button>
            <Button variant="dark" disabled={!all} onClick={approve} icon={<BadgeCheck className="size-4" />}>
              Approve requisition
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={reject} className="flex flex-col gap-3">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink-800">Reason</legend>
            {REJECT_PRESETS.map((p) => (
              <label key={p} className={cn('flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2.5 text-sm', reason === p ? 'border-blood-300 bg-blood-50/50' : 'border-ink-200')}>
                <input type="radio" name="reason" className="mt-0.5 accent-blood-600" checked={reason === p} onChange={() => setReason(p)} />
                {p}
              </label>
            ))}
          </fieldset>
          <Field label="Note to the hospital (optional)">{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />}</Field>
          {error && <p className="text-sm font-medium text-blood-700" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Back
            </Button>
            <Button type="submit">Reject and refund {formatINR(order.price.total)}</Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ---------- assign ----------

function AssignDialog({ order }: { order: OpsOrder }) {
  const now = useNow(2000)
  const surge = useOps((s) => s.surge)
  const scope = useOps((s) => s.cityId)
  const views = useRiderViews(now)
  const [wide, setWide] = useState(surge)
  const options = useMemo(() => riderOptions(order, views, wide), [order, views, wide])
  const [pick, setPick] = useState<string | null>(null)
  const selected = pick && options.some((o) => o.view.rider.id === pick) ? pick : (options[0]?.view.rider.id ?? null)
  const store = storeById(order.storeId)
  const offShift = views.filter((v) => v.state === 'off_shift' && v.store.id === order.storeId).length

  const confirm = () => {
    if (!selected) return
    const r = assignRider(order.id, selected)
    if (!r.ok) return toast.error('Could not assign', r.error)
    const opt = options.find((o) => o.view.rider.id === selected)
    done('Rider assigned', `${opt?.view.rider.name} will collect ${order.id}${opt?.borrowed ? ` from ${shortStoreName(store)}` : ''}.`)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">
        <span className="font-mono text-xs">{order.id}</span> · packed at <span className="font-medium text-ink-900">{shortStoreName(store)}</span> for {hospitalName(order)}
      </p>
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-3 text-sm">
        <span>
          <span className="font-semibold text-ink-900">Include riders from other stores</span>
          <span className="block text-xs text-ink-500">{surge ? 'Surge mode is on' : 'Normally used in Surge mode'}</span>
        </span>
        <input type="checkbox" className="size-5 accent-ink-950" checked={wide} onChange={(e) => setWide(e.target.checked)} />
      </label>

      {options.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 p-5 text-center">
          <p className="font-semibold text-ink-900">No free rider {wide ? 'in this city' : 'at this store'} right now</p>
          <p className="mt-1 text-sm text-ink-500">The order stays queued as &ldquo;waiting for rider&rdquo; and is picked up as soon as someone is back.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!wide && (
              <Button size="sm" variant="outline" onClick={() => setWide(true)}>
                Look across stores
              </Button>
            )}
            {!surge && (
              <Button size="sm" variant="outline" icon={<Zap className="size-4" />} onClick={() => (setSurge(true), setWide(true))}>
                Turn on Surge mode
              </Button>
            )}
            {offShift > 0 && (
              <Button size="sm" variant="dark" icon={<PhoneCall className="size-4" />} onClick={() => toast.success(`${callInOffShift(scope === 'all' ? order.cityId : scope)} riders called in`)}>
                Call in off-shift riders
              </Button>
            )}
          </div>
        </div>
      ) : (
        <fieldset>
          <legend className="sr-only">Choose a rider</legend>
          <ul className="flex max-h-[45dvh] flex-col gap-2 overflow-y-auto pr-1">
            {options.map((o, i) => {
              const r = o.view.rider
              const active = selected === r.id
              return (
                <li key={r.id}>
                  <label className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition', active ? 'border-ink-900 bg-white ring-4 ring-ink-100' : 'border-ink-200 bg-white hover:border-ink-300')}>
                    <input type="radio" name="rider" className="sr-only" checked={active} onChange={() => setPick(r.id)} />
                    <Avatar name={r.name} tone={o.borrowed ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink-950">{r.name}</span>
                        {i === 0 && <span className="rounded-md bg-ink-950 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Suggested</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-500">
                        {o.borrowed ? `${shortStoreName(o.view.store)} · ${formatDistance(o.distanceM)} away` : 'At this store'} · {r.vehicleReg} · {o.view.todayCount} today · ★ {r.rating?.toFixed(2)}
                      </span>
                    </span>
                    <RiderStateChip state={o.view.state} className="hidden sm:inline-flex" />
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={closeAction}>
          Not now
        </Button>
        <Button variant="dark" disabled={!selected} onClick={confirm} icon={<Bike className="size-4" />}>
          Assign rider
        </Button>
      </div>
    </div>
  )
}

// ---------- deliver ----------

function DeliverDialog({ order }: { order: OpsOrder }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = confirmDelivery(order.id, otp)
    if (!r.ok) return setError(r.error)
    playSound('order')
    done('Delivered', `${order.id} handed over at ${hospitalName(order)}.`)
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">The hospital&rsquo;s blood bank desk reads out its 4-digit code when the rider hands over the sealed box.</p>
      <Field label="Handover code" error={error} hint="Prototype: the hospital's code for this order is shown below.">
        {(id) => (
          <Input
            id={id}
            value={otp}
            onChange={(e) => (setOtp(e.target.value.replace(/\D/g, '').slice(0, 4)), setError(null))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{4}"
            maxLength={4}
            placeholder="••••"
            className="text-center font-mono text-2xl tracking-[0.5em]"
            aria-invalid={!!error}
            autoFocus
          />
        )}
      </Field>
      <p className="flex items-center gap-2 rounded-2xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
        <KeyRound className="size-4 text-ink-400" aria-hidden /> Demo code: <span className="font-mono font-semibold text-ink-900">{order.otp}</span>
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={closeAction}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" disabled={otp.length !== 4}>
          Confirm handover
        </Button>
      </div>
    </form>
  )
}

// ---------- priority ----------

const PRIORITY_REASONS = ['Patient deteriorating', 'Surgery brought forward', 'Doctor confirmed it can wait', 'Duplicate of an emergency already sent']

function PriorityDialog({ order }: { order: OpsOrder }) {
  const others = PRIORITY_ORDER.filter((p) => p !== order.priority)
  const [priority, setPriority] = useState<Priority>(others[0])
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = changePriority(order.id, priority, reason)
    if (!r.ok) return setError(r.error)
    done(`Priority set to ${PRIORITY_LABEL[priority].toLowerCase()}`, 'Recorded in the audit log.')
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">
        Now <PriorityPill priority={order.priority} className="mx-1" /> · {order.id}
      </p>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-2 text-sm font-medium text-ink-800">New priority</legend>
        {others.map((p) => (
          <label key={p} className={cn('flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold', priority === p ? 'border-ink-900 ring-4 ring-ink-100' : 'border-ink-200')}>
            <input type="radio" name="priority" className="accent-ink-950" checked={priority === p} onChange={() => setPriority(p)} />
            {PRIORITY_LABEL[p]}
          </label>
        ))}
      </fieldset>
      <Field label="Reason" required error={error} hint="Kept in the order's audit log with your name.">
        {(id) => <Textarea id={id} value={reason} onChange={(e) => (setReason(e.target.value), setError(null))} maxLength={200} aria-invalid={!!error} />}
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {PRIORITY_REASONS.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-700 hover:border-ink-300 hover:bg-ink-50">
            {r}
          </button>
        ))}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={closeAction}>
          Cancel
        </Button>
        <Button type="submit" variant="dark">
          Change priority
        </Button>
      </div>
    </form>
  )
}

// ---------- cancel ----------

function CancelDialog({ order }: { order: OpsOrder }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = cancelOpsOrder(order.id, reason)
    if (!r.ok) return setError(r.error)
    done('Order cancelled', `Full refund of ${formatINR(order.price.total)} started.`)
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">
        Units go back to the shelf and the hospital is refunded {formatINR(order.price.total)} in full. Riders already assigned are freed.
      </p>
      <Field label="Reason" required error={error}>
        {(id) => <Textarea id={id} value={reason} onChange={(e) => (setReason(e.target.value), setError(null))} maxLength={200} placeholder="e.g. Hospital called: patient transferred" aria-invalid={!!error} />}
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={closeAction}>
          Keep order
        </Button>
        <Button type="submit">Cancel order</Button>
      </div>
    </form>
  )
}

const TITLES = {
  verify: 'Verify requisition',
  assign: 'Assign rider',
  deliver: 'Confirm handover',
  priority: 'Escalate or de-escalate',
  cancel: 'Cancel order',
} as const

/** Renders whichever action dialog is open. Mounted once in the admin layout. */
export function ActionDialogs() {
  const action = useOrderUi((s) => s.action)
  const now = useNow(5000)
  const order = useOrderById(action?.orderId, now)
  // The order closed underneath the dialog (Autopilot, another action): close it.
  useEffect(() => {
    if (action && !order) closeAction()
  }, [action, order])
  const open = !!action && !!order
  return (
    <Modal open={open} onClose={closeAction} title={action ? TITLES[action.kind] : undefined} className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
      {action && order && (
        <div key={`${action.kind}:${order.id}`}>
          {action.kind === 'verify' && <VerifyDialog order={order} />}
          {action.kind === 'assign' && <AssignDialog order={order} />}
          {action.kind === 'deliver' && <DeliverDialog order={order} />}
          {action.kind === 'priority' && <PriorityDialog order={order} />}
          {action.kind === 'cancel' && <CancelDialog order={order} />}
        </div>
      )}
    </Modal>
  )
}

