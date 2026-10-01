import type { BloodCentre, BloodGroup, ComponentCode, DeliveryPlan, Order, OrderItem, PatientDetails, Priority } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, COMPONENT_CODES, PRIORITIES, canReceive } from '@/data/blood'
import { hospitalById } from '@/data/network'
import type { CentreMatch, OrderDraft } from '@/services/orders'

/**
 * Client-side model of the in-progress order form, plus validation and
 * sessionStorage persistence. Kept separate from the page so each step
 * component can share the same types and rules.
 */

export const ORDER_STEPS = ['Patient & hospital', 'Blood & urgency', 'Prescription & consent', 'Review'] as const

export const PRIORITY_KEYS = Object.keys(PRIORITIES) as Priority[]

export type Gender = PatientDetails['gender']

export interface LineDraft {
  key: string
  component: ComponentCode
  /** null = same as the patient's group */
  group: BloodGroup | null
  units: number
}

export interface PatientDraft {
  name: string
  age: string
  gender: Gender | ''
  bloodGroup: BloodGroup | null
  uhid: string
  ward: string
  diagnosis: string
}

export interface PrescriberDraft {
  doctorName: string
  registrationNo: string
  /** Only the file name (and size for display) is kept; the file itself is never stored. */
  fileName: string
  fileSize: number
}

export interface Draft {
  hospitalId: string
  patient: PatientDraft
  priority: Priority
  lines: LineDraft[]
  prescriber: PrescriberDraft
  notes: string
  consent: Order['consent']
}

export type Errors = Record<string, string>

export const MAX_UNITS = 10
export const MAX_FILE_BYTES = 5 * 1024 * 1024

let seq = 0
export function newLine(partial: Partial<Omit<LineDraft, 'key'>> = {}): LineDraft {
  seq += 1
  return { key: `L${Date.now().toString(36)}${seq}`, component: 'PRBC', group: null, units: 1, ...partial }
}

export function emptyDraft(): Draft {
  return {
    hospitalId: '',
    patient: { name: '', age: '', gender: '', bloodGroup: null, uhid: '', ward: '', diagnosis: '' },
    priority: 'emergency',
    lines: [newLine()],
    prescriber: { doctorName: '', registrationNo: '', fileName: '', fileSize: 0 },
    notes: '',
    consent: { prescription: false, transfusionAtFacility: false, terms: false },
  }
}

// ---------- derived values ----------

export function lineGroup(line: LineDraft, draft: Draft): BloodGroup | null {
  return line.group ?? draft.patient.bloodGroup
}

/** Lines that have a resolved group, as service-ready order items. */
export function draftItems(draft: Draft): OrderItem[] {
  return draft.lines.flatMap((l) => {
    const group = lineGroup(l, draft)
    return group ? [{ component: l.component, group, units: l.units }] : []
  })
}

export function totalUnitsOf(items: OrderItem[]) {
  return items.reduce((s, i) => s + i.units, 0)
}

/** Whole minutes from order placement to handover. */
export function etaMinutes(plan: Pick<DeliveryPlan, 'deliverAt'>) {
  return Math.max(1, Math.ceil(plan.deliverAt / 60_000))
}

export function unitsLabel(n: number) {
  return `${n} unit${n === 1 ? '' : 's'}`
}

export interface LineAvailability {
  group: BloodGroup
  /** Units across the whole network */
  network: number
  /** Most units any single centre holds */
  maxAtOne: number
  /** Nearest centre that can supply this line alone */
  nearest?: { centre: BloodCentre; distanceM: number }
  shortEverywhere: boolean
  /** Compatible groups with enough stock at one centre (excluding the chosen group) */
  substitutes: BloodGroup[]
}

export function lineAvailability(
  item: OrderItem,
  recipient: BloodGroup,
  centres: BloodCentre[],
  distanceOf: (c: BloodCentre) => number,
  compatible: (recipient: BloodGroup, component: ComponentCode) => BloodGroup[],
): LineAvailability {
  let network = 0
  let maxAtOne = 0
  let nearest: LineAvailability['nearest']
  for (const c of centres) {
    const n = c.inventory[item.group][item.component]
    network += n
    maxAtOne = Math.max(maxAtOne, n)
    if (n >= item.units) {
      const d = distanceOf(c)
      if (!nearest || d < nearest.distanceM) nearest = { centre: c, distanceM: d }
    }
  }
  const shortEverywhere = maxAtOne < item.units
  const substitutes = shortEverywhere
    ? compatible(recipient, item.component).filter(
        (g) => g !== item.group && centres.some((c) => c.inventory[g][item.component] >= item.units),
      )
    : []
  return { group: item.group, network, maxAtOne, nearest, shortEverywhere, substitutes }
}

