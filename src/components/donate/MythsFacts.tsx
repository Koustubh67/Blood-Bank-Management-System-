import { motion, useReducedMotion } from 'motion/react'
import { Check, X } from 'lucide-react'

const ITEMS = [
  {
    myth: 'Donating blood leaves you weak for weeks.',
    fact: 'Your body replaces the lost fluid within a day or two and the red cells over the following weeks. Most donors are back to normal routine the same day.',
  },
  {
    myth: 'You can catch an infection by donating.',
    fact: 'Every donation uses a sterile, sealed, single-use kit that is discarded afterwards. There is no way to pick up an infection from donating.',
  },
  {
    myth: 'It really hurts.',
    fact: 'You feel a brief pinch when the needle goes in. The donation itself takes about 8 to 10 minutes.',
  },
  {
    myth: 'People with tattoos can never donate.',
    fact: 'You can donate 12 months after a tattoo, piercing or acupuncture, if you meet the other criteria.',
  },
  {
    myth: 'Vegetarians do not have enough iron to donate.',
    fact: 'Diet alone does not rule you out. Your haemoglobin is checked before every donation, whatever you eat.',
  },
  {
    myth: 'Blood banks sell the blood you donate.',
    fact: 'Blood cannot be sold in India. Centres may levy only a capped processing charge that covers testing, separation and storage.',
  },
]

export function MythsFacts() {
  const reduce = useReducedMotion()
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ITEMS.map((item, i) => (
        <motion.li
          key={item.myth}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: (i % 3) * 0.07, duration: 0.4 }}
          className="group flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft transition-shadow hover:shadow-lift"
        >
          <div className="flex gap-3 border-b border-dashed border-ink-100 bg-ink-50/60 p-5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blood-100 text-blood-700">
              <X className="size-4" strokeWidth={3} />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-blood-700 uppercase">Myth</p>
              <p className="mt-1 text-ink-500 line-through decoration-ink-300">{item.myth}</p>
            </div>
          </div>
          <div className="flex flex-1 gap-3 p-5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase">Fact</p>
              <p className="mt-1 font-medium text-ink-900">{item.fact}</p>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
