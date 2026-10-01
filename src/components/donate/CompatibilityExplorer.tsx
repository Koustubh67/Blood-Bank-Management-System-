import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import type { BloodGroup } from '@/types'
import { BLOOD_GROUPS, GROUP_PREVALENCE, canDonateTo, compatibleDonors } from '@/data/blood'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { cn } from '@/lib/utils'

const NOTES: Partial<Record<BloodGroup, string>> = {
  'O-': 'Universal red-cell donor. Emergency teams reach for O− when there is no time to test a patient’s group, so it runs short first.',
  'O+': 'The most common group in India. Your red cells can go to every Rh-positive patient.',
  'AB+': 'Your red cells go to AB+ patients only, but your plasma can be given to patients of any group.',
  'AB-': 'One of the rarest groups. Your plasma can be given to patients of any group.',
  'A-': 'A rare group. Rh-negative patients depend on donors like you.',
  'B-': 'A rare group. Rh-negative patients depend on donors like you.',
}

/** "Who your blood helps": pick a group, see which patients can receive it. */
export function CompatibilityExplorer() {
  const [group, setGroup] = useState<BloodGroup>('O-')
  const recipients = useMemo(() => canDonateTo(group), [group])
  const donors = useMemo(() => compatibleDonors(group), [group])
  const reach = Math.round(recipients.reduce((s, g) => s + GROUP_PREVALENCE[g], 0) * 100)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      <div>
        <p className="text-sm font-semibold text-ink-800">Your blood group</p>
        <BloodGroupPicker value={group} onChange={setGroup} className="mt-3" />
        <p className="mt-4 text-sm text-ink-500">
          You can receive red cells from{' '}
          <span className="font-semibold text-ink-800">{donors.join(', ')}</span>.
        </p>
      </div>

      <div className="rounded-4xl bg-ink-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <p className="text-sm text-ink-300">Your red cells can help</p>
          <p className="text-xs text-ink-400">Approximate share of people in India</p>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <motion.p key={`n-${group}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-bold sm:text-6xl">
            {recipients.length} <span className="text-2xl text-ink-400 sm:text-3xl">of 8 groups</span>
          </motion.p>
          <motion.p key={`p-${group}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-semibold text-blood-300">
            ≈ {reach}% of people
          </motion.p>
        </div>

        <ul className="mt-6 grid grid-cols-4 gap-2 sm:gap-3" aria-label="Recipient groups">
          {BLOOD_GROUPS.map((g) => {
            const ok = recipients.includes(g)
            return (
              <li key={g}>
                <motion.div
                  layout
                  animate={{ scale: ok ? 1 : 0.94, opacity: ok ? 1 : 0.45 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-2xl border font-display text-lg font-bold sm:text-2xl',
                    ok ? 'border-blood-500 bg-blood-600 text-white shadow-glow' : 'border-white/10 bg-white/5 text-ink-400',
                  )}
                >
                  {g}
                  <span className="mt-1 flex h-4 items-center font-sans text-[11px] font-medium">
                    {ok ? (
                      <>
                        <Check className="size-3.5 sm:hidden" strokeWidth={3} aria-hidden />
                        <span className="sr-only sm:not-sr-only">Can receive</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden" aria-hidden>
                          –
                        </span>
                        <span className="sr-only sm:not-sr-only">Not compatible</span>
                      </>
                    )}
                  </span>
                </motion.div>
              </li>
            )
          })}
        </ul>

        {NOTES[group] && (
          <motion.p key={`note-${group}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex gap-2 text-sm text-ink-300">
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-blood-400" />
            {NOTES[group]}
          </motion.p>
        )}
        <p className="mt-4 text-xs text-ink-500">
          Red-cell compatibility shown. Plasma works the other way round, and every unit is still cross-matched by the hospital before
          transfusion.
        </p>
      </div>
    </div>
  )
}
