import { useMemo } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowUpRight, Shuffle } from 'lucide-react'
import type { BloodGroup, Inventory } from '@/types'
import { BLOOD_GROUPS, COMPONENTS } from '@/data/blood'
import { totalUnits } from '@/data/network'
import { stockLevel } from '@/services/inventory'
import { cn } from '@/lib/utils'
import { LiveNumber } from './LiveNumber'
import { LEVEL, LevelLabel, orderHref, type ComponentFilter } from './levels'

export function unitsFor(inv: Inventory, group: BloodGroup, component: ComponentFilter) {
  return component === 'ALL' ? totalUnits(inv, group) : inv[group][component]
}

/** 8 blood-group tiles showing network-wide units for the chosen component. */
export function StockMatrix({
  stock,
  component,
  onFindCompatible,
}: {
  stock: Inventory
  component: ComponentFilter
  onFindCompatible: (g: BloodGroup) => void
}) {
  const rows = useMemo(() => BLOOD_GROUPS.map((g) => ({ group: g, units: unitsFor(stock, g, component) })), [stock, component])
  const max = Math.max(1, ...rows.map((r) => r.units))
  const name = component === 'ALL' ? 'units' : COMPONENTS[component].short.toLowerCase()

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {rows.map(({ group, units }, i) => {
        const level = stockLevel(units)
        const s = LEVEL[level]
        const pct = units === 0 ? 0 : Math.max(4, (units / max) * 100)
        const out = units === 0
        const body = (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-[2rem]">{group}</span>
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300',
                  out
                    ? 'bg-ink-100 text-ink-600 group-hover:bg-ink-950 group-hover:text-white'
                    : 'bg-blood-50 text-blood-700 group-hover:bg-blood-600 group-hover:text-white',
                )}
                aria-hidden
              >
                {out ? <Shuffle className="size-4" /> : <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />}
              </span>
            </div>
            <div className="mt-5 flex items-baseline gap-1.5">
              <LiveNumber value={units} className="font-display text-4xl font-semibold text-ink-950" />
              <span className="text-sm text-ink-500">{units === 1 ? 'unit' : 'units'}</span>
            </div>
            <div className={cn('mt-3 h-1.5 overflow-hidden rounded-full', s.track)}>
              <motion.div
                className={cn('h-full rounded-full', s.bar)}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', damping: 30, stiffness: 120 }}
              />
            </div>
            <LevelLabel level={level} className="mt-3" />
          </>
        )
        const cls =
          'group relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-4 text-left shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift sm:p-5'
        return (
          <motion.li
            key={group}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.035, duration: 0.4 }}
          >
            {out ? (
              <button
                type="button"
                onClick={() => onFindCompatible(group)}
                className={cn(cls, 'w-full')}
                aria-label={`${group} ${name} out of stock. See compatible alternatives.`}
              >
                {body}
              </button>
            ) : (
              <Link to={orderHref(group, component)} className={cls} aria-label={`Request ${group} ${name}. ${units} available, ${s.label.toLowerCase()}.`}>
                {body}
              </Link>
            )}
          </motion.li>
        )
      })}
    </ul>
  )
}
