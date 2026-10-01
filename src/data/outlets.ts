import type { Outlet } from '@/types'
import { NATIONAL_OUTLETS } from './nationalNetwork'

/**
 * RaktFlow outlets: blood storage centres placed within a short ride of the
 * city's busiest hospitals, so emergency units start their journey minutes
 * away. Under the Drugs & Cosmetics Rules a storage centre only holds units
 * issued by a licensed "mother" blood centre, which is why each outlet points
 * at one of the partner centres in `network.ts`.
 *
 * The outlets are fictional (demo licences); their positions are real places,
 * so distances to real hospitals on the map are meaningful. Delhi's are
 * hand-placed; other cities come from `nationalNetwork.ts`.
 */
const DELHI_OUTLETS: Outlet[] = [
  { id: 'OUT-ANS', cityId: 'delhi', name: 'RaktFlow Outlet · Ansari Nagar', area: 'Ansari Nagar', location: { lat: 28.5712, lng: 77.2131 }, licenseNo: 'DL-BSC-0101 (demo)', motherCentreId: 'BC-LN', open24x7: true, capacityUnits: 120, openedOn: '2025-08-14' },
  { id: 'OUT-BKS', cityId: 'delhi', name: 'RaktFlow Outlet · Baba Kharak Singh Marg', area: 'Connaught Place', location: { lat: 28.6301, lng: 77.2066 }, licenseNo: 'DL-BSC-0102 (demo)', motherCentreId: 'BC-CP', open24x7: true, capacityUnits: 100, openedOn: '2025-09-02' },
  { id: 'OUT-RJN', cityId: 'delhi', name: 'RaktFlow Outlet · Rajinder Nagar', area: 'Old Rajinder Nagar', location: { lat: 28.6402, lng: 77.1853 }, licenseNo: 'DL-BSC-0103 (demo)', motherCentreId: 'BC-KB', open24x7: true, capacityUnits: 90, openedOn: '2025-10-20' },
  { id: 'OUT-TIS', cityId: 'delhi', name: 'RaktFlow Outlet · Tis Hazari', area: 'Tis Hazari', location: { lat: 28.6688, lng: 77.2163 }, licenseNo: 'DL-BSC-0104 (demo)', motherCentreId: 'BC-CP', open24x7: true, capacityUnits: 80, openedOn: '2025-11-11' },
  { id: 'OUT-DGT', cityId: 'delhi', name: 'RaktFlow Outlet · Daryaganj', area: 'Daryaganj', location: { lat: 28.6448, lng: 77.2391 }, licenseNo: 'DL-BSC-0105 (demo)', motherCentreId: 'BC-CP', open24x7: true, capacityUnits: 80, openedOn: '2026-01-08' },
  { id: 'OUT-SKT', cityId: 'delhi', name: 'RaktFlow Outlet · Saket', area: 'Saket', location: { lat: 28.5301, lng: 77.2183 }, licenseNo: 'DL-BSC-0106 (demo)', motherCentreId: 'BC-LN', open24x7: true, capacityUnits: 100, openedOn: '2026-02-17' },
  { id: 'OUT-SVR', cityId: 'delhi', name: 'RaktFlow Outlet · Sarita Vihar', area: 'Sarita Vihar', location: { lat: 28.5489, lng: 77.2801 }, licenseNo: 'DL-BSC-0107 (demo)', motherCentreId: 'BC-LN', open24x7: true, capacityUnits: 90, openedOn: '2026-03-05' },
  { id: 'OUT-PPG', cityId: 'delhi', name: 'RaktFlow Outlet · Patparganj', area: 'Patparganj', location: { lat: 28.6279, lng: 77.3058 }, licenseNo: 'DL-BSC-0108 (demo)', motherCentreId: 'BC-MV', open24x7: true, capacityUnits: 80, openedOn: '2026-04-22' },
  { id: 'OUT-JKP', cityId: 'delhi', name: 'RaktFlow Outlet · Janakpuri', area: 'Janakpuri', location: { lat: 28.6238, lng: 77.1004 }, licenseNo: 'DL-BSC-0109 (demo)', motherCentreId: 'BC-DW', open24x7: false, capacityUnits: 70, openedOn: '2026-06-10' },
  { id: 'OUT-SLB', cityId: 'delhi', name: 'RaktFlow Outlet · Shalimar Bagh', area: 'Shalimar Bagh', location: { lat: 28.7168, lng: 77.1621 }, licenseNo: 'DL-BSC-0110 (demo)', motherCentreId: 'BC-RH', open24x7: true, capacityUnits: 70, openedOn: '2026-07-29' },
]

export const OUTLETS: Outlet[] = [...DELHI_OUTLETS, ...NATIONAL_OUTLETS]

export function outletsInCity(cityId: string) {
  return OUTLETS.filter((o) => o.cityId === cityId)
}

export function outletById(id: string) {
  return OUTLETS.find((o) => o.id === id)
}
