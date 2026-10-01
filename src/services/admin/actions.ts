import type { Priority } from '@/types'
import type { CityScope, OpsActivity, OpsOrder, OpsStage, StaffMember, StaffStatus } from './types'
import { hospitalById } from '@/data/network'
import { cityById } from '@/data/cities'
import { rideMinutes } from '@/services/orders'
import { uid } from '@/lib/utils'
import { ALL_INDIA, shortStoreName, storeById } from './stores'
import { MAX_ACTIVITY, activity, actorName, currentStaff, describeItems, hospitalName, useOps, type OpsState } from './store'
import { isDeferred, isPreDispatch, PRIORITY_LABEL, STAGE_LABEL } from './priority'
import { planAssignments, riderViews } from './dispatch'
import { MANUAL_HOLD_MS, MIN_MS, PICKUP_MS, RETURN_FACTOR } from './time'
import { shortName } from './names'
import { ROLE_LABEL } from './staffSeed'

/**
 * Commands the panel can run. Each one is a plain function over the ops
 * store, so a real dispatch API can replace this file without touching pages.
 */

type Result = { ok: true } | { ok: false; error: string }
const fail = (error: string): Result => ({ ok: false, error })
const OK: Result = { ok: true }

function pushActivity(list: OpsActivity[], ...items: OpsActivity[]) {
  return [...items, ...list].slice(0, MAX_ACTIVITY)
}

/**
 * Applies `fn` to one ops order as an admin action: stamps the audit trail,
 * holds Autopilot off it for a few minutes and logs activity.
 */
function act(id: string, fn: (o: OpsOrder, now: number) => { order: OpsOrder; log?: OpsActivity; extra?: Partial<OpsState> } | string): Result {
  const now = Date.now()
  const state = useOps.getState()
  const o = state.orders.find((x) => x.id === id)
  if (!o) return fail('This order is no longer on the board.')
  if (o.source === 'app') return fail('Orders placed in the app run on their own tracking timeline.')
  const res = fn(o, now)
  if (typeof res === 'string') return fail(res)
  const order = { ...res.order, manualUntil: now + MANUAL_HOLD_MS }
  useOps.setState((s) => ({
    orders: s.orders.map((x) => (x.id === id ? order : x)),
    activity: res.log ? pushActivity(s.activity, res.log) : s.activity,
    ...res.extra,
  }))
  return OK
}

function moveTo(o: OpsOrder, stage: OpsStage, now: number, action: string, detail?: string, actor = actorName()): OpsOrder {
  return { ...o, stage, stageAt: { ...o.stageAt, [stage]: now }, audit: [...o.audit, { at: now, actor, action, detail }] }
}

// ---------- order actions ----------

export function startVerification(id: string) {
  return act(id, (o, now) => (o.stage !== 'incoming' ? 'Already past intake.' : { order: moveTo(o, 'verifying', now, 'Requisition check started') }))
}

export function approveRequisition(id: string) {
  return act(id, (o, now) => {
    if (o.stage !== 'incoming' && o.stage !== 'verifying') return 'Only new orders can be verified.'
    const started = o.stage === 'incoming' ? moveTo(o, 'verifying', now, 'Requisition check started') : o
    return {
      order: moveTo(started, 'packing', now, 'Requisition approved', `${o.doctor} · ${o.doctorReg}`),
      log: activity(o.cityId, 'verify', `${o.id} requisition approved · packing ${describeItems(o)}`, o.id, now),
    }
  })
}

export function rejectRequisition(id: string, reason: string) {
  if (reason.trim().length < 4) return fail('Give a reason the hospital can act on.')
  return act(id, (o, now) => {
    if (o.stage !== 'incoming' && o.stage !== 'verifying') return 'Only new orders can be rejected at verification.'
    return {
      order: { ...moveTo(o, 'rejected', now, 'Requisition rejected', reason.trim()), reason: reason.trim(), refund: o.price.total },
      log: activity(o.cityId, 'reject', `${o.id} rejected: ${reason.trim()} · full refund`, o.id, now),
    }
  })
}

