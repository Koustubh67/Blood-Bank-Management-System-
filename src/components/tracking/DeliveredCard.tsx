import { motion, useReducedMotion } from 'motion/react'
import { Bike, Check, ClipboardCheck, HeartPulse, PackageCheck, Timer, UserCheck } from 'lucide-react'
import type { Order, PartnerHospital } from '@/types'
import { formatDuration, formatTime } from '@/lib/utils'
import { Card } from '@/components/ui/primitives'
import { PRIORITY_META, stageClock } from './helpers'

const CHECKS = [
  { icon: PackageCheck, text: 'Seal intact and logger shows every reading in range' },
  { icon: ClipboardCheck, text: 'Cross-match with the patient’s fresh sample' },
  { icon: UserCheck, text: 'Bedside identity check against the unit label and requisition' },
  { icon: HeartPulse, text: 'Vitals monitored before, during and after transfusion' },
]

/** Celebratory completion state with the journey stats and bedside reminders. */
export function DeliveredCard({ order, hospital }: { order: Order; hospital?: PartnerHospital }) {
  const reduce = useReducedMotion()
  const plan = order.plan!
  const deliveredAt = stageClock(order, 'delivered')

  const stats = [
    { label: 'Total', value: formatDuration(plan.deliverAt), icon: Timer },
    { label: 'To dispatch', value: formatDuration(plan.dispatchAt), icon: PackageCheck },
    { label: 'Ride', value: formatDuration(plan.arriveAt - plan.dispatchAt), icon: Bike },
  ]

  return (
    <Card className="relative overflow-hidden">
      <div className="relative overflow-hidden bg-ink-950 px-5 pt-8 pb-6 text-white sm:px-6">
        <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-emerald-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-blood-600/30 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-4">
          <div className="relative grid size-16 place-items-center">
            {!reduce &&
              [0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.6, delay: 0.3 + i * 0.35, repeat: 1, ease: 'easeOut' }}
                  aria-hidden
                />
              ))}
            <motion.span
              className="relative grid size-16 place-items-center rounded-full bg-emerald-500 shadow-[0_10px_40px_-10px_rgb(16_185_129/0.8)]"
              initial={reduce ? false : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 220 }}
            >
              <Check className="size-8" strokeWidth={3} aria-hidden />
            </motion.span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15">
            {PRIORITY_META[order.priority].label}
          </span>
        </div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="mt-6 text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">Delivered</p>
          <h2 className="mt-1 text-3xl leading-tight font-bold text-white sm:text-4xl">
            Handed over{deliveredAt ? ` at ${formatTime(deliveredAt)}` : ''}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            The sealed box reached {hospital ? hospital.name : 'the hospital'}&rsquo;s blood transfusion desk and was confirmed with your OTP.
          </p>
        </motion.div>

        <dl className="mt-6 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <dt className="flex items-center gap-1.5 text-[11px] text-white/60">
                <s.icon className="hidden size-3.5 shrink-0 sm:block" aria-hidden />
                <span className="truncate">{s.label}</span>
              </dt>
              <dd className="mt-1 font-display text-lg font-bold tabular sm:text-xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="font-sans text-sm font-semibold text-ink-950">Before transfusion, the hospital team will check</h3>
        <ul className="mt-3 flex flex-col gap-2.5">
          {CHECKS.map((c) => (
            <li key={c.text} className="flex items-start gap-3 text-sm text-ink-700">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                <c.icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1">{c.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-ink-50 p-3 text-xs text-ink-600">
          Transfusion happens only at the hospital, under a doctor&rsquo;s supervision. If anything about the box or its label looks wrong, the
          hospital should not use the unit and should contact the issuing blood centre.
        </p>
      </div>
    </Card>
  )
}
