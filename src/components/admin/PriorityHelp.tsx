import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleHelp, X } from 'lucide-react'
import {
  AT_RISK_BONUS,
  AT_RISK_SHARE,
  BASE_SCORE,
  BREACH_BONUS,
  DEFER_IF_MORE_THAN_MIN,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  RARE_BONUS,
  SHELF_BONUS,
  SLA_MIN,
  WAIT_WEIGHT,
} from '@/services/admin/priority'
import { cn } from '@/lib/utils'
import { PRIORITY_STYLE } from './ui'

/** "How priority works": the scoring rules, written from the same constants the board uses. */
export function PriorityHelp({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className={cn('relative', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:border-ink-300 hover:bg-ink-50"
      >
        <CircleHelp className="size-4 text-ink-500" aria-hidden /> How priority works
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-label="How priority works"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-x-3 top-20 z-800 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-3xl border border-ink-100 bg-white p-5 text-sm shadow-lift sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-104"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-sans text-base font-semibold">How priority works</h3>
              <button type="button" onClick={() => setOpen(false)} className="-mt-1 -mr-1 grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-ink-600">Every live order gets a score. Higher is packed and dispatched sooner; it is recalculated every second.</p>

            <table className="mt-4 w-full text-left text-[13px]">
              <caption className="sr-only">Score parts</caption>
              <tbody className="divide-y divide-ink-100">
                {PRIORITY_ORDER.map((p) => (
                  <tr key={p}>
                    <th scope="row" className="py-2 pr-3 font-medium text-ink-800">
                      <span className={cn('mr-2 inline-block size-2 rounded-full', PRIORITY_STYLE[p].dot)} aria-hidden />
                      {PRIORITY_LABEL[p]} base
                    </th>
                    <td className="py-2 text-right font-semibold tabular">{BASE_SCORE[p]}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-ink-800">
                    Minutes waiting ×{' '}
                    <span className="text-ink-500">
                      {PRIORITY_ORDER.map((p) => WAIT_WEIGHT[p]).join(' / ')}
                    </span>
                  </th>
                  <td className="py-2 text-right font-semibold tabular">+ wait</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-ink-800">Rare group (O−, A−, B−, AB−)</th>
                  <td className="py-2 text-right font-semibold tabular">+{RARE_BONUS}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-ink-800">Platelets (5-day shelf life)</th>
                  <td className="py-2 text-right font-semibold tabular">+{SHELF_BONUS}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-ink-800">Under {Math.round(AT_RISK_SHARE * 100)}% of target left</th>
                  <td className="py-2 text-right font-semibold tabular">+{AT_RISK_BONUS}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-2 pr-3 font-medium text-ink-800">Dispatch target missed</th>
                  <td className="py-2 text-right font-semibold tabular">+{BREACH_BONUS}</td>
                </tr>
              </tbody>
            </table>

            <h4 className="mt-5 text-xs font-semibold tracking-wide text-ink-500 uppercase">Dispatch targets (from order)</h4>
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {PRIORITY_ORDER.map((p) => (
                <li key={p} className="rounded-2xl bg-ink-50 px-3 py-2">
                  <span className="block text-[11px] text-ink-500">{PRIORITY_LABEL[p]}</span>
                  <span className="font-semibold text-ink-950 tabular">≤ {SLA_MIN[p] >= 60 ? `${SLA_MIN[p] / 60} h` : `${SLA_MIN[p]} min`}</span>
                </li>
              ))}
            </ul>

            <h4 className="mt-5 text-xs font-semibold tracking-wide text-ink-500 uppercase">Dispatch rules</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-700">
              <li>Packed orders are matched highest score first.</li>
              <li>Each takes a free rider from its own store (fewest trips today first, to share the load).</li>
              <li>In Surge mode, the nearest free rider from another store in the same city can be borrowed, and scheduled orders with more than {DEFER_IF_MORE_THAN_MIN} min to spare wait.</li>
              <li>Escalating or de-escalating needs a reason and is kept in the order&rsquo;s audit log.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
