import type { LatLng } from '@/types'
import { distanceMeters } from '@/lib/utils'

/**
 * Cities RaktFlow serves: at least one in every state and union territory.
 * `stateCode` is the state's code on e-RaktKosh, used for the camp schedule.
 */
export interface City {
  id: string
  name: string
  state: string
  stateCode: string
  center: LatLng
}

export const CITIES: City[] = [
  { id: 'delhi', name: 'New Delhi', state: 'Delhi', stateCode: '97', center: { lat: 28.6139, lng: 77.209 } },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', stateCode: '27', center: { lat: 19.076, lng: 72.8777 } },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', stateCode: '27', center: { lat: 18.5204, lng: 73.8567 } },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', stateCode: '29', center: { lat: 12.9716, lng: 77.5946 } },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', stateCode: '33', center: { lat: 13.0827, lng: 80.2707 } },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', stateCode: '19', center: { lat: 22.5726, lng: 88.3639 } },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', stateCode: '36', center: { lat: 17.385, lng: 78.4867 } },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', stateCode: '24', center: { lat: 23.0225, lng: 72.5714 } },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', stateCode: '98', center: { lat: 26.9124, lng: 75.7873 } },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', stateCode: '99', center: { lat: 26.8467, lng: 80.9462 } },
  { id: 'gurugram', name: 'Gurugram', state: 'Haryana', stateCode: '96', center: { lat: 28.4595, lng: 77.0266 } },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', stateCode: '94', center: { lat: 30.7333, lng: 76.7794 } },
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', stateCode: '93', center: { lat: 30.901, lng: 75.8573 } },
  { id: 'patna', name: 'Patna', state: 'Bihar', stateCode: '10', center: { lat: 25.5941, lng: 85.1376 } },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', stateCode: '23', center: { lat: 23.2599, lng: 77.4126 } },
  { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', stateCode: '22', center: { lat: 21.2514, lng: 81.6296 } },
  { id: 'ranchi', name: 'Ranchi', state: 'Jharkhand', stateCode: '20', center: { lat: 23.3441, lng: 85.3096 } },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', stateCode: '21', center: { lat: 20.2961, lng: 85.8245 } },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', stateCode: '18', center: { lat: 26.1445, lng: 91.7362 } },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', stateCode: '32', center: { lat: 9.9312, lng: 76.2673 } },
  { id: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', stateCode: '28', center: { lat: 16.5062, lng: 80.648 } },
  { id: 'panaji', name: 'Panaji', state: 'Goa', stateCode: '30', center: { lat: 15.4909, lng: 73.8278 } },
  { id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', stateCode: '95', center: { lat: 30.3165, lng: 78.0322 } },
  { id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', stateCode: '92', center: { lat: 31.1048, lng: 77.1734 } },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu and Kashmir', stateCode: '91', center: { lat: 34.0837, lng: 74.7973 } },
  { id: 'leh', name: 'Leh', state: 'Ladakh', stateCode: '37', center: { lat: 34.1526, lng: 77.5771 } },
  { id: 'puducherry', name: 'Puducherry', state: 'Puducherry', stateCode: '34', center: { lat: 11.9416, lng: 79.8083 } },
  { id: 'gangtok', name: 'Gangtok', state: 'Sikkim', stateCode: '11', center: { lat: 27.3389, lng: 88.6065 } },
  { id: 'shillong', name: 'Shillong', state: 'Meghalaya', stateCode: '17', center: { lat: 25.5788, lng: 91.8933 } },
  { id: 'imphal', name: 'Imphal', state: 'Manipur', stateCode: '14', center: { lat: 24.817, lng: 93.9368 } },
  { id: 'aizawl', name: 'Aizawl', state: 'Mizoram', stateCode: '15', center: { lat: 23.7271, lng: 92.7176 } },
  { id: 'kohima', name: 'Kohima', state: 'Nagaland', stateCode: '13', center: { lat: 25.6751, lng: 94.1086 } },
  { id: 'itanagar', name: 'Itanagar', state: 'Arunachal Pradesh', stateCode: '12', center: { lat: 27.0844, lng: 93.6053 } },
  { id: 'agartala', name: 'Agartala', state: 'Tripura', stateCode: '16', center: { lat: 23.8315, lng: 91.2868 } },
  { id: 'port-blair', name: 'Sri Vijaya Puram', state: 'Andaman and Nicobar Islands', stateCode: '35', center: { lat: 11.6234, lng: 92.7265 } },
  { id: 'daman', name: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: '25', center: { lat: 20.3974, lng: 72.8328 } },
  { id: 'kavaratti', name: 'Kavaratti', state: 'Lakshadweep', stateCode: '31', center: { lat: 10.5669, lng: 72.642 } },
]

export const DEFAULT_CITY_ID = 'delhi'

/** Beyond this, a location is treated as outside the city's delivery area. */
export const CITY_RADIUS_M = 40_000

export function cityById(id: string | undefined): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0]
}

/** Nearest served city to a point, and how far away it is. */
export function nearestCity(point: LatLng): { city: City; distanceM: number } {
  let city = CITIES[0]
  let best = Infinity
  for (const c of CITIES) {
    const d = distanceMeters(point, c.center)
    if (d < best) {
      best = d
      city = c
    }
  }
  return { city, distanceM: best }
}

/** Cities grouped by state, states in alphabetical order, for pickers. */
export function citiesByState() {
  const map = new Map<string, City[]>()
  for (const c of [...CITIES].sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name))) {
    map.set(c.state, [...(map.get(c.state) ?? []), c])
  }
  return [...map.entries()].map(([state, cities]) => ({ state, cities }))
}
