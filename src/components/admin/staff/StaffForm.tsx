import { useMemo, useState, type FormEvent } from 'react'
import type { Shift, StaffMember, StaffRole, StaffStatus, VehicleType } from '@/services/admin/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { citiesByState } from '@/data/cities'
import { playSound } from '@/lib/sound'
import { saveStaff, type StaffInput } from '@/services/admin/actions'
import { ROLE_LABEL, SHIFT_LABEL, STATUS_LABEL } from '@/services/admin/staffSeed'
import { shortStoreName, storeById, storesIn } from '@/services/admin/stores'
import { daysUntil, isoDay } from '@/services/admin/time'

const ROLES = Object.keys(ROLE_LABEL) as StaffRole[]
const SHIFTS = Object.keys(SHIFT_LABEL) as Shift[]
const STATUSES: StaffStatus[] = ['on_shift', 'off_shift', 'leave']

type Draft = {
  name: string
  phone: string
  role: StaffRole
  storeId: string
  shift: Shift
  status: StaffStatus
  joinedOn: string
  trainedOn: string
  vehicleType: VehicleType
  vehicleReg: string
  licenceExpiry: string
  registrationNo: string
}

type Errors = Partial<Record<keyof Draft, string>>

const REG_RE = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4}$/

/** "mh02ek4821" → "MH 02 EK 4821" */
function formatReg(v: string) {
  const m = v.toUpperCase().replace(/\s+/g, '').match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/)
  return m ? `${m[1]} ${m[2].padStart(2, '0')} ${m[3]} ${m[4]}` : v.toUpperCase().trim()
}

