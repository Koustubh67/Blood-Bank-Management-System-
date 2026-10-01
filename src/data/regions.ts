/**
 * State codes used by e-RaktKosh, the national blood-centre network run by the
 * Ministry of Health & Family Welfare. Taken from its public master list.
 */
export interface EraktkoshState {
  code: string
  name: string
}

export const ERAKTKOSH_STATES: EraktkoshState[] = [
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '18', name: 'Assam' },
  { code: '10', name: 'Bihar' },
  { code: '94', name: 'Chandigarh' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '25', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '97', name: 'Delhi' },
  { code: '30', name: 'Goa' },
  { code: '24', name: 'Gujarat' },
  { code: '96', name: 'Haryana' },
  { code: '92', name: 'Himachal Pradesh' },
  { code: '91', name: 'Jammu and Kashmir' },
  { code: '20', name: 'Jharkhand' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '37', name: 'Ladakh' },
  { code: '31', name: 'Lakshadweep' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '27', name: 'Maharashtra' },
  { code: '14', name: 'Manipur' },
  { code: '17', name: 'Meghalaya' },
  { code: '15', name: 'Mizoram' },
  { code: '13', name: 'Nagaland' },
  { code: '21', name: 'Odisha' },
  { code: '34', name: 'Puducherry' },
  { code: '93', name: 'Punjab' },
  { code: '98', name: 'Rajasthan' },
  { code: '11', name: 'Sikkim' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '16', name: 'Tripura' },
  { code: '99', name: 'Uttar Pradesh' },
  { code: '95', name: 'Uttarakhand' },
  { code: '19', name: 'West Bengal' },
]

/** Delhi, where the RaktFlow pilot runs. */
export const DEFAULT_STATE_CODE = '97'

const squash = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '')

/** Match a state name from a geocoder ("NCT of Delhi", "Jammu & Kashmir") to an e-RaktKosh state. */
export function stateByName(name: string | undefined) {
  if (!name) return undefined
  const q = squash(name)
  return ERAKTKOSH_STATES.find((s) => squash(s.name) === q) ?? ERAKTKOSH_STATES.find((s) => q.includes(squash(s.name)))
}

export function stateByCode(code: string) {
  return ERAKTKOSH_STATES.find((s) => s.code === code)
}
