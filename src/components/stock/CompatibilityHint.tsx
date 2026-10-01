import { forwardRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Phone, Stethoscope } from 'lucide-react'
import type { BloodGroup, ComponentCode, Inventory } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, compatibleDonors } from '@/data/blood'
import { BRAND } from '@/config/brand'
import { stockLevel } from '@/services/inventory'
import { cn } from '@/lib/utils'
import { LEVEL } from './levels'

/**
 * "Can't find your group?" helper. Uses red-cell rules for cells/platelets and
 * the reversed plasma rules for FFP/cryo, and always defers to the doctor.
 */
export const CompatibilityHint = forwardRef<
  HTMLElement,
  {
    stock: Inventory
    component: ComponentCode
    group: BloodGroup
    onGroupChange: (g: BloodGroup) => void
  }
>(function CompatibilityHint({ stock, component, group, onGroupChange }, ref) {
  const plasma = component === 'FFP' || component === 'CRYO'
  const donors = compatibleDonors(group, component).filter((g) => g !== group)
  const kind = plasma ? 'plasma' : component === 'PLT' ? 'platelets (ABO-preferred)' : 'red cells'

  return (
    <section
      ref={ref}
      id="compatibility"
      aria-labelledby="compat-title"
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-ink-100 bg-linear-to-br from-white to-ink-50 p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <p className="eyebrow mb-2 text-ink-500">Compatibility</p>
          <h2 id="compat-title" className="text-2xl font-bold">
            Can&rsquo;t find your group?
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Pick the patient&rsquo;s group to see which donor groups are compatible for {kind}, and how many{' '}
            {COMPONENTS[component].short.toLowerCase()} units of each are on the shelf now.
          </p>
        </div>
        <div role="radiogroup" aria-label="Patient blood group" className="grid grid-cols-4 gap-1.5 md:w-72">
          {BLOOD_GROUPS.map((g) => {
            const active = g === group
            return (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onGroupChange(g)}
                className={cn(
                  'h-10 rounded-xl font-display text-sm font-bold transition-colors',
                  active ? 'bg-ink-950 text-white' : 'border border-ink-200 bg-white text-ink-800 hover:border-ink-300',
                )}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink-800">
          {/^[AO]/.test(group) ? 'An' : 'A'} <strong className="font-semibold text-ink-950">{group}</strong> patient can usually receive {kind} from:
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {[group, ...donors].map((g) => {
              const units = stock[g][component]
              const s = LEVEL[stockLevel(units)]
              return (
                <motion.li
                  key={`${group}-${g}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn('flex items-center gap-2 rounded-2xl border border-ink-100 bg-white py-1.5 pr-3 pl-1.5')}
                >
                  <span className={cn('grid h-8 min-w-10 place-items-center rounded-xl px-1.5 font-display text-sm font-bold', g === group ? 'bg-blood-600 text-white' : 'bg-ink-950 text-white')}>
                    {g}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-ink-950 tabular">{units} units</span>
                    <span className={cn('text-[11px] font-medium', s.text)}>{g === group ? 'Same group' : s.label}</span>
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-ink-950 p-4 text-sm text-ink-200 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3">
          <Stethoscope className="mt-0.5 size-5 shrink-0 text-ice-400" aria-hidden />
          <span>
            <span className="font-semibold text-white">Substitution is a medical decision.</span> The treating doctor must approve a different
            group on the requisition, and the blood centre and hospital cross-match before any unit is transfused.
          </span>
        </p>
        <a
          href={`tel:${BRAND.supportPhone.replace(/\D/g, '')}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ink-950 hover:bg-ink-100"
        >
          <Phone className="size-4" aria-hidden /> Blood desk
        </a>
      </div>
    </section>
  )
})