function validate(d: Draft, now: number): Errors {
  const e: Errors = {}
  if (!/^[\p{L}][\p{L} .'’-]{2,59}$/u.test(d.name.trim())) e.name = 'Enter a full name (letters only, at least 3 characters).'
  const digits = d.phone.replace(/\D/g, '')
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  if (!/^[6-9]\d{9}$/.test(local)) e.phone = 'Enter a 10-digit Indian mobile number starting 6–9.'
  if (!storeById(d.storeId)) e.storeId = 'Choose a store.'
  if (!d.joinedOn) e.joinedOn = 'Add the joining date.'
  else if (daysUntil(d.joinedOn, now) > 0) e.joinedOn = 'Joining date cannot be in the future.'
  if (!d.trainedOn) e.trainedOn = 'Add the last cold-chain training date.'
  else if (daysUntil(d.trainedOn, now) > 0) e.trainedOn = 'Training date cannot be in the future.'
  if (d.role === 'rider') {
    if (!REG_RE.test(d.vehicleReg.toUpperCase().trim())) e.vehicleReg = 'Use the plate format, e.g. DL 03 EV 4821.'
    else {
      const store = storeById(d.storeId)
      if (store && !d.vehicleReg.toUpperCase().trim().startsWith(store.rto)) e.vehicleReg = `Vehicles at this store are registered in ${store.rto}.`
    }
    if (!d.licenceExpiry) e.licenceExpiry = 'Add the driving licence expiry date.'
  }
  if (d.role === 'medical_officer' && d.registrationNo.trim().length < 5) e.registrationNo = 'Enter the medical council registration number.'
  return e
}

function toDraft(m: StaffMember | null, storeId: string, now: number): Draft {
  return {
    name: m?.name ?? '',
    phone: m?.phone ?? '',
    role: m?.role ?? 'rider',
    storeId: m?.storeId ?? storeId,
    shift: m?.shift ?? 'morning',
    status: m && m.status !== 'inactive' ? m.status : 'off_shift',
    joinedOn: m?.joinedOn ?? isoDay(now),
    trainedOn: m?.trainedOn ?? isoDay(now),
    vehicleType: m?.vehicleType ?? 'ev_scooter',
    vehicleReg: m?.vehicleReg ?? '',
    licenceExpiry: m?.licenceExpiry ?? '',
    registrationNo: m?.registrationNo ?? '',
  }
}

function StaffFormBody({ member, scope, defaultStore, onDone }: { member: StaffMember | null; scope: string; defaultStore: string; onDone: () => void }) {
  const now = Date.now()
  const [d, setD] = useState<Draft>(() => toDraft(member, defaultStore, now))
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const groups = useMemo(() => {
    if (scope !== 'all') return [{ label: '', stores: storesIn(scope) }]
    return citiesByState().flatMap(({ cities }) => cities.map((c) => ({ label: c.name, stores: storesIn(c.id) })))
  }, [scope])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validate(d, now)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      ;(e.currentTarget as HTMLFormElement).querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setBusy(true)
    const input: StaffInput = {
      id: member?.id,
      name: d.name,
      phone: d.phone,
      role: d.role,
      storeId: d.storeId,
      shift: d.shift,
      status: d.status,
      joinedOn: d.joinedOn,
      trainedOn: d.trainedOn,
      ...(d.role === 'rider' ? { vehicleType: d.vehicleType, vehicleReg: formatReg(d.vehicleReg), licenceExpiry: d.licenceExpiry } : {}),
      ...(d.role === 'medical_officer' ? { registrationNo: d.registrationNo.trim() } : {}),
      ...(member?.role === 'rider' && d.role === 'rider' ? { deliveriesTotal: member.deliveriesTotal, onTimePct: member.onTimePct, rating: member.rating } : {}),
    }
    const saved = saveStaff(input)
    playSound('tap')
    toast.success(member ? 'Record updated' : 'Employee added', `${saved.name} · ${ROLE_LABEL[saved.role]} at ${shortStoreName(storeById(saved.storeId))}`)
    onDone()
  }

  const ctl = (k: keyof Draft, id: string) => ({ id, name: k, 'aria-invalid': !!errors[k] || undefined })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name} className="sm:col-span-2">
          {(id) => <Input {...ctl('name', id)} value={d.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" maxLength={60} />}
        </Field>
        <Field label="Mobile number" required error={errors.phone} hint="10 digits; shown masked elsewhere">
          {(id) => <Input {...ctl('phone', id)} value={d.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d+ ]/g, ''))} inputMode="tel" autoComplete="off" maxLength={14} placeholder="98xxxxxxxx" />}
        </Field>
        <Field label="Role" required>
          {(id) => (
            <Select {...ctl('role', id)} value={d.role} onChange={(e) => set('role', e.target.value as StaffRole)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Store" required error={errors.storeId} className="sm:col-span-2">
          {(id) => (
            <Select {...ctl('storeId', id)} value={d.storeId} onChange={(e) => set('storeId', e.target.value)}>
              <option value="">Choose a store</option>
              {groups.map((g) =>
                g.label ? (
                  <optgroup key={g.label} label={g.label}>
                    {g.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {shortStoreName(s)}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  g.stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {shortStoreName(s)}
                    </option>
                  ))
                ),
              )}
            </Select>
          )}
        </Field>
        <Field label="Shift" required>
          {(id) => (
            <Select {...ctl('shift', id)} value={d.shift} onChange={(e) => set('shift', e.target.value as Shift)}>
              {SHIFTS.map((s) => (
                <option key={s} value={s}>
                  {SHIFT_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status" required>
          {(id) => (
            <Select {...ctl('status', id)} value={d.status} onChange={(e) => set('status', e.target.value as StaffStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Joined on" required error={errors.joinedOn}>
          {(id) => <Input {...ctl('joinedOn', id)} type="date" value={d.joinedOn} max={isoDay(now)} onChange={(e) => set('joinedOn', e.target.value)} />}
        </Field>
        <Field label="Cold-chain training" required error={errors.trainedOn} hint="Refresher due every 12 months">
          {(id) => <Input {...ctl('trainedOn', id)} type="date" value={d.trainedOn} max={isoDay(now)} onChange={(e) => set('trainedOn', e.target.value)} />}
        </Field>
      </div>

      {d.role === 'rider' && (
        <fieldset className="grid gap-4 rounded-3xl border border-ink-100 bg-ink-50/50 p-4 sm:grid-cols-2">
          <legend className="px-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">Vehicle and licence</legend>
          <Field label="Vehicle" required>
            {(id) => (
              <Select {...ctl('vehicleType', id)} value={d.vehicleType} onChange={(e) => set('vehicleType', e.target.value as VehicleType)}>
                <option value="ev_scooter">EV scooter</option>
                <option value="bike">Motorbike</option>
              </Select>
            )}
          </Field>
          <Field label="Registration number" required error={errors.vehicleReg}>
            {(id) => <Input {...ctl('vehicleReg', id)} value={d.vehicleReg} onChange={(e) => set('vehicleReg', e.target.value.toUpperCase())} onBlur={() => set('vehicleReg', formatReg(d.vehicleReg))} placeholder={`${storeById(d.storeId)?.rto ?? 'DL'} 03 EV 4821`} autoComplete="off" maxLength={14} />}
          </Field>
          <Field
            label="Driving licence expiry"
            required
            error={errors.licenceExpiry}
            hint={d.licenceExpiry && daysUntil(d.licenceExpiry, now) < 0 ? 'Expired: the rider will be flagged until renewed.' : undefined}
            className="sm:col-span-2"
          >
            {(id) => <Input {...ctl('licenceExpiry', id)} type="date" value={d.licenceExpiry} onChange={(e) => set('licenceExpiry', e.target.value)} />}
          </Field>
        </fieldset>
      )}

      {d.role === 'medical_officer' && (
        <Field label="Medical council registration no." required error={errors.registrationNo} hint="Checked against the state medical council register">
          {(id) => <Input {...ctl('registrationNo', id)} value={d.registrationNo} onChange={(e) => set('registrationNo', e.target.value)} placeholder="DLMC/R/12345" maxLength={40} />}
        </Field>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" loading={busy}>
          {member ? 'Save changes' : 'Add employee'}
        </Button>
      </div>
    </form>
  )
}

export function StaffForm({ open, member, scope, defaultStore, onClose }: { open: boolean; member: StaffMember | null; scope: string; defaultStore: string; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={member ? `Edit ${member.name}` : 'Add employee'} className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
      {open && <StaffFormBody key={member?.id ?? 'new'} member={member} scope={scope} defaultStore={defaultStore} onDone={onClose} />}
    </Modal>
  )
}
