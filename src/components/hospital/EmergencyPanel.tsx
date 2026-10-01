import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, BookOpenCheck, Plus, Siren } from 'lucide-react'
import type { BloodGroup, ComponentCode, Inventory } from '@/types'
import { COMPONENTS, PRIORITIES } from '@/data/blood'
import { buttonClass } from '@/components/ui/Button'
import { stockLevel } from '@/services/inventory'
import { cn } from '@/lib/utils'

interface Preset {
  group: BloodGroup
  component: ComponentCode
  units: number
  title: string
  note: string
}

const PRESETS: Preset[] = [
  { group: 'O-', component: 'PRBC', units: 2, title: 'Red cells', note: 'Group unknown, massive bleed' },
  { group: 'O+', component: 'PRBC', units: 2, title: 'Red cells', note: 'Most common group' },
  { group: 'AB+', component: 'FFP', units: 2, title: 'AB plasma', note: 'Universal plasma' },
  { group: 'O+', component: 'PLT', units: 4, title: 'Platelets', note: 'Bleeding, low count' },
]

export function orderHref(p: { group?: BloodGroup; component?: ComponentCode; units?: number; priority?: string }) {
  const q = new URLSearchParams()
  if (p.priority) q.set('priority', p.priority)
  if (p.group) q.set('group', p.group)
  if (p.component) q.set('component', p.component)
  if (p.units) q.set('units', String(p.units))
  const s = q.toString()
  return s ? `/order?${s}` : '/order'
}

const LEVEL_DOT = { out: 'bg-blood-600', low: 'bg-amber-500', ok: 'bg-ink-400', good: 'bg-emerald-500' } as const

export function EmergencyPanel({ stock }: { stock: Inventory }) {
  const reduce = useReducedMotion()
  return (
    <section aria-labelledby="one-tap" className="flex h-full flex-col rounded-4xl border border-blood-100 bg-linear-to-b from-blood-50 to-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="one-tap" className="flex items-center gap-2 font-sans text-lg font-semibold">
            <span className="grid size-8 place-items-center rounded-xl bg-blood-600 text-white shadow-glow">
              <Siren className="size-4" />
            </span>
            Emergency one-tap
          </h2>
          <p className="mt-1.5 text-sm text-ink-600">Prefilled at emergency priority. Dispatch target {PRIORITIES.emergency.targetMinutes} min.</p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2.5">
        {PRESETS.map((p, i) => {
          const available = stock[p.group][p.component]
          const level = stockLevel(available)
          return (
            <motion.li
              key={`${p.group}-${p.component}`}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                to={orderHref({ priority: 'emergency', group: p.group, component: p.component, units: p.units })}
                className="group relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-3.5 shadow-soft transition hover:-translate-y-0.5 hover:border-blood-300 hover:shadow-lift active:scale-[0.98] sm:p-4"
                aria-label={`Emergency order: ${p.units} units ${p.group} ${COMPONENTS[p.component].name}. ${available} units in network.`}
              >
                <span className="flex items-start justify-between">
                  <span className="inline-grid h-9 min-w-11 place-items-center rounded-xl bg-blood-600 px-2 font-display text-base font-bold text-white">
                    {p.group}
                  </span>
                  <ArrowUpRight className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blood-600" />
                </span>
                <span className="mt-3 font-display text-lg leading-tight font-bold text-ink-950">
                  {p.title} <span className="text-blood-600">×{p.units}</span>
                </span>
                <span className="mt-0.5 text-xs text-ink-500">{p.note}</span>
                <span className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-ink-600">
                  <span className={cn('size-1.5 rounded-full', LEVEL_DOT[level])} aria-hidden />
                  {level === 'out' ? 'Out of stock nearby' : `${available} in network`}
                </span>
              </Link>
            </motion.li>
          )
        })}
      </ul>

      <Link to={orderHref({ priority: 'emergency' })} className={buttonClass({ variant: 'dark', className: 'mt-4 w-full' })}>
        <Plus className="size-4" /> Custom emergency order
      </Link>
      <p className="mt-3 text-xs text-ink-500">
        You still attach the doctor's requisition before payment. Units are cross-matched at your blood bank before transfusion.
      </p>

      <div className="mt-auto pt-5">
        <div className="flex gap-3 rounded-3xl border border-ink-100 bg-white/70 p-4">
          <BookOpenCheck className="mt-0.5 size-4 shrink-0 text-ink-500" />
          <p className="text-xs text-ink-600">
            <span className="font-semibold text-ink-900">Group not yet known?</span> O− red cells and AB plasma are the usual emergency-release
            choices. Always follow your hospital's transfusion policy and the treating doctor's order.
          </p>
        </div>
      </div>
    </section>
  )
}