// ---------- validation ----------

const REG_NO = /^[A-Za-z0-9][A-Za-z0-9/.\- ]{2,23}$/

export function validateRequisitionFile(file: File): string | null {
  const okType =
    ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name)
  if (!okType) return 'Upload a PDF, JPG or PNG file.'
  if (file.size > MAX_FILE_BYTES) return 'File is larger than 5 MB. Upload a smaller scan or photo.'
  if (file.size === 0) return 'This file looks empty. Try scanning it again.'
  return null
}

export interface ValidationContext {
  isHospitalUser: boolean
  ranked: CentreMatch[]
  lineStock: Record<string, LineAvailability | undefined>
}

export function validateStep(step: number, d: Draft, ctx: ValidationContext): Errors {
  const e: Errors = {}
  if (step === 0) {
    if (!ctx.isHospitalUser && !hospitalById(d.hospitalId))
      e.hospital = 'Select the partner hospital where the patient is admitted.'
    if (d.patient.name.trim().length < 2) e['patient.name'] = "Enter the patient's full name."
    const age = Number(d.patient.age)
    if (!/^\d{1,3}$/.test(d.patient.age.trim()) || age > 120) e['patient.age'] = 'Enter age in years (use 0 for infants).'
    if (!d.patient.gender) e['patient.gender'] = 'Select one.'
    if (!d.patient.bloodGroup) e['patient.bloodGroup'] = "Select the patient's blood group as confirmed by the hospital lab."
  }
  if (step === 1) {
    if (d.lines.length === 0) e.lines = 'Add at least one blood component.'
    const seen = new Set<string>()
    for (const l of d.lines) {
      const g = lineGroup(l, d)
      if (!g) {
        e[`line.${l.key}.group`] = 'Choose a blood group.'
        continue
      }
      if (l.units < 1 || l.units > MAX_UNITS) e[`line.${l.key}.units`] = `Choose between 1 and ${MAX_UNITS} units.`
      const dupKey = `${l.component}-${g}`
      if (seen.has(dupKey)) e[`line.${l.key}.group`] = 'This component and group is already listed. Increase units on that line instead.'
      seen.add(dupKey)
      const patientGroup = d.patient.bloodGroup
      if (patientGroup && g !== patientGroup && !canReceive(patientGroup, g, l.component))
        e[`line.${l.key}.group`] = `${g} ${COMPONENTS[l.component].short.toLowerCase()} is not compatible with a ${patientGroup} patient.`
      const stock = ctx.lineStock[l.key]
      if (stock?.shortEverywhere && !e[`line.${l.key}.group`])
        e[`line.${l.key}.stock`] = 'Not enough units at any single centre right now.'
    }
    const lineErrors = Object.keys(e).length > 0
    if (!lineErrors && ctx.ranked.length && !ctx.ranked[0].fulfillable)
      e.stock = 'No single centre can supply all of these together right now. Reduce units or place separate orders.'
  }
  if (step === 2) {
    if (d.prescriber.doctorName.trim().length < 3) e.doctorName = "Enter the treating doctor's full name."
    if (!REG_NO.test(d.prescriber.registrationNo.trim()))
      e.registrationNo = 'Enter the State Medical Council or NMC registration number.'
    if (!d.prescriber.fileName) e.file = 'Upload the signed blood requisition form.'
    if (!d.consent.prescription) e['consent.prescription'] = 'Required to continue.'
    if (!d.consent.transfusionAtFacility) e['consent.transfusionAtFacility'] = 'Required to continue.'
    if (!d.consent.terms) e['consent.terms'] = 'Required to continue.'
  }
  return e
}

export function toOrderDraft(d: Draft, hospitalId: string): OrderDraft {
  const optional = (s: string) => (s.trim() ? s.trim() : undefined)
  return {
    priority: d.priority,
    items: draftItems(d),
    hospitalId,
    patient: {
      name: d.patient.name.trim(),
      age: Number(d.patient.age),
      gender: d.patient.gender || 'other',
      bloodGroup: d.patient.bloodGroup!,
      uhid: optional(d.patient.uhid),
      ward: optional(d.patient.ward),
      diagnosis: optional(d.patient.diagnosis),
    },
    prescriber: {
      doctorName: d.prescriber.doctorName.trim(),
      registrationNo: d.prescriber.registrationNo.trim(),
      requisitionFileName: d.prescriber.fileName,
    },
    consent: d.consent,
    notes: optional(d.notes),
  }
}

