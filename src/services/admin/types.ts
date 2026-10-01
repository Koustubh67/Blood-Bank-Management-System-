import type { LatLng, OrderItem, PaymentMethod, PriceBreakdown, Priority } from '@/types'

/**
 * Operations data for the admin panel. It is simulated and lives in its own
 * persisted store (`raktflow-ops-v1`), separate from the customer database, so
 * the panel can run a busy fleet without touching real orders.
 */

/** `all` means All India; anything else is a city id from `src/data/cities.ts`. */
export type CityScope = string

export type StoreKind = 'centre' | 'outlet'

/** A blood centre or an outlet, viewed as one place that packs and ships orders. */
export interface OpsStore {
  id: string
  kind: StoreKind
  cityId: string
  name: string
  area: string
  location: LatLng
  licenseNo: string
  open24x7: boolean
  /** Outlets only */
  motherCentreId?: string
  capacityUnits?: number
  openedOn?: string
  /** Relative order volume; 1 is a typical store */
  busyness: number
  /** Vehicle registration state code, e.g. "MH" */
  rto: string
}

export type StaffRole = 'manager' | 'lab_tech' | 'medical_officer' | 'dispatcher' | 'rider'
export type Shift = 'morning' | 'evening' | 'night'
export type StaffStatus = 'on_shift' | 'off_shift' | 'leave' | 'inactive'
export type VehicleType = 'ev_scooter' | 'bike'

export interface StaffMember {
  id: string
  storeId: string
  cityId: string
  name: string
  role: StaffRole
  /** 10 digits, stored in full and shown masked */
  phone: string
  shift: Shift
  status: StaffStatus
  /** ISO dates, yyyy-mm-dd */
  joinedOn: string
  /** Last cold-chain handling training; refreshed every 12 months */
  trainedOn: string
  // Riders
  vehicleType?: VehicleType
  vehicleReg?: string
  licenceExpiry?: string
  deliveriesTotal?: number
  onTimePct?: number
  rating?: number
  // Medical officers
  registrationNo?: string
  /** Added from the admin panel rather than seeded */
  custom?: boolean
}

export type OpsStage = 'incoming' | 'verifying' | 'packing' | 'ready' | 'out_for_delivery' | 'delivered' | 'rejected' | 'cancelled'

export interface AuditEntry {
  at: number
  actor: string
  action: string
  detail?: string
}

export interface OpsOrder {
  id: string
  /** `app` orders were placed by a real user in this browser and are read-only here */
  source: 'ops' | 'app'
  cityId: string
  storeId: string
  hospitalId: string
  items: OrderItem[]
  priority: Priority
  createdAt: number
  stage: OpsStage
  stageAt: Partial<Record<OpsStage, number>>
  riderId?: string
  /** Display name for riders outside the staff register (app orders) */
  riderName?: string
  /** Rider lent by another store in the same city during surge */
  borrowed?: boolean
  assignedAt?: number
  /** When the rider will have the cold box in hand */
  pickupAt?: number
  /** Planned ride, store to hospital */
  rideMin: number
  distanceM: number
  method: PaymentMethod
  price: PriceBreakdown
  refund?: number
  /** 4-digit code the hospital gives the rider at handover */
  otp: string
  patient: string
  ward?: string
  doctor: string
  doctorReg: string
  requisition: string
  /** Rejection or cancellation reason */
  reason?: string
  /** Autopilot leaves an order alone until this time after an admin acts on it */
  manualUntil?: number
  /** Spawned by "Simulate rush hour" */
  rush?: boolean
  audit: AuditEntry[]
}

export type ActivityKind =
  | 'order'
  | 'verify'
  | 'pack'
  | 'assign'
  | 'dispatch'
  | 'deliver'
  | 'reject'
  | 'cancel'
  | 'escalate'
  | 'surge'
  | 'staff'
  | 'alert'

export interface OpsActivity {
  id: string
  at: number
  cityId: string
  kind: ActivityKind
  text: string
  orderId?: string
}

/** A rider riding back to their home store after a handover. */
export interface RiderReturn {
  from: LatLng
  start: number
  until: number
}

/** A simulated fridge door-open excursion at an outlet. */
export interface FridgeExcursion {
  start: number
  until: number
  /** Extra °C at the peak, on top of the logger's normal reading */
  peak: number
}

export type RiderState = 'available' | 'to_pickup' | 'on_the_way' | 'returning' | 'off_shift' | 'leave' | 'inactive'

/** Aggregate takings for one store on one day. */
export interface CollectionRow {
  day: number
  storeId: string
  cityId: string
  orders: number
  processing: number
  logistics: number
  gst: number
  total: number
  upi: number
  card: number
  netbanking: number
  credit: number
  refunds: number
}
