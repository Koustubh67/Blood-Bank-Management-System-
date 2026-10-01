import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, BellOff, Square } from 'lucide-react'
import { POPUP_LABEL, setFeedOn, setPopups, useAlertPrefs, type PopupLevel } from '@/services/admin/alerts'
import { useRush } from '@/services/admin/engine'
import { setSoundEnabled, useSoundPrefs } from '@/lib/sound'
import { stopRush } from '../OpsEngine'
import { cn } from '@/lib/utils'

const LEVELS: PopupLevel[] = ['all', 'emergency', 'off']

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-ink-50">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{label}</span>
        <span className="block text-xs text-ink-500">{hint}</span>
      </span>
      <span aria-hidden className={cn('mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors', checked ? 'bg-ink-950' : 'bg-ink-200')}>
        <span className={cn('size-5 rounded-full bg-white shadow-soft transition-transform', checked && 'translate-x-4')} />
      </span>
    </button>
  )
}

/**
 * Notification settings for the console: which new orders pop up, the chime,
 * pausing the simulated order feed, and stopping a running rush.
 */
export function AlertsMenu() {
  const [open, setOpen] = useState(false)
  const { popups, feedOn } = useAlertPrefs()
  const sound = useSoundPrefs((s) => s.enabled)
  const rush = useRush()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const quiet = popups === 'off'
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Alerts: pop-ups ${POPUP_LABEL[popups].toLowerCase()}${feedOn ? '' : ', order feed paused'}`}
        className="relative grid size-10 shrink-0 place-items-center rounded-full text-ink-600 hover:bg-ink-100 hover:text-ink-950"
      >
        {quiet ? <BellOff className="size-[18px]" aria-hidden /> : <Bell className="size-[18px]" aria-hidden />}
        {(!feedOn || rush.running) && (
          <span aria-hidden className={cn('absolute top-2 right-2 size-2 rounded-full ring-2 ring-white', rush.running ? 'bg-blood-600' : 'bg-amber-500')} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-ink-100 bg-white p-2 shadow-lift"
            role="dialog"
            aria-label="Alert settings"
          >
            <p className="px-2 pt-1 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase">Pop-ups for new orders</p>
            <div role="radiogroup" aria-label="Pop-ups for new orders" className="m-2 grid grid-cols-3 gap-1 rounded-xl bg-ink-50 p-1">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={popups === l}
                  onClick={() => setPopups(l)}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-xs font-semibold transition',
                    popups === l ? 'bg-white text-ink-950 shadow-soft' : 'text-ink-600 hover:text-ink-950',
                  )}
                >
                  {l === 'all' ? 'All' : l === 'emergency' ? 'Emergency' : 'Off'}
                </button>
              ))}
            </div>
            <p className="px-2 pb-2 text-xs text-ink-500">
              {popups === 'all'
                ? 'Every new order shows a pop-up.'
                : popups === 'emergency'
                  ? 'Only emergency orders pop up; everything still lands on the board.'
                  : 'No pop-ups. Orders still land on the board and in the activity log.'}
            </p>
            <div className="my-1 h-px bg-ink-100" />
            <Switch checked={sound} onChange={setSoundEnabled} label="Chime" hint="A short sound with each pop-up, at most every 8 seconds." />
            <Switch
              checked={feedOn}
              onChange={setFeedOn}
              label="Incoming orders"
              hint={feedOn ? 'Simulated hospital orders arrive every 20–40 s.' : 'Paused. No new simulated orders until you switch this back on.'}
            />
            {rush.running && (
              <div className="mt-1 flex items-center gap-3 rounded-xl bg-blood-50 p-2.5">
                <p className="min-w-0 flex-1 text-sm font-semibold text-blood-800">
                  Rush hour running · <span className="tabular">{rush.spawned}/{rush.total}</span>
                </p>
                <button
                  type="button"
                  onClick={stopRush}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blood-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blood-700"
                >
                  <Square className="size-3 fill-current" aria-hidden /> Stop
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
