import { useMemo } from 'react'
import { create } from 'zustand'
import { useDB } from '@/store/db'
import type { BloodGroup, ComponentCode, Inventory } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, COMPONENT_CODES } from '@/data/blood'
import { SEED_CENTRES } from '@/data/network'
import { useCity, useLocationStore } from './location'

export interface ActivityEvent {
  id: number
  at: number
  kind: 'received' | 'issued'
  centreId: string
  group: BloodGroup
  component: ComponentCode
  units: number
}

/** In-memory live feed (not persisted), shown as "what's happening now". */
export const useActivity = create<{ events: ActivityEvent[] }>(() => ({ events: [] }))

export function aggregateInventory(invs: Inventory[]): Inventory {
  const out = {} as Inventory
  for (const g of BLOOD_GROUPS) {
    out[g] = {} as Record<ComponentCode, number>
    for (const c of COMPONENT_CODES) out[g][c] = invs.reduce((s, inv) => s + inv[g][c], 0)
  }
  return out
}

/** Every centre in every city. Use `useCityCentres` for what a visitor should see. */
export function useCentres() {
  return useDB((s) => s.centres)
}

/** Centres in one city (defaults to the visitor's chosen city). */
export function useCityCentres(cityId?: string) {
  const current = useCity().id
  const id = cityId ?? current
  const centres = useDB((s) => s.centres)
  return useMemo(() => centres.filter((c) => c.cityId === id), [centres, id])
}

/** Units across one city's centres, updating live. */
export function useCityStock(cityId?: string) {
  const centres = useCityCentres(cityId)
  return useMemo(() => aggregateInventory(centres.map((c) => c.inventory)), [centres])
}

/** Units across the whole network, updating live. */
export function useNetworkStock() {
  const centres = useDB((s) => s.centres)
  return useMemo(() => aggregateInventory(centres.map((c) => c.inventory)), [centres])
}

export type StockLevel = 'out' | 'low' | 'ok' | 'good'

export function stockLevel(units: number): StockLevel {
  if (units <= 0) return 'out'
  if (units < 5) return 'low'
  if (units < 20) return 'ok'
  return 'good'
}

let timer: ReturnType<typeof setTimeout> | undefined
let nextEventId = 1

/** One simulated network change: a donation arriving or a unit being issued. */
function simulateStep(at: number) {
  const { centres, _set } = useDB.getState()
  // Mostly the visitor's own city, so their live feeds stay busy.
  const cityId = useLocationStore.getState().cityId
  const local = centres.filter((c) => c.cityId === cityId)
  const pool = local.length && Math.random() < 0.8 ? local : centres
  const centre = pool[Math.floor(Math.random() * pool.length)]
  const seed = SEED_CENTRES.find((c) => c.id === centre.id)
  const group = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)]
  const component = COMPONENT_CODES[Math.floor(Math.random() * COMPONENT_CODES.length)]
  const current = centre.inventory[group][component]
  const target = seed?.inventory[group][component] ?? current
  // Drift toward seed level with some randomness.
  const receive = current < target || (current === target && Math.random() < 0.5)
  const units = 1 + Math.floor(Math.random() * 2)
  if (!receive && current < units) return
  _set((s) => ({
    centres: s.centres.map((c) => {
      if (c.id !== centre.id) return c
      const inventory = structuredClone(c.inventory)
      inventory[group][component] += receive ? units : -units
      return { ...c, inventory }
    }),
  }))
  const event: ActivityEvent = { id: nextEventId++, at, kind: receive ? 'received' : 'issued', centreId: centre.id, group, component, units }
  useActivity.setState((s) => ({ events: [event, ...s.events].sort((a, b) => b.at - a.at).slice(0, 30) }))
}

/**
 * Simulates the rest of the network: donations arriving and units being
 * issued to walk-in hospitals. Keeps stock drifting around seed levels so the
 * demo always looks alive but never runs dry.
 */
export function startNetworkSimulation() {
  if (timer) return
  // A little recent history so live feeds aren't empty on first paint.
  const now = Date.now()
  for (const ago of [48_000, 31_000, 17_000, 6_000]) simulateStep(now - ago)
  const schedule = () => {
    timer = setTimeout(() => {
      simulateStep(Date.now())
      schedule()
    }, 6000 + Math.random() * 8000)
  }
  schedule()
}

export function describeEvent(e: ActivityEvent, centreName: string) {
  const what = `${e.units} unit${e.units > 1 ? 's' : ''} ${e.group} ${COMPONENTS[e.component].short.toLowerCase()}`
  return e.kind === 'received' ? `${what} added at ${centreName}` : `${what} issued from ${centreName}`
}
