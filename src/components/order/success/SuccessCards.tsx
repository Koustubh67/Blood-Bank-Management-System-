import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bike, Check, ClipboardCheck, Copy, Hospital, KeyRound, Snowflake } from 'lucide-react'
import type { Order } from '@/types'
import { liveStatus } from '@/services/orders'
import { TRACKING_STAGES, stageIndex } from '@/services/tracking'
import { toast } from '@/components/ui/Toast'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useNow } from '@/hooks/useNow'
import { cn, formatDuration, formatTime } from '@/lib/utils'

// ---------- copy ----------

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Couldn't copy automatically", `Select and copy ${value} manually.`)
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cn('grid size-8 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900', className)}
      aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check className="size-4 text-emerald-600" strokeWidth={3} aria-hidden />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy className="size-4" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ---------- handover code ----------

export function OtpCard({ otp }: { otp: string }) {
  return (
    <section aria-labelledby="otp-title" className="relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-white sm:p-7">
      <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-blood-600/30 blur-3xl" aria-hidden />
      <div className="relative">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-blood-300 uppercase">
          <KeyRound className="size-4" aria-hidden /> Handover code
        </p>
        <h2 id="otp-title" className="sr-only">
          Handover code {otp.split('').join(' ')}
        </h2>
        <div className="mt-4 flex gap-2.5 sm:gap-3" aria-hidden>
          {otp.split('').map((d, i) => (
            <motion.span
              key={i}
              initial={{ y: 14, opacity: 0, rotateX: -60 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              transition={{ delay: 0.5 + i * 0.09, type: 'spring', stiffness: 320, damping: 20 }}
              className="grid h-16 w-13 place-items-center rounded-2xl bg-white/10 font-display text-4xl font-bold ring-1 ring-white/15 sm:h-18 sm:w-15 sm:text-5xl"
            >
              {d}
            </motion.span>
          ))}
          <CopyButton value={otp} label="Handover code" className="ml-1 self-center text-ink-300 hover:bg-white/10 hover:text-white" />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ink-300">
          At the blood transfusion desk, staff give this code to the rider{' '}
          <span className="font-semibold text-white">only after checking the sealed box, labels and temperature log</span>. Never share it over
          the phone or before the rider arrives.
        </p>
      </div>
    </section>
  )
}

// ---------- live ETA ----------

export function LiveEtaCard({ order }: { order: Order }) {
  const now = useNow(1000)
  const status = liveStatus(order, now)
  const plan = order.plan
  if (!plan || !order.placedAt) return null
  const elapsed = now - order.placedAt + order.simOffsetMs
  const remaining = Math.max(0, plan.deliverAt - elapsed)
  const progress = Math.min(1, Math.max(0, elapsed / plan.deliverAt))
  const idx = stageIndex(status)
  const stage = idx >= 0 ? TRACKING_STAGES[idx] : undefined
  const delivered = status === 'delivered'
  const cancelled = status === 'cancelled'

  return (
    <section aria-labelledby="eta-title" className="rounded-4xl border border-ice-100 bg-linear-to-br from-ice-50 via-white to-white p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h2 id="eta-title" className="font-sans text-sm font-semibold text-ice-700">
          {delivered ? 'Delivered' : cancelled ? 'Order cancelled' : 'Estimated handover'}
        </h2>
        <StatusBadge status={status} />
      </div>
      {!cancelled && (
        <p className="mt-2 font-display text-4xl font-bold text-ink-950 tabular sm:text-5xl">
          {delivered ? formatTime(order.placedAt + plan.deliverAt - order.simOffsetMs) : formatDuration(remaining)}
          {!delivered && (
            <span className="ml-2 align-middle text-base font-semibold text-ink-500">
              · by {formatTime(now + remaining)}
            </span>
          )}
        </p>
      )}
      {!cancelled && (
        <div className="mt-5">
          <div className="relative h-2 overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-ice-500 via-blood-500 to-blood-600"
              initial={false}
              animate={{ width: `${Math.max(3, progress * 100)}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </div>
          <ol className="mt-3 flex justify-between gap-1" aria-label="Delivery stages">
            {TRACKING_STAGES.map((s, i) => (
              <li key={s.key} className="flex flex-col items-center" title={s.label}>
                <span
                  className={cn(
                    'size-2 rounded-full transition-colors',
                    i < idx ? 'bg-blood-600' : i === idx ? 'bg-blood-600 ring-4 ring-blood-100' : 'bg-ink-200',
                  )}
                />
                <span className="sr-only">
                  {s.label}
                  {i < idx ? ' (done)' : i === idx ? ' (current)' : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {stage && (
        <p className="mt-3 text-sm text-ink-600" aria-live="polite">
          <span className="font-semibold text-ink-900">{stage.label}.</span> {stage.detail}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-400">An estimate from distance and priority, not a guarantee. Live map on the tracking page.</p>
    </section>
  )
}

// ---------- next steps ----------

const NEXT = [
  { icon: ClipboardCheck, title: 'Requisition check', body: "The blood centre's medical officer verifies the requisition and patient details." },
  { icon: Snowflake, title: 'Packed cold', body: 'Group-matched units are sealed in a validated cold box with a temperature logger.' },
  { icon: Bike, title: 'Rider on the way', body: "Follow the rider live on the map, with the box's temperature readings." },
  { icon: Hospital, title: 'Handover & cross-match', body: 'Desk staff share the code. The hospital cross-matches before any transfusion.' },
]

export function NextSteps() {
  return (
    <section aria-labelledby="next-title" className="rounded-4xl border border-ink-100 bg-white p-6 sm:p-7">
      <h2 id="next-title" className="font-sans text-base font-semibold">
        What happens next
      </h2>
      <ol className="mt-5 space-y-5">
        {NEXT.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="relative flex gap-4"
            >
              {i < NEXT.length - 1 && <span className="absolute top-10 -bottom-5 left-4.5 w-px bg-ink-100" aria-hidden />}
              <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-700">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-ink-950">{s.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{s.body}</p>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
