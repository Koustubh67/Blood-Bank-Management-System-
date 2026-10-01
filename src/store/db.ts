import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BloodCentre, CampPledge, DonorProfile, Order, User } from '@/types'
import { SEED_CENTRES } from '@/data/network'

/**
 * Browser-side "database".
 *
 * Every collection lives here and is persisted to localStorage, so the app
 * behaves like it has a backend: reloads keep data, and other open tabs see
 * changes (a hospital dashboard in one tab updates when an order is paid in
 * another). Pages must go through `src/services/*` for writes; the services
 * are the seam where a real REST/GraphQL API will be plugged in later.
 */

export interface StoredUser extends User {
  passwordHash: string
}

interface DBState {
  users: StoredUser[]
  orders: Order[]
  donors: DonorProfile[]
  /** Camp pledges. Older saved databases have no such key; the default merge fills it in. */
  pledges: CampPledge[]
  centres: BloodCentre[]
  session: { userId: string | null }
  /** Raw setter used by services only. */
  _set: (fn: (s: DBState) => Partial<DBState>) => void
}

export const DB_KEY = 'raktflow-db-v1'

export const useDB = create<DBState>()(
  persist(
    (set) => ({
      users: [],
      orders: [],
      donors: [],
      pledges: [],
      centres: SEED_CENTRES,
      session: { userId: null },
      _set: (fn) => set((s) => fn(s)),
    }),
    {
      name: DB_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ _set: _ignored, ...rest }) => rest,
      // Saved databases predate new cities: keep their live stock, add any new seed centres.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<DBState>
        const savedCentres = (saved.centres ?? []).map((c) => ({ ...c, cityId: c.cityId ?? SEED_CENTRES.find((s) => s.id === c.id)?.cityId ?? 'delhi' }))
        const centres = [...savedCentres, ...current.centres.filter((c) => !savedCentres.some((s) => s.id === c.id))]
        return { ...current, ...saved, centres }
      },
    },
  ),
)

// Keep tabs in sync: another tab wrote to the DB, reload our copy.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) void useDB.persist.rehydrate()
  })
}

/** Wipe everything back to seed data (used by the demo reset button). */
export function resetDatabase() {
  useDB.setState({
    users: [],
    orders: [],
    donors: [],
    pledges: [],
    centres: SEED_CENTRES,
    session: { userId: null },
  })
}
