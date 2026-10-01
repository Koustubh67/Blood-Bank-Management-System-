import { useDB } from '@/store/db'
import type { BloodGroup, ComponentCode, Order, OrderItem, Priority } from '@/types'
import { DEMO_MODE } from '@/config/brand'
import { hospitalById } from '@/data/network'
import { distanceMeters, orderId, otp4, seeded, uid } from '@/lib/utils'
import { DEMO_ACCOUNTS } from './auth'
import { buildPlan, quote } from './orders'

const DAY = 86_400_000

const PATIENTS = ['R. Verma', 'S. Khan', 'M. Iyer', 'P. Kaur', 'A. Gupta', 'N. Das', 'K. Reddy', 'T. Joseph', 'V. Mehta', 'J. Ali']
const DOCTORS = [
  { doctorName: 'Dr. Kavita Rao', registrationNo: 'DMC/R/10421 (demo)' },
  { doctorName: 'Dr. Arjun Malhotra', registrationNo: 'DMC/R/20877 (demo)' },
  { doctorName: 'Dr. Farah Siddiqui', registrationNo: 'DMC/R/31190 (demo)' },
]
const BASKETS: { items: [ComponentCode, BloodGroup, number][]; priority: Priority }[] = [
  { items: [['PRBC', 'O+', 2]], priority: 'emergency' },
  { items: [['PRBC', 'B+', 1]], priority: 'urgent' },
  { items: [['PLT', 'A+', 4]], priority: 'urgent' },
  { items: [['PRBC', 'O-', 2]], priority: 'emergency' },
  { items: [['FFP', 'AB+', 2], ['PRBC', 'A+', 2]], priority: 'scheduled' },
  { items: [['PRBC', 'B+', 2], ['FFP', 'B+', 2]], priority: 'emergency' },
  { items: [['CRYO', 'A+', 4]], priority: 'scheduled' },
  { items: [['PRBC', 'A+', 1]], priority: 'urgent' },
]

function historicOrder(userId: string, role: Order['role'], hospitalId: string, daysAgo: number, rand: () => number): Order {
  const hospital = hospitalById(hospitalId)!
  const { centres } = useDB.getState()
  const centre = [...centres].sort((a, b) => distanceMeters(a.location, hospital.location) - distanceMeters(b.location, hospital.location))[0]
  const basket = BASKETS[Math.floor(rand() * BASKETS.length)]
  const items: OrderItem[] = basket.items.map(([component, group, units]) => ({ component, group, units }))
  const placedAt = Date.now() - daysAgo * DAY - Math.floor(rand() * 10) * 3_600_000
  const price = quote(items)
  const group = items[0].group
  return {
    id: orderId(),
    userId,
    role,
    priority: basket.priority,
    items,
    patient: { name: PATIENTS[Math.floor(rand() * PATIENTS.length)], age: 20 + Math.floor(rand() * 60), gender: rand() > 0.5 ? 'female' : 'male', bloodGroup: group, ward: `ICU-${1 + Math.floor(rand() * 12)}` },
    prescriber: { ...DOCTORS[Math.floor(rand() * DOCTORS.length)], requisitionFileName: 'requisition-signed.pdf' },
    hospitalId,
    centreId: centre.id,
    consent: { prescription: true, transfusionAtFacility: true, terms: true },
    price,
    status: 'placed',
    payments: [
      {
        method: role === 'hospital' ? 'credit' : 'upi',
        status: 'success',
        transactionId: uid('TXN'),
        gatewayRef: `pay_${uid().toLowerCase()}`,
        amount: price.total,
        paidAt: placedAt,
        instrument: role === 'hospital' ? 'Hospital credit · PO CC-2026-114' : 'aarav@okaxis',
      },
    ],
    rider: { name: 'Priya Nair', phone: '+91 97•••• 1187', vehicle: 'EV scooter · DL 8S EV 1190', rating: 4.95 },
    handoverOtp: otp4(),
    createdAt: placedAt - 90_000,
    placedAt,
    plan: buildPlan(basket.priority, centre.location, hospital.location),
    simOffsetMs: 0,
  }
}

/**
 * Gives the demo accounts some delivered history so the hospital dashboard,
 * charts and order lists aren't empty when a reviewer first signs in.
 * Runs once per fresh database (again after "Reset demo").
 */
export function seedDemoHistory() {
  if (!DEMO_MODE) return
  const { users, orders, _set } = useDB.getState()
  const hospitalUser = users.find((u) => u.email === DEMO_ACCOUNTS[1].email)
  const familyUser = users.find((u) => u.email === DEMO_ACCOUNTS[0].email)
  if (!hospitalUser || !familyUser) return
  if (orders.some((o) => o.userId === hospitalUser.id || o.userId === familyUser.id)) return

  const rand = seeded(2026)
  const seededOrders: Order[] = []
  for (const daysAgo of [1, 2, 2, 3, 5, 6, 6, 7, 9, 10, 11, 12, 13]) {
    seededOrders.push(historicOrder(hospitalUser.id, 'hospital', hospitalUser.hospitalId ?? 'H-CC', daysAgo, rand))
  }
  seededOrders.push(historicOrder(familyUser.id, 'individual', 'H-SM', 4, rand))
  seededOrders.sort((a, b) => (b.placedAt ?? 0) - (a.placedAt ?? 0))
  _set((s) => ({ orders: [...s.orders, ...seededOrders] }))
}