export function markPacked(id: string) {
  return act(id, (o, now) =>
    o.stage !== 'packing'
      ? 'Only orders being packed can be marked packed.'
      : {
          order: moveTo(o, 'ready', now, 'Packed in validated cold box', 'Seal and temperature logger checked'),
          log: activity(o.cityId, 'pack', `${o.id} packed at ${shortStoreName(storeById(o.storeId))} · ready for a rider`, o.id, now),
        },
  )
}

export function assignRider(id: string, riderId: string, actor = actorName()) {
  const rider = currentStaff().find((s) => s.id === riderId)
  if (!rider || rider.role !== 'rider') return fail('Pick a rider from the list.')
  return act(id, (o, now) => {
    if (o.stage !== 'ready') return 'Riders are assigned once the order is packed.'
    const home = storeById(rider.storeId)
    const store = storeById(o.storeId)
    const borrowed = rider.storeId !== o.storeId
    const pickupMs = borrowed && home && store ? rideMinutes(home.location, store.location, 'emergency') * MIN_MS : PICKUP_MS
    const changed = o.riderId && o.riderId !== riderId
    const detail = `${rider.name}${borrowed ? ` · borrowed from ${shortStoreName(home)}` : ''}`
    return {
      order: {
        ...o,
        riderId,
        borrowed,
        assignedAt: now,
        pickupAt: now + pickupMs,
        audit: [...o.audit, { at: now, actor, action: changed ? 'Rider changed' : 'Rider assigned', detail }],
      },
      log: activity(o.cityId, 'assign', `${shortName(rider.name)} assigned to ${o.id}${borrowed ? ` (borrowed from ${shortStoreName(home)})` : ''}`, o.id, now),
    }
  })
}

export function markOutForDelivery(id: string) {
  return act(id, (o, now) => {
    if (o.stage !== 'ready' || !o.riderId) return 'Assign a rider first.'
    return {
      order: moveTo(o, 'out_for_delivery', now, 'Out for delivery', `Ride about ${o.rideMin} min`),
      log: activity(o.cityId, 'dispatch', `${o.id} out for delivery from ${shortStoreName(storeById(o.storeId))} · ETA ${o.rideMin} min`, o.id, now),
    }
  })
}

/** Ride-back bookkeeping shared by manual and Autopilot handovers. */
export function returnTrip(o: OpsOrder, now: number) {
  const hospital = hospitalById(o.hospitalId)
  if (!o.riderId || !hospital) return null
  return { riderId: o.riderId, ret: { from: hospital.location, start: now, until: now + o.rideMin * MIN_MS * RETURN_FACTOR } }
}

export function confirmDelivery(id: string, otp: string) {
  if (!/^\d{4}$/.test(otp)) return fail('Enter the 4-digit code from the hospital.')
  return act(id, (o, now) => {
    if (o.stage !== 'out_for_delivery') return 'Only orders on the way can be handed over.'
    if (otp !== o.otp) return 'That code does not match. Ask the blood bank desk to read it again.'
    const trip = returnTrip(o, now)
    const mins = Math.round((now - o.createdAt) / MIN_MS)
    return {
      order: moveTo(o, 'delivered', now, 'Delivered', 'OTP confirmed at the blood bank desk'),
      log: activity(o.cityId, 'deliver', `${o.id} delivered to ${hospitalName(o)} · ${mins} min order to handover`, o.id, now),
      extra: trip ? { returns: { ...useOps.getState().returns, [trip.riderId]: trip.ret } } : undefined,
    }
  })
}

