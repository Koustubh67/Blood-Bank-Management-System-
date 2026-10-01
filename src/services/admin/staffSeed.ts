import type { OpsStore, Shift, StaffMember, StaffRole, StaffStatus } from './types'
import { hashString, seeded } from '@/lib/utils'
import { STORES } from './stores'
import { staffName } from './names'
import { DAY_MS, isoDaysFrom, startOfDay } from './time'

export const ROLE_LABEL: Record<StaffRole, string> = {
  manager: 'Store manager',
  lab_tech: 'Lab technician',
  medical_officer: 'Medical officer',
  dispatcher: 'Dispatcher',
  rider: 'Rider',
}

export const SHIFT_LABEL: Record<Shift, string> = {
  morning: 'Morning · 6–14',
  evening: 'Evening · 14–22',
  night: 'Night · 22–6',
}

export const STATUS_LABEL: Record<StaffStatus, string> = {
  on_shift: 'On shift',
  off_shift: 'Off shift',
  leave: 'On leave',
  inactive: 'Deactivated',
}

const ROLE_CODE: Record<StaffRole, string> = { manager: 'M', lab_tech: 'L', medical_officer: 'MO', dispatcher: 'D', rider: 'R' }
const SERIES = 'ABCDEFGHJKLMNPRSTUVWXYZ'

function digits(rand: () => number, n: number) {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(rand() * 10)
  return s
}

/** "MH 02 EK 4821": state code, RTO number, series, number. */
export function vehicleRegistration(rand: () => number, rto: string) {
  const office = String(1 + Math.floor(rand() * 14)).padStart(2, '0')
  const series = SERIES[Math.floor(rand() * SERIES.length)] + SERIES[Math.floor(rand() * SERIES.length)]
  return `${rto} ${office} ${series} ${digits(rand, 4).replace(/^0/, '1')}`
}

function phone(rand: () => number) {
  return `${'9876'[Math.floor(rand() * 4)]}${digits(rand, 9)}`
}

function shift(rand: () => number): Shift {
  const r = rand()
  return r < 0.45 ? 'morning' : r < 0.8 ? 'evening' : 'night'
}

function status(rand: () => number, onShare: number): StaffStatus {
  const r = rand()
  return r < onShare ? 'on_shift' : r < onShare + (1 - onShare) * 0.75 ? 'off_shift' : 'leave'
}

const ON_SHARE: Record<StaffRole, number> = { manager: 0.8, lab_tech: 0.7, medical_officer: 0.75, dispatcher: 0.85, rider: 0.6 }

function rolesFor(store: OpsStore, rand: () => number): StaffRole[] {
  const roles: StaffRole[] = ['manager']
  if (store.kind === 'centre') roles.push('medical_officer', 'lab_tech', 'lab_tech')
  else roles.push('lab_tech')
  if (store.busyness >= 1.2) roles.push('dispatcher')
  const riders = store.kind === 'centre' ? (rand() < 0.5 ? 4 : 3) : rand() < 0.45 ? 3 : 2
  for (let i = 0; i < riders; i++) roles.push('rider')
  return roles
}

/**
 * The staff register for one store. Seeded from the store id so every load
 * shows the same people; dates are relative to today so the compliance flags
 * (licences, training refreshers) always have something to show.
 */
function seedStoreStaff(store: OpsStore, today: number): StaffMember[] {
  const counts: Partial<Record<StaffRole, number>> = {}
  const opened = store.openedOn ? new Date(store.openedOn).getTime() : today - 1600 * DAY_MS
  const maxTenure = Math.max(45, Math.floor((today - opened) / DAY_MS))
  return rolesFor(store, seeded(hashString(`staff:${store.id}`))).map((role) => {
    const n = (counts[role] = (counts[role] ?? 0) + 1)
    const rand = seeded(hashString(`${store.id}:${role}:${n}`))
    const tenure = Math.floor(30 + rand() * (maxTenure - 30))
    const trainedAgo = rand() < 0.08 ? 340 + Math.floor(rand() * 50) : 20 + Math.floor(rand() * 300)
    const member: StaffMember = {
      id: `${store.id}-${ROLE_CODE[role]}${n}`,
      storeId: store.id,
      cityId: store.cityId,
      name: staffName(rand, store.cityId),
      role,
      phone: phone(rand),
      shift: shift(rand),
      // Every store keeps its first rider on shift so nothing is unstaffed.
      status: role === 'rider' && n === 1 ? 'on_shift' : status(rand, ON_SHARE[role]),
      joinedOn: isoDaysFrom(-tenure, today),
      trainedOn: isoDaysFrom(-Math.min(trainedAgo, tenure), today),
    }
    if (role === 'medical_officer') member.registrationNo = `${store.rto}MC/R/${digits(rand, 5).replace(/^0/, '2')} (demo)`
    if (role === 'rider') {
      const r = rand()
      const licenceIn = r < 0.07 ? 3 + Math.floor(rand() * 25) : r < 0.09 ? -2 - Math.floor(rand() * 18) : 200 + Math.floor(rand() * 2700)
      member.vehicleType = rand() < 0.7 ? 'ev_scooter' : 'bike'
      member.vehicleReg = vehicleRegistration(rand, store.rto)
      member.licenceExpiry = isoDaysFrom(licenceIn, today)
      member.deliveriesTotal = Math.floor(tenure * (1.2 + rand() * 2.4))
      member.onTimePct = Math.round((84 + rand() * 15) * 10) / 10
      member.rating = Math.round((4.3 + rand() * 0.68) * 100) / 100
    }
    return member
  })
}

let cache: { day: number; staff: StaffMember[] } | null = null

/** The full seeded register (about 1,200 people across every store). */
export function seedStaff(now = Date.now()): StaffMember[] {
  const day = startOfDay(now)
  if (cache?.day === day) return cache.staff
  const staff = STORES.flatMap((s) => seedStoreStaff(s, day))
  cache = { day, staff }
  return staff
}

/**
 * Deliveries a rider already made earlier today, before this session's live
 * orders. Seeded per day so the count is stable while the page is open.
 */
export function earlierDeliveriesToday(member: StaffMember, now: number) {
  if (member.role !== 'rider' || member.status === 'leave' || member.status === 'inactive') return 0
  const r = seeded(hashString(`today:${member.id}:${startOfDay(now)}`))()
  const hours = (now - startOfDay(now)) / 3_600_000
  const pace = member.status === 'on_shift' ? 0.45 : 0.12
  return Math.floor(r * hours * pace)
}
