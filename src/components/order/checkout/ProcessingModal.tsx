import { AnimatePresence, motion } from 'motion/react'
import { Check, CircleX, LoaderCircle, LockKeyhole, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { cn, formatINR } from '@/lib/utils'

export type ProcessingOutcome = 'pending' | 'success' | 'failed'

export const PROCESSING_STEPS = ['Contacting your bank', 'Authorising payment', 'Confirming with blood centre'] as const

const noop = () => {}

/**
 * Non-dismissible overlay shown while the gateway call is in flight.
 * `step` is the index of the step currently running.
 */
export function ProcessingModal({
  open,
  step,
  outcome,
  amount,
  instrument,
}: {
  open: boolean
  step: number
  outcome: ProcessingOutcome
  amount: number
  instrument: string
}) {
  const title = outcome === 'success' ? 'Payment confirmed' : outcome === 'failed' ? "Payment didn't go through" : 'Processing payment'
  const sub =
    outcome === 'success'
      ? 'Taking you to your order…'
      : outcome === 'failed'
        ? 'No order was placed. Taking you to the next steps…'
        : "Please don't close this window or press back."

  return (
    <Modal open={open} onClose={noop} dismissible={false} className="max-w-md text-center">
      <div className="flex flex-col items-center" aria-live="polite">
        <Emblem outcome={outcome} />
        <h2 className="mt-6 text-2xl font-bold">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-600">{sub}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-50 px-3.5 py-1.5 text-sm">
          <span className="font-display font-bold text-ink-950 tabular">{formatINR(amount)}</span>
          <span className="text-ink-300">·</span>
          <span className="max-w-44 truncate text-ink-600">{instrument}</span>
        </p>

        <ol className="mt-7 w-full space-y-1 text-left">
          {PROCESSING_STEPS.map((label, i) => {
            const failedHere = outcome === 'failed' && i === Math.min(step, 1)
            const done = outcome === 'success' || (!failedHere && i < step)
            const active = outcome === 'pending' && i === step
            const idle = !done && !active && !failedHere
            return (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors',
                  active && 'bg-ink-50',
                  failedHere && 'bg-amber-50',
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center">
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </motion.span>
                    ) : failedHere ? (
                      <motion.span key="fail" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CircleX className="size-6 text-amber-600" aria-hidden />
                      </motion.span>
                    ) : active ? (
                      <motion.span key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <LoaderCircle className="size-5 animate-spin text-blood-600" aria-hidden />
                      </motion.span>
                    ) : (
                      <motion.span key="idle" className="size-2 rounded-full bg-ink-200" />
                    )}
                  </AnimatePresence>
                </span>
                <span className={cn('font-medium', idle ? 'text-ink-400' : failedHere ? 'text-amber-900' : 'text-ink-900')}>
                  {label}
                  {active && <span className="text-ink-400">…</span>}
                </span>
              </li>
            )
          })}
        </ol>
        <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-400">
          <LockKeyhole className="size-3.5" aria-hidden /> Test gateway · simulated authorisation
        </p>
      </div>
    </Modal>
  )
}

function Emblem({ outcome }: { outcome: ProcessingOutcome }) {
  return (
    <div className="relative grid size-28 place-items-center">
      <AnimatePresence>
        {outcome === 'pending' && (
          <motion.span
            key="spinner"
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, var(--color-blood-600) 300deg, transparent 360deg)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 3px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 3px))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ rotate: { duration: 1.1, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.2 } }}
          />
        )}
      </AnimatePresence>
      {outcome === 'pending' && <span className="absolute inset-3 animate-pulse-ring rounded-full bg-blood-100" />}
      <motion.div
        layout
        className={cn(
          'relative grid size-20 place-items-center rounded-full transition-colors duration-500',
          outcome === 'success' ? 'bg-emerald-500 text-white shadow-[0_12px_40px_-10px_rgb(16_185_129/0.7)]' : outcome === 'failed' ? 'bg-amber-100 text-amber-700' : 'bg-blood-50 text-blood-600',
        )}
        animate={outcome === 'pending' ? { scale: [1, 1.04, 1] } : { scale: [0.85, 1.08, 1] }}
        transition={outcome === 'pending' ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {outcome === 'success' ? (
            <motion.svg key="ok" viewBox="0 0 24 24" className="size-10" fill="none">
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </motion.svg>
          ) : outcome === 'failed' ? (
            <motion.span key="x" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>
              <X className="size-9" strokeWidth={2.4} aria-hidden />
            </motion.span>
          ) : (
            <motion.span key="lock" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <LockKeyhole className="size-8" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
