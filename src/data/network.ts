import type { BloodCentre, BloodGroup, ComponentCode, Inventory, LatLng, PartnerHospital } from '@/types'
import { BLOOD_GROUPS, COMPONENT_CODES, GROUP_PREVALENCE } from './blood'
import { hashString, seeded } from '@/lib/utils'
import { NATIONAL_CENTRES, NATIONAL_HOSPITALS } from './nationalNetwork'

/**
 * The pilot city, used as the default before a visitor picks a location.
 * Delhi's network below is hand-made; other cities come from
 * `nationalNetwork.ts`. All centres and partner hospitals are fictional.
 */
export const SERVICE_CITY = {
  name: 'New Delhi',
  center: { lat: 28.6139, lng: 77.209 } as LatLng,
}

const COMPONENT_WEIGHT: Record<ComponentCode, number> = {
  PRBC: 1,
  WB: 0.25,
  FFP: 0.8,
  PLT: 0.35,
  CRYO: 0.2,
}

export function seedInventory(seed: number, scale = 60): Inventory {
  const rand = seeded(seed)
  const inv = {} as Inventory
  for (const g of BLOOD_GROUPS) {
    inv[g] = {} as Record<ComponentCode, number>
    for (const c of COMPONENT_CODES) {
      const base = scale * GROUP_PREVALENCE[g] * COMPONENT_WEIGHT[c]
      // A small floor so rare groups aren't permanently at zero in the demo.
      inv[g][c] = Math.max(c === 'PRBC' ? 3 : 1, Math.round(base * (0.5 + rand())))
    }
  }
  return inv
}

const off = (dLat: number, dLng: number): LatLng => ({
  lat: SERVICE_CITY.center.lat + dLat,
  lng: SERVICE_CITY.center.lng + dLng,
})

const DELHI_CENTRES: BloodCentre[] = [
  { id: 'BC-CP', cityId: 'delhi', name: 'RaktFlow Hub · Connaught Place', area: 'Connaught Place', location: off(0.0176, 0.0077), licenseNo: 'DL-BC-0001 (demo)', open24x7: true, rating: 4.9, inventory: seedInventory(11) },
  { id: 'BC-KB', cityId: 'delhi', name: 'Lifeline Blood Centre', area: 'Karol Bagh', location: off(0.0385, -0.0187), licenseNo: 'DL-BC-0002 (demo)', open24x7: true, rating: 4.7, inventory: seedInventory(23) },
  { id: 'BC-LN', cityId: 'delhi', name: 'Sanjeevani Regional Blood Centre', area: 'Lajpat Nagar', location: off(-0.0460, 0.0340), licenseNo: 'DL-BC-0003 (demo)', open24x7: true, rating: 4.8, inventory: seedInventory(37) },
  { id: 'BC-DW', cityId: 'delhi', name: 'Dwarka Community Blood Bank', area: 'Dwarka', location: off(-0.0270, -0.1470), licenseNo: 'DL-BC-0004 (demo)', open24x7: false, rating: 4.6, inventory: seedInventory(41) },
  { id: 'BC-RH', cityId: 'delhi', name: 'Northstar Blood Storage Unit', area: 'Rohini', location: off(0.1190, -0.0980), licenseNo: 'DL-BSU-0005 (demo)', open24x7: true, rating: 4.5, inventory: seedInventory(53, 35) },
  { id: 'BC-MV', cityId: 'delhi', name: 'Eastside Blood Centre', area: 'Mayur Vihar', location: off(-0.0060, 0.0880), licenseNo: 'DL-BC-0006 (demo)', open24x7: true, rating: 4.7, inventory: seedInventory(67) },
]

const DELHI_HOSPITALS: PartnerHospital[] = [
  { id: 'H-CC', cityId: 'delhi', name: 'CityCare Multispeciality Hospital', area: 'Rajendra Place', location: off(0.0270, -0.0320), registrationNo: 'DL-CE-1101 (demo)', beds: 320 },
  { id: 'H-SM', cityId: 'delhi', name: 'Saket Meridian Hospital', area: 'Saket', location: off(-0.0890, 0.0060), registrationNo: 'DL-CE-1102 (demo)', beds: 450 },
  { id: 'H-GK', cityId: 'delhi', name: 'Greenpark Heart & Trauma Institute', area: 'Green Park', location: off(-0.0580, -0.0030), registrationNo: 'DL-CE-1103 (demo)', beds: 210 },
  { id: 'H-PV', cityId: 'delhi', name: 'Patparganj Valley Hospital', area: 'Patparganj', location: off(0.0080, 0.0960), registrationNo: 'DL-CE-1104 (demo)', beds: 280 },
  { id: 'H-JN', cityId: 'delhi', name: 'Janakpuri Mother & Child Hospital', area: 'Janakpuri', location: off(0.0120, -0.1010), registrationNo: 'DL-CE-1105 (demo)', beds: 150 },
  { id: 'H-CL', cityId: 'delhi', name: 'Civil Lines General Hospital', area: 'Civil Lines', location: off(0.0660, 0.0150), registrationNo: 'DL-CE-1106 (demo)', beds: 600 },
  { id: 'H-VK', cityId: 'delhi', name: 'Vasant Kunj Critical Care', area: 'Vasant Kunj', location: off(-0.0960, -0.0520), registrationNo: 'DL-CE-1107 (demo)', beds: 180 },
  { id: 'H-DW', cityId: 'delhi', name: 'Dwarka Sector 12 Nursing Home', area: 'Dwarka', location: off(-0.0180, -0.1600), registrationNo: 'DL-NH-1108 (demo)', beds: 60 },
]

export const SEED_CENTRES: BloodCentre[] = [
  ...DELHI_CENTRES,
  ...NATIONAL_CENTRES.map((c) => ({ ...c, inventory: seedInventory(hashString(c.id), 45) })),
]

export const PARTNER_HOSPITALS: PartnerHospital[] = [...DELHI_HOSPITALS, ...NATIONAL_HOSPITALS]

export function hospitalById(id: string) {
  return PARTNER_HOSPITALS.find((h) => h.id === id)
}

export function hospitalsInCity(cityId: string) {
  return PARTNER_HOSPITALS.filter((h) => h.cityId === cityId)
}

export function totalUnits(inv: Inventory, group?: BloodGroup, component?: ComponentCode) {
  let sum = 0
  for (const g of BLOOD_GROUPS) {
    if (group && g !== group) continue
    for (const c of COMPONENT_CODES) {
      if (component && c !== component) continue
      sum += inv[g][c]
    }
  }
  return sum
}