// ---------- query-string prefill ----------

export function parseGroup(raw: string | null): BloodGroup | null {
  if (!raw) return null
  const g = raw
    .trim()
    .toUpperCase()
    .replace(/\s/g, '+') // "O+" arrives as "O " when not URL-encoded
    .replace(/POS(ITIVE)?$/, '+')
    .replace(/NEG(ATIVE)?$/, '-')
    .replace(/[^ABO+-]/g, '')
  return (BLOOD_GROUPS as string[]).includes(g) ? (g as BloodGroup) : null
}

export function applyQuery(draft: Draft, params: URLSearchParams): Draft | null {
  const group = parseGroup(params.get('group'))
  const compRaw = params.get('component')?.trim().toUpperCase()
  const component = compRaw && (COMPONENT_CODES as string[]).includes(compRaw) ? (compRaw as ComponentCode) : null
  const unitsRaw = Number.parseInt(params.get('units') ?? '', 10)
  const units = Number.isFinite(unitsRaw) ? Math.min(MAX_UNITS, Math.max(1, unitsRaw)) : null
  const prRaw = params.get('priority')?.trim().toLowerCase()
  const priority = prRaw && (PRIORITY_KEYS as string[]).includes(prRaw) ? (prRaw as Priority) : null
  if (!group && !component && !units && !priority) return null

  const next: Draft = { ...draft, patient: { ...draft.patient }, lines: [...draft.lines] }
  if (priority) next.priority = priority
  if (group && !next.patient.bloodGroup) next.patient.bloodGroup = group
  if (group || component || units) {
    const first = next.lines[0] ?? newLine()
    next.lines[0] = {
      ...first,
      component: component ?? first.component,
      units: units ?? first.units,
      group: group && group !== next.patient.bloodGroup ? group : group ? null : first.group,
    }
  }
  return next
}

// ---------- session persistence ----------

const STORAGE_KEY = 'rf-order-draft-v1'

function str(v: unknown, fallback = '') {
  return typeof v === 'string' ? v : fallback
}

function sanitize(raw: unknown): { draft: Draft; step: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as { draft?: Partial<Draft>; step?: unknown }
  const d = r.draft
  if (!d || typeof d !== 'object') return null
  const base = emptyDraft()
  const p = (d.patient ?? {}) as Partial<PatientDraft>
  const pr = (d.prescriber ?? {}) as Partial<PrescriberDraft>
  const c = (d.consent ?? {}) as Partial<Order['consent']>
  const isGroup = (g: unknown): g is BloodGroup => typeof g === 'string' && (BLOOD_GROUPS as string[]).includes(g)
  const lines = Array.isArray(d.lines)
    ? d.lines
        .filter((l): l is LineDraft => !!l && typeof l === 'object' && (COMPONENT_CODES as string[]).includes((l as LineDraft).component))
        .map((l) => ({
          key: str(l.key) || newLine().key,
          component: l.component,
          group: isGroup(l.group) ? l.group : null,
          units: Math.min(MAX_UNITS, Math.max(1, Math.round(Number(l.units) || 1))),
        }))
    : base.lines
  const gender = p.gender === 'female' || p.gender === 'male' || p.gender === 'other' ? p.gender : ''
  const draft: Draft = {
    hospitalId: str(d.hospitalId),
    patient: {
      name: str(p.name),
      age: str(p.age),
      gender,
      bloodGroup: isGroup(p.bloodGroup) ? p.bloodGroup : null,
      uhid: str(p.uhid),
      ward: str(p.ward),
      diagnosis: str(p.diagnosis),
    },
    priority: (PRIORITY_KEYS as unknown[]).includes(d.priority) ? (d.priority as Priority) : base.priority,
    lines: lines.length ? lines : base.lines,
    prescriber: {
      doctorName: str(pr.doctorName),
      registrationNo: str(pr.registrationNo),
      fileName: str(pr.fileName),
      fileSize: typeof pr.fileSize === 'number' ? pr.fileSize : 0,
    },
    notes: str(d.notes),
    consent: { prescription: c.prescription === true, transfusionAtFacility: c.transfusionAtFacility === true, terms: c.terms === true },
  }
  const step = typeof r.step === 'number' && r.step >= 0 && r.step < ORDER_STEPS.length ? Math.floor(r.step) : 0
  return { draft, step }
}

export function loadStoredDraft(): { draft: Draft; step: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function storeDraft(draft: Draft, step: number) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, step }))
  } catch {
    /* storage full or blocked: the form still works, it just won't survive a reload */
  }
}

export function clearStoredDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