export function changePriority(id: string, priority: Priority, reason: string) {
  if (reason.trim().length < 4) return fail('A reason is required for the audit log.')
  return act(id, (o, now) => {
    if (!isPreDispatch(o) && o.stage !== 'out_for_delivery') return 'Closed orders cannot be re-prioritised.'
    if (o.priority === priority) return 'That is already the priority.'
    const up = ['scheduled', 'urgent', 'emergency'].indexOf(priority) > ['scheduled', 'urgent', 'emergency'].indexOf(o.priority)
    const store = storeById(o.storeId)
    const hospital = hospitalById(o.hospitalId)
    const rideMin = isPreDispatch(o) && store && hospital ? rideMinutes(store.location, hospital.location, priority) : o.rideMin
    const what = `${PRIORITY_LABEL[o.priority]} → ${PRIORITY_LABEL[priority]}`
    return {
      order: { ...o, priority, rideMin, audit: [...o.audit, { at: now, actor: actorName(), action: up ? 'Escalated' : 'De-escalated', detail: `${what} · ${reason.trim()}` }] },
      log: activity(o.cityId, 'escalate', `${o.id} ${up ? 'escalated' : 'de-escalated'} ${what}: ${reason.trim()}`, o.id, now),
    }
  })
}

export function cancelOpsOrder(id: string, reason: string) {
  if (reason.trim().length < 4) return fail('A reason is required.')
  return act(id, (o, now) => {
    if (!isPreDispatch(o)) return 'Once a rider has left, the order can only be stopped by phone.'
    return {
      order: { ...moveTo(o, 'cancelled', now, 'Cancelled', reason.trim()), reason: reason.trim(), refund: o.price.total, riderId: undefined, pickupAt: undefined },
      log: activity(o.cityId, 'cancel', `${o.id} cancelled at ${STAGE_LABEL[o.stage].toLowerCase()}: ${reason.trim()} · full refund`, o.id, now),
    }
  })
}

// ---------- fleet ----------

export function setScope(cityId: CityScope) {
  useOps.setState({ cityId })
}

export function setAutopilot(on: boolean) {
  useOps.setState((s) => ({
    autopilot: on,
    activity: pushActivity(s.activity, activity(s.cityId === ALL_INDIA ? 'delhi' : s.cityId, 'surge', on ? 'Autopilot on: stores advance orders and dispatch riders automatically' : 'Autopilot off: every step now waits for the panel')),
  }))
}

export function setSurge(on: boolean) {
  const now = Date.now()
  useOps.setState((s) => {
    const deferred = on ? s.orders.filter((o) => isDeferred(o, true, now) && (s.cityId === ALL_INDIA || o.cityId === s.cityId)).length : 0
    const text = on
      ? `Surge mode on: riders can be borrowed across stores${deferred ? `, ${deferred} scheduled order${deferred === 1 ? '' : 's'} deferred` : ''}`
      : 'Surge mode off: stores use their own riders again'
    return { surge: on, activity: pushActivity(s.activity, activity(s.cityId === ALL_INDIA ? 'delhi' : s.cityId, 'surge', text)) }
  })
}

const inScope = (scope: CityScope, cityId: string) => scope === ALL_INDIA || scope === cityId

/** Runs the greedy dispatcher once for the scope. Returns how many were assigned and how many still wait. */
export function autoAssignAll(scope: CityScope, actor = actorName()) {
  const s = useOps.getState()
  const now = Date.now()
  const staff = currentStaff()
  const views = riderViews(staff, s.orders, s.returns, now).filter((v) => inScope(scope, v.store.cityId))
  const queue = s.orders.filter((o) => inScope(scope, o.cityId))
  const plan = planAssignments(queue, views, s.surge, now)
  for (const p of plan) assignRider(p.orderId, p.riderId, actor)
  const waiting = queue.filter((o) => o.source === 'ops' && o.stage === 'ready' && !o.riderId && !isDeferred(o, s.surge, now)).length - plan.length
  return { assigned: plan.length, waiting: Math.max(0, waiting) }
}

