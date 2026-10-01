import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * How loudly the console announces new orders, and whether the simulated
 * order feed is running. Kept per device, separate from the ops data.
 */
export type PopupLevel = 'all' | 'emergency' | 'off'

interface AlertPrefs {
  /** Which new orders get a pop-up */
  popups: PopupLevel
  /** Simulated hospital orders keep arriving */
  feedOn: boolean
}

export const useAlertPrefs = create<AlertPrefs>()(
  persist((): AlertPrefs => ({ popups: 'emergency', feedOn: true }), {
    name: 'raktflow-ops-alerts',
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
)

export function setPopups(popups: PopupLevel) {
  useAlertPrefs.setState({ popups })
}

export function setFeedOn(feedOn: boolean) {
  useAlertPrefs.setState({ feedOn })
}

export const POPUP_LABEL: Record<PopupLevel, string> = {
  all: 'Every new order',
  emergency: 'Emergencies only',
  off: 'Off',
}
