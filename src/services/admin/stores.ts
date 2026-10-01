import type { CityScope, OpsStore, StoreKind } from './types'
import { SEED_CENTRES } from '@/data/network'
import { OUTLETS } from '@/data/outlets'
import { cityById } from '@/data/cities'
import { hashString, seeded } from '@/lib/utils'

export const ALL_INDIA = 'all'

export const STORE_KIND_LABEL: Record<StoreKind, string> = {
  centre: 'Blood centre',
  outlet: 'Outlet',
}

function busyness(id: string, kind: StoreKind, cityId: string) {
  const r = seeded(hashString(`busy:${id}`))()
  const base = kind === 'centre' ? 1 + r * 0.6 : 0.6 + r * 0.6
  // The pilot city and the hubs carry the most traffic.
  return Math.round(base * (cityId === 'delhi' ? 1.2 : 1) * (id.endsWith('-1') || id === 'BC-CP' ? 1.15 : 1) * 100) / 100
}

/** Every store in the network: licensed blood centres first, then outlets. */
export const STORES: OpsStore[] = [
  ...SEED_CENTRES.map(
    (c): OpsStore => ({
      id: c.id,
      kind: 'centre',
      cityId: c.cityId,
      name: c.name,
      area: c.area,
      location: c.location,
      licenseNo: c.licenseNo,
      open24x7: c.open24x7,
      busyness: busyness(c.id, 'centre', c.cityId),
      rto: c.licenseNo.slice(0, 2),
    }),
  ),
  ...OUTLETS.map(
    (o): OpsStore => ({
      id: o.id,
      kind: 'outlet',
      cityId: o.cityId,
      name: o.name,
      area: o.area,
      location: o.location,
      licenseNo: o.licenseNo,
      open24x7: o.open24x7,
      motherCentreId: o.motherCentreId,
      capacityUnits: o.capacityUnits,
      openedOn: o.openedOn,
      busyness: busyness(o.id, 'outlet', o.cityId),
      rto: o.licenseNo.slice(0, 2),
    }),
  ),
]

const BY_ID = new Map(STORES.map((s) => [s.id, s]))

export function storeById(id: string | undefined) {
  return id ? BY_ID.get(id) : undefined
}

export function storesIn(scope: CityScope) {
  return scope === ALL_INDIA ? STORES : STORES.filter((s) => s.cityId === scope)
}

/** "Hub · Kurla West", "Outlet · Saket" or the centre's own name: short enough for cards. */
export function shortStoreName(s: OpsStore | undefined) {
  if (!s) return 'Unknown store'
  if (s.name.startsWith('RaktFlow Hub')) return `Hub · ${s.area}`
  if (s.name.startsWith('RaktFlow Outlet')) return `Outlet · ${s.area}`
  const brand = s.name.replace(/ (Regional )?Blood (Centre|Bank|Storage Unit)$/, '').replace(' Community', '')
  return brand === s.area ? `${brand} centre` : `${brand} · ${s.area}`
}

export function scopeLabel(scope: CityScope) {
  return scope === ALL_INDIA ? 'All India' : cityById(scope).name
}
