import type { BloodGroup, ComponentCode } from '@/types'

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export interface ComponentInfo {
  code: ComponentCode
  name: string
  short: string
  /**
   * Maximum processing charge per unit in INR.
   * Indicative, based on NBTC guidance and the 2024 DCGI advisory that blood
   * centres may levy only processing charges. Verify current caps before launch.
   */
  processingCharge: number
  storage: string
  tempRange: string
  shelfLife: string
  usedFor: string
  /** Hex colour used for chips and charts */
  tone: string
}

export const COMPONENTS: Record<ComponentCode, ComponentInfo> = {
  PRBC: {
    code: 'PRBC',
    name: 'Packed Red Blood Cells',
    short: 'Red cells',
    processingCharge: 1550,
    storage: 'Refrigerated blood bank fridge',
    tempRange: '2–6 °C',
    shelfLife: 'Up to 42 days',
    usedFor: 'Anaemia, surgery, trauma and blood loss',
    tone: '#C8102E',
  },
  WB: {
    code: 'WB',
    name: 'Whole Blood',
    short: 'Whole blood',
    processingCharge: 1550,
    storage: 'Refrigerated blood bank fridge',
    tempRange: '2–6 °C',
    shelfLife: 'Up to 35 days',
    usedFor: 'Massive blood loss when components are unavailable',
    tone: '#8C0E26',
  },
  FFP: {
    code: 'FFP',
    name: 'Fresh Frozen Plasma',
    short: 'Plasma',
    processingCharge: 400,
    storage: 'Deep freezer',
    tempRange: '−30 °C or colder',
    shelfLife: 'Up to 1 year',
    usedFor: 'Clotting factor deficiency, liver disease, burns',
    tone: '#D97706',
  },
  PLT: {
    code: 'PLT',
    name: 'Random Donor Platelets',
    short: 'Platelets',
    processingCharge: 400,
    storage: 'Platelet agitator',
    tempRange: '20–24 °C with agitation',
    shelfLife: 'Up to 5 days',
    usedFor: 'Dengue, chemotherapy, low platelet counts',
    tone: '#CA8A04',
  },
  CRYO: {
    code: 'CRYO',
    name: 'Cryoprecipitate',
    short: 'Cryo',
    processingCharge: 200,
    storage: 'Deep freezer',
    tempRange: '−30 °C or colder',
    shelfLife: 'Up to 1 year',
    usedFor: 'Haemophilia A, fibrinogen deficiency',
    tone: '#0891B2',
  },
}

export const COMPONENT_CODES = Object.keys(COMPONENTS) as ComponentCode[]

/** Red cell compatibility: which donor groups a recipient can safely receive. */
const RED_CELL_DONORS: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

/** Plasma compatibility is the reverse of red cells: AB is the universal plasma donor. */
const PLASMA_DONORS: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'A-', 'AB+', 'AB-'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'B-', 'AB+', 'AB-'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+', 'AB-'],
}

export function compatibleDonors(recipient: BloodGroup, component: ComponentCode = 'PRBC'): BloodGroup[] {
  if (component === 'FFP' || component === 'CRYO') return PLASMA_DONORS[recipient]
  return RED_CELL_DONORS[recipient]
}

export function canReceive(recipient: BloodGroup, donor: BloodGroup, component: ComponentCode = 'PRBC') {
  return compatibleDonors(recipient, component).includes(donor)
}

/** Groups this donor's red cells can go to. */
export function canDonateTo(donor: BloodGroup): BloodGroup[] {
  return BLOOD_GROUPS.filter((r) => RED_CELL_DONORS[r].includes(donor))
}

/** Approximate share of the Indian population per group, used for demo stock seeding. */
export const GROUP_PREVALENCE: Record<BloodGroup, number> = {
  'O+': 0.36,
  'B+': 0.31,
  'A+': 0.22,
  'AB+': 0.07,
  'O-': 0.015,
  'B-': 0.012,
  'A-': 0.008,
  'AB-': 0.005,
}

export const PRIORITIES = {
  emergency: {
    label: 'Emergency',
    hint: 'Life-threatening. Dispatched first from the nearest centre.',
    targetMinutes: 10,
  },
  urgent: {
    label: 'Urgent',
    hint: 'Needed within the next few hours.',
    targetMinutes: 30,
  },
  scheduled: {
    label: 'Scheduled',
    hint: 'Planned surgery or transfusion at a set time.',
    targetMinutes: 120,
  },
} as const
