import { useEffect } from 'react'
import type { CityScope, OpsOrder } from '@/services/admin/types'
import { cancelRush, resumeAfterPause, simulateRush, spawnOrder, tick, useRush } from '@/services/admin/engine'
import { describeItems, hospitalName, useOps } from '@/services/admin/store'
import { PRIORITY_LABEL } from '@/services/admin/priority'
import { scopeLabel } from '@/services/admin/stores'
import { useAlertPrefs } from '@/services/admin/alerts'
import { cityById } from '@/data/cities'
import { playSound } from '@/lib/sound'
import { toast } from '@/components/ui/Toast'

/** At most one chime in this window, however many orders land. */
const CHIME_GAP_MS = 8000
let lastChime = 0

function chime() {
  const now = Date.now()
  if (now - lastChime < CHIME_GAP_MS) return
  lastChime = now
  playSound('alert')
}

/** Chime and pop-up for a new order, as loud as the admin's alert settings allow. */
export function announceOrder(o: OpsOrder) {
  const { popups } = useAlertPrefs.getState()
  if (popups === 'off') return
  if (popups === 'emergency' && o.priority !== 'emergency') return
  chime()
  toast.info(`New ${PRIORITY_LABEL[o.priority].toLowerCase()} order · ${cityById(o.cityId).name}`, `${describeItems(o)} for ${hospitalName(o)}`)
}

/**
 * Rush hour: one notice when it starts and one summary when it ends, instead
 * of a pop-up per order. The orders themselves still land on the board.
 */
export function startRush(scope: CityScope) {
  if (useRush.getState().running) return
  const city = scopeLabel(scope === 'all' ? 'delhi' : scope)
  if (useAlertPrefs.getState().popups !== 'off') {
    chime()
    toast.info(`Rush hour started in ${city}`, '12 orders over the next 30 seconds. You can stop it any time.')
  }
  let emergencies = 0
  simulateRush(
    scope,
    (o) => {
      if (o.priority === 'emergency') emergencies++
    },
    (total) => {
      if (useAlertPrefs.getState().popups !== 'off')
        toast.success(`Rush hour over in ${city}`, `${total} orders added, ${emergencies} of them emergencies. Check the board and dispatch.`)
    },
  )
}

export function stopRush() {
  const { spawned, running } = useRush.getState()
  if (!running) return
  cancelRush()
  toast.info('Rush hour stopped', `${spawned} ${spawned === 1 ? 'order was' : 'orders were'} added before you stopped it.`)
}

/**
 * Runs the operations simulator while any admin page is open: a one-second
 * tick, and a new hospital order every 20–40 seconds for the selected city
 * (a random city for All India). Arrivals skip while the feed is paused or a
 * rush is running.
 */
export function OpsEngine() {
  useEffect(() => {
    resumeAfterPause(Date.now())
    tick(Date.now())
    const ticker = window.setInterval(() => tick(Date.now()), 1000)
    let arrival = 0
    const next = () => {
      arrival = window.setTimeout(() => {
        if (useAlertPrefs.getState().feedOn && !useRush.getState().running) announceOrder(spawnOrder(useOps.getState().cityId))
        next()
      }, 20_000 + Math.random() * 20_000)
    }
    next()
    return () => {
      window.clearInterval(ticker)
      window.clearTimeout(arrival)
      cancelRush()
    }
  }, [])
  return null
}
