import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ClipboardCheck, HeartHandshake, MapPin, X } from 'lucide-react'
import type { CampPledge } from '@/types'
import { cancelPledge, isoDay, LIVES_PER_DONATION, markPledgeDonated, useMyPledges } from '@/services/camps'
import { ApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/primitives'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { toast } from '@/components/ui/Toast'
import { Prop } from '@/components/characters/Prop'
import { cn } from '@/lib/utils'
import { DateTile } from './DateTile'
import { plural } from './format'

/** Pledges from this account or device: confirm a donation on the day, or cancel ahead of it. */
export function MyPledges({ className }: { className?: string }) {
  const pledges = useMyPledges()
  const [busyId, setBusyId] = useState<string | null>(null)
  const today = isoDay(new Date())

  // Still to happen (soonest first), then donations (latest first).
  const sorted = useMemo(
    () =>
      [...pledges].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pledged' ? -1 : 1
        return a.status === 'pledged' ? a.campDate.localeCompare(b.campDate) : (b.donatedAt ?? 0) - (a.donatedAt ?? 0)
      }),
    [pledges],
  )

  if (pledges.length === 0) return null

  const due = pledges.filter((p) => p.status === 'pledged' && p.campDate <= today).length
  const ahead = pledges.filter((p) => p.status === 'pledged' && p.campDate > today).length
  const donated = pledges.length - due - ahead

  const run = async (p: CampPledge, action: 'donated' | 'cancel') => {
    setBusyId(p.id)
    try {
      if (action === 'donated') {
        await markPledgeDonated(p.id)
        toast.success('Thank you for donating', `Counted: up to ${LIVES_PER_DONATION} lives helped.`)
      } else {
        await cancelPledge(p.id)
        toast.info('Pledge cancelled', 'Plans change. You can pledge for another camp any time.')
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section id="my-pledges" aria-labelledby="my-pledges-title" className={cn('container-page scroll-mt-24', className)}>
      <div className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8">
        <div className="mb-5 flex items-center gap-4">
          <Prop icon={ClipboardCheck} tone="ink" className="w-11 sm:w-12" />
          <div className="min-w-0">
            <h2 id="my-pledges-title" className="text-xl font-bold sm:text-2xl">
              Your pledges
            </h2>
            <p className="text-sm text-ink-500">
              {[
                ahead > 0 && `${ahead} coming up`,
                due > 0 && `${due} to confirm`,
                donated > 0 && `${plural(donated, 'donation')} confirmed. Thank you!`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {sorted.map((p) => {
              const isDonated = p.status === 'donated'
              const canConfirm = !isDonated && p.campDate <= today
              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className={cn(
                    'flex flex-wrap items-center gap-3 overflow-hidden rounded-3xl border p-3 sm:flex-nowrap sm:gap-4 sm:p-4',
                    isDonated ? 'border-emerald-100 bg-emerald-50/40' : 'border-ink-100 bg-white',
                  )}
                >
                  <DateTile iso={p.campDate} tone={isDonated ? 'green' : canConfirm ? 'red' : 'muted'} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-sm font-semibold text-ink-950 wrap-anywhere">{p.campName}</p>
                    <p className="mt-0.5 flex gap-1 text-xs text-ink-500">
                      <MapPin className="mt-px size-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0 wrap-anywhere">{[p.venue, p.district].filter(Boolean).join(', ')}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-500">Pledged by {p.name}</p>
                  </div>
                  <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                    {p.bloodGroup && <BloodGroupBadge group={p.bloodGroup} size="sm" className={cn(isDonated && 'bg-emerald-600')} />}
                    {isDonated ? (
                      <Badge tone="green">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden /> Donated
                      </Badge>
                    ) : canConfirm ? (
                      <Button
                        size="sm"
                        loading={busyId === p.id}
                        onClick={() => run(p, 'donated')}
                        icon={<HeartHandshake className="size-4" aria-hidden />}
                      >
                        I donated
                      </Button>
                    ) : (
                      <>
                        <Badge tone="amber">Pledged</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busyId === p.id}
                          onClick={() => run(p, 'cancel')}
                          icon={<X className="size-4" aria-hidden />}
                          aria-label={`Cancel pledge for ${p.campName}`}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}
