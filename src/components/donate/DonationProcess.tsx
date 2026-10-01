import { motion, useReducedMotion } from 'motion/react'
import { ClipboardList, Coffee, Droplets, Stethoscope } from 'lucide-react'

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Registration',
    time: '~5 min',
    body: 'Show your booking and photo ID, and fill a short confidential health questionnaire.',
  },
  {
    icon: Stethoscope,
    title: 'Mini health check',
    time: '~10 min',
    body: 'Blood pressure, pulse, weight and a finger-prick haemoglobin test. The medical officer gives the final go-ahead.',
  },
  {
    icon: Droplets,
    title: 'Donation',
    time: '8–10 min',
    body: 'A sterile, single-use kit collects 350 or 450 ml depending on your weight. You feel a brief pinch, then relax.',
  },
  {
    icon: Coffee,
    title: 'Rest & refreshments',
    time: '~15 min',
    body: 'Juice and a snack while you rest. Drink extra fluids and skip heavy exercise for the rest of the day.',
  },
]

export function DonationProcess() {
  const reduce = useReducedMotion()
  return (
    <ol className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      <span className="absolute top-8 right-[12%] left-[12%] hidden h-px bg-linear-to-r from-blood-200 via-blood-300 to-blood-200 lg:block" aria-hidden />
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ delay: i * 0.08, duration: 0.45 }}
          className="relative flex flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft"
        >
          <div className="flex items-center justify-between">
            <span className="relative grid size-16 place-items-center rounded-2xl bg-ink-950 text-white">
              <s.icon className="size-7" />
              <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-blood-600 text-xs font-bold text-white ring-4 ring-white">
                {i + 1}
              </span>
            </span>
            <span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-600 tabular">{s.time}</span>
          </div>
          <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
          <p className="mt-2 text-sm text-ink-600">{s.body}</p>
        </motion.li>
      ))}
    </ol>
  )
}