/** Brings off-shift riders in the scope on shift (they report within minutes). */
export function callInOffShift(scope: CityScope) {
  const s = useOps.getState()
  const riders = currentStaff().filter((m) => m.role === 'rider' && m.status === 'off_shift' && inScope(scope, m.cityId))
  if (!riders.length) return 0
  const patch = { ...s.staffPatch }
  const added = s.staffAdded.map((m) => (riders.some((r) => r.id === m.id) ? { ...m, status: 'on_shift' as const } : m))
  for (const r of riders) if (!r.custom) patch[r.id] = { ...patch[r.id], status: 'on_shift' }
  const where = scope === ALL_INDIA ? 'across India' : `in ${cityById(scope).name}`
  useOps.setState({
    staffPatch: patch,
    staffAdded: added,
    activity: pushActivity(s.activity, activity(riders[0].cityId, 'staff', `${riders.length} off-shift rider${riders.length === 1 ? '' : 's'} called in ${where}`)),
  })
  return riders.length
}

// ---------- staff register ----------

export type StaffInput = Omit<StaffMember, 'id' | 'cityId' | 'custom'> & { id?: string }

export function saveStaff(input: StaffInput): StaffMember {
  const store = storeById(input.storeId)
  if (!store) throw new Error('Unknown store')
  const s = useOps.getState()
  const clean: StaffInput = { ...input, name: input.name.trim().replace(/\s+/g, ' '), phone: input.phone.replace(/\D/g, '').slice(-10) }
  if (clean.role !== 'rider') {
    delete clean.vehicleType
    delete clean.vehicleReg
    delete clean.licenceExpiry
  }
  if (clean.role !== 'medical_officer') delete clean.registrationNo
  const now = Date.now()

  if (!clean.id) {
    const member: StaffMember = {
      ...clean,
      id: uid('EMP-'),
      cityId: store.cityId,
      custom: true,
      ...(clean.role === 'rider' ? { deliveriesTotal: 0, onTimePct: 100, rating: 5 } : {}),
    }
    useOps.setState({
      staffAdded: [...s.staffAdded, member],
      activity: pushActivity(s.activity, activity(store.cityId, 'staff', `${member.name} added as ${ROLE_LABEL[member.role].toLowerCase()} at ${shortStoreName(store)}`, undefined, now)),
    })
    return member
  }

  const existing = currentStaff().find((m) => m.id === clean.id)
  if (!existing) throw new Error('Unknown staff member')
  const member: StaffMember = { ...existing, ...clean, id: existing.id, cityId: store.cityId }
  if (member.role !== 'rider') {
    delete member.vehicleType
    delete member.vehicleReg
    delete member.licenceExpiry
  }
  const log = activity(store.cityId, 'staff', `${member.name}'s record updated`, undefined, now)
  if (existing.custom) {
    useOps.setState({ staffAdded: s.staffAdded.map((m) => (m.id === member.id ? member : m)), activity: pushActivity(s.activity, log) })
  } else {
    const { id: _id, ...rest } = member
    useOps.setState({ staffPatch: { ...s.staffPatch, [member.id]: rest }, activity: pushActivity(s.activity, log) })
  }
  return member
}

export function setStaffStatus(id: string, status: StaffStatus) {
  const s = useOps.getState()
  const member = currentStaff().find((m) => m.id === id)
  if (!member) return
  const text = status === 'inactive' ? `${member.name} deactivated` : `${member.name} set to ${status.replace('_', ' ')}`
  const log = activity(member.cityId, 'staff', text)
  if (member.custom) useOps.setState({ staffAdded: s.staffAdded.map((m) => (m.id === id ? { ...m, status } : m)), activity: pushActivity(s.activity, log) })
  else useOps.setState({ staffPatch: { ...s.staffPatch, [id]: { ...s.staffPatch[id], status } }, activity: pushActivity(s.activity, log) })
}

/** Whether a staff member is busy with an order right now (can't go off shift mid-ride). */
export function riderBusy(id: string) {
  return useOps.getState().orders.some((o) => o.riderId === id && (o.stage === 'ready' || o.stage === 'out_for_delivery'))
}
