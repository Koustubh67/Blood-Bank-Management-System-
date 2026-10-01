import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import type { Inventory } from '@/types'
import { BLOOD_GROUPS } from '@/data/blood'
import { stockLevel, type StockLevel } from '@/services/inventory'
import { LiveDot } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const LEVEL: Record<StockLevel, { label: string; tile: string; dot: string }> = {
  out: { label: 'Out', tile: 'bg-blood-50 ring-blood-100', dot: 'bg-blood-600' },
  low: { label: 'Low', tile: 'bg-amber-50 ring-amber-100', dot: 'bg-amber-500' },
  ok: { label: 'Available', tile: 'bg-ink-50 ring-ink-100', dot: 'bg-ink-400' },
  good: { label: 'Good', tile: 'bg-emerald-50 ring-emerald-100', dot: 'bg-emerald-500' },
}

/** Network-wide red cell units per group, coloured by stock level (with text labels, never colour alone). */
export function StockSnapshot({ stock, centreCount }: { stock: Inventory; centreCount: number }) {
  return (
    <section aria-labelledby="stock-snap" className="flex h-full flex-col rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="stock-snap" className="font-sans text-lg font-semibold">
            Nearby stock
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
            <LiveDot className="size-2" color="bg-emerald-500" /> Red cells across {centreCount} centres
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-4 gap-2">
        {BLOOD_GROUPS.map((g) => {
          const units = stock[g].PRBC
          const level = LEVEL[stockLevel(units)]
          return (
            <li key={g} className={cn('flex flex-col items-center rounded-2xl px-1 py-3 ring-1 transition-colors', level.tile)}>
              <span className="font-display text-base font-bold text-ink-950">{g}</span>
              <span className="mt-0.5 text-xl font-semibold text-ink-950">{units}</span>
              <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-ink-600">
                <span className={cn('size-1.5 rounded-full', level.dot)} aria-hidden />
                {level.label}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto pt-5">
        <Link
          to="/availability"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-800 underline-offset-4 hover:text-ink-950 hover:underline"
        >
          All components and centres <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  )
}
