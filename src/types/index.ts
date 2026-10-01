export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

/** WB whole blood, PRBC packed red cells, FFP fresh frozen plasma, PLT platelets, CRYO cryoprecipitate */
export type ComponentCode = 'WB' | 'PRBC' | 'FFP' | 'PLT' | 'CRYO'

/** `admin` is RaktFlow operations staff; it cannot be chosen at sign-up. */
export type Role = 'individual' | 'hospital' | 'admin'

export type Priority = 'emergency' | 'urgent' | 'scheduled'

export type LatLng = { lat: number; lng: number }

export type Inventory = Record<BloodGroup, Record<ComponentCode, number>>

export interface BloodCentre {
  id: string
  /** City in `src/data/cities.ts` */
  cityId: string
  name: string
  licenseNo: string
  area: string
  location: LatLng
  open24x7: boolean
  rating: number
  inventory: Inventory
}

export interface PartnerHospital {
  id: string
  cityId: string
  name: string
  area: string
  registrationNo: string
  location: LatLng
  beds: number
}

export interface User {
  id: string
  role: Role
  name: string
  email: string
  phone: string
  /** Home city chosen at sign-up; sets the default store and hospital list */
  cityId?: string
  /** Hospital accounts only */
  hospitalId?: string
  registrationNo?: string
  verified: boolean
  createdAt: number
}

export interface OrderItem {
  component: ComponentCode
  group: BloodGroup
  units: number
}

export interface PatientDetails {
  name: string
  age: number
  gender: 'female' | 'male' | 'other'
  bloodGroup: BloodGroup
  uhid?: string
  diagnosis?: string
  ward?: string
}

export interface PrescriberDetails {
  doctorName: string
  registrationNo: string
  requisitionFileName: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'verified'
  | 'packed'
  | 'dispatched'
  | 'arriving'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed'

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'credit'

export interface PaymentRecord {
  method: PaymentMethod
  status: 'success' | 'failed'
  transactionId: string
  gatewayRef: string
  amount: number
  paidAt: number
  /** Masked display, e.g. "VISA •••• 1111" or "rahul@okaxis" */
  instrument: string
  failureReason?: string
}

export interface PriceBreakdown {
  processing: number
  logistics: number
  logisticsGst: number
  total: number
}

export interface Rider {
  name: string
  phone: string
  vehicle: string
  rating: number
}

/**
 * Fixed at payment time so tracking is deterministic and survives reloads.
 * All offsets are milliseconds after `placedAt`.
 */
export interface DeliveryPlan {
  distanceM: number
  verifyAt: number
  packAt: number
  dispatchAt: number
  arriveAt: number
  deliverAt: number
}

export interface Order {
  id: string
  plan?: DeliveryPlan
  userId: string
  role: Role
  priority: Priority
  items: OrderItem[]
  patient: PatientDetails
  prescriber: PrescriberDetails
  hospitalId: string
  centreId: string
  consent: { prescription: boolean; transfusionAtFacility: boolean; terms: boolean }
  price: PriceBreakdown
  status: OrderStatus
  payments: PaymentRecord[]
  rider?: Rider
  /** 4-digit code the hospital shares with the rider at handover */
  handoverOtp: string
  createdAt: number
  /** Set on successful payment. Tracking timeline is measured from here. */
  placedAt?: number
  /** Demo fast-forward: extra simulated milliseconds added to the clock for this order */
  simOffsetMs: number
  cancelledAt?: number
  cancelReason?: string
  notes?: string
}

export interface DonorProfile {
  id: string
  userId?: string
  name: string
  phone: string
  bloodGroup: BloodGroup
  age: number
  weightKg: number
  lastDonation?: string
  centreId?: string
  slot?: string
  createdAt: number
}

/**
 * A real hospital from OpenStreetMap. Shown on the "Near you" map for context;
 * it is not a delivery partner unless it is also in PARTNER_HOSPITALS.
 */
export interface RealHospital {
  id: string
  name: string
  area: string
  location: LatLng
  phone?: string
  website?: string
  emergency?: boolean
  beds?: number
  ownership?: 'government' | 'private'
}

/**
 * A RaktFlow outlet: a licensed blood storage centre placed close to busy
 * hospitals and stocked by one of the partner blood centres.
 */
export interface Outlet {
  id: string
  cityId: string
  name: string
  area: string
  location: LatLng
  licenseNo: string
  /** Partner blood centre that issues the units this outlet stores */
  motherCentreId: string
  open24x7: boolean
  /** Fridge capacity in units */
  capacityUnits: number
  openedOn: string
}

/** A voluntary blood donation camp from the national e-RaktKosh schedule. */
export interface DonationCamp {
  /** e-RaktKosh camp request number */
  id: string
  name: string
  /** ISO date, yyyy-mm-dd */
  date: string
  /** 24-hour "HH:MM" */
  startTime?: string
  endTime?: string
  venue: string
  district: string
  state: string
  organiser?: string
  bloodCentre?: string
  contact?: string
  /** True when donors can pre-register for it on e-RaktKosh */
  portalRegistration: boolean
}

export type PledgeStatus = 'pledged' | 'donated' | 'cancelled'

/** A donor's promise to give blood at a camp, counted towards community totals. */
export interface CampPledge {
  id: string
  campId: string
  campName: string
  campDate: string
  venue: string
  district: string
  state: string
  userId?: string
  name: string
  phone: string
  bloodGroup?: BloodGroup
  status: PledgeStatus
  createdAt: number
  donatedAt?: number
}
