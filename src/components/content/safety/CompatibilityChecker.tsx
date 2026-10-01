import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Info, X } from 'lucide-react'
import type { BloodGroup, ComponentCode } from '@/types'
import { BLOOD_GROUPS, canDonateTo, canReceive, compatibleDonors } from '@/data/blood'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { Tabs } from '@/components/ui/disclosure'
import { cn } from '@/lib/utils'

type Mode = 'recipient' | 'donor'
type Product = Extract<ComponentCode, 'PRBC' | 'FFP'>

const PRODUCT_LABEL: Record<Product, string> = { PRBC: 'red cells', FFP: 'plasma' }

function insight(mode: Mode, product: Product, group: BloodGroup, count: number): string {
  if (mode === 'recipient') {
    if (product === 'PRBC') {
      if (group === 'AB+')
        return 'AB+ patients can receive red cells from every group, which is why AB+ is called the universal red cell recipient.'
      if (group === 'O-') return 'O− patients can only receive O− red cells. That is why O− donors are so precious in emergencies.'
      if (group.endsWith('-')) return 'Rh-negative patients are given Rh-negative red cells wherever possible.'
      return `${count} of 8 groups are compatible. The hospital still cross-matches the actual unit before use.`
    }
    if (group.startsWith('AB')) return 'For plasma the rules flip: AB patients can only receive AB plasma.'
    if (group.startsWith('O'))
      return 'Group O patients can receive plasma from any ABO group, because their red cells carry no A or B antigens for donor antibodies to attack.'
    return `${count} of 8 groups are compatible for plasma. Plasma matching is the reverse of red cells.`
  }
  if (product === 'PRBC') {
    if (group === 'O-') return 'O− red cells can go to anyone. O− donors are universal red cell donors.'
    if (group === 'AB+') return 'AB+ red cells can only go to AB+ patients, but AB+ plasma can help every group.'
    return `Your red cells can help ${count} of 8 groups.`
  }
  if (group.startsWith('AB')) return 'AB plasma can go to any ABO group. AB donors are universal plasma donors.'
  if (group.startsWith('O')) return 'O plasma is only suitable for group O patients, but O red cells help many groups.'
  return `Your plasma can help ${count} of 8 groups.`
}

export function CompatibilityChecker() {
  const [mode, setMode] = useState<Mode>('recipient')
  const [group, setGroup] = useState<BloodGroup>('A+')
  const [product, setProduct] = useState<Product>('PRBC')

  const matches: BloodGroup[] =
    mode === 'recipient'
      ? compatibleDonors(group, product)
      : product === 'PRBC'
        ? canDonateTo(group)
        : BLOOD_GROUPS.filter((r) => canReceive(r, group, 'FFP'))

  const headline =
    mode === 'recipient'
      ? `${/^[AO]/.test(group) ? 'An' : 'A'} ${group} patient can receive ${PRODUCT_LABEL[product]} from`
      : `${group} ${PRODUCT_LABEL[product]} can be given to`

  return (
    <div className="overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-lift">
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Controls */}
        <div className="border-b border-ink-100 p-5 sm:p-8 lg:border-r lg:border-b-0">
          <p className="text-sm font-semibold text-ink-950">I want to check as</p>
          <div className="relative mt-3 max-w-full overflow-x-auto no-scrollbar">
            <Tabs<Mode>
              value={mode}
              onChange={setMode}
              tabs={[
                { value: 'recipient', label: 'A patient' },
                { value: 'donor', label: 'A donor' },
              ]}
            />
          </div>

          <p className="mt-7 text-sm font-semibold text-ink-950">{mode === 'recipient' ? "Patient's blood group" : 'Your blood group'}</p>
          <BloodGroupPicker value={group} onChange={setGroup} className="mt-3" />

          <p className="mt-7 text-sm font-semibold text-ink-950">Component</p>
          <div className="mt-3">
            <Tabs<Product>
              value={product}
              onChange={setProduct}
              tabs={[
                { value: 'PRBC', label: 'Red cells' },
                { value: 'FFP', label: 'Plasma' },
              ]}
            />
          </div>
        </div>

        {/* Result */}
        <div className="relative bg-paper p-5 sm:p-8" aria-live="polite">
          <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="relative">
            <p className="text-sm font-medium text-ink-500">{headline}</p>
            <p className="mt-1 font-display text-4xl font-bold text-ink-950 tabular sm:text-5xl">
              {matches.length}
              <span className="text-2xl text-ink-400 sm:text-3xl"> of 8 groups</span>
            </p>

            <ul className="mt-6 grid grid-cols-4 gap-2 sm:gap-3" aria-label={mode === 'recipient' ? 'Donor groups' : 'Patient groups'}>
              {BLOOD_GROUPS.map((g) => {
                const ok = matches.includes(g)
                return (
                  <motion.li
                    key={g}
                    layout
                    animate={{ scale: ok ? 1 : 0.94, opacity: ok ? 1 : 0.7 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                    className={cn(
                      'relative flex aspect-square flex-col items-center justify-center rounded-2xl font-display text-lg font-bold transition-colors duration-300 sm:text-2xl',
                      ok ? 'bg-blood-600 text-white shadow-glow' : 'border border-dashed border-ink-200 bg-white text-ink-300',
                    )}
                  >
                    <span className="sr-only">{ok ? 'Compatible: ' : 'Not compatible: '}</span>
                    {g}
                    <span
                      className={cn(
                        'absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full sm:size-5',
                        ok ? 'bg-white/20 text-white' : 'text-ink-300',
                      )}
                      aria-hidden
                    >
                      {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
                    </span>
                  </motion.li>
                )
              })}
            </ul>

            <AnimatePresence mode="wait">
              <motion.p
                key={`${mode}-${product}-${group}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-6 flex gap-2 text-ink-700"
              >
                <ArrowRight className="mt-1 size-4 shrink-0 text-blood-600" aria-hidden />
                <span>{insight(mode, product, group, matches.length)}</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex gap-3 border-t border-ink-100 bg-ice-50/60 px-5 py-4 text-sm text-ink-700 sm:px-8">
        <Info className="mt-0.5 size-4 shrink-0 text-ice-700" aria-hidden />
        <p>
          <span className="font-semibold text-ink-950">Educational guide only.</span> Final compatibility is always decided by the
          hospital's blood bank, which groups the patient's sample and cross-matches it against the actual unit before every transfusion.
          Platelets, cryoprecipitate and whole blood follow their own matching rules set by the blood centre and treating doctor.
        </p>
      </div>
    </div>
  )
}
