import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownLeft, ArrowUpRight, Radio } from 'lucide-react'
import type { BloodCentre } from '@/types'
import { describeEvent, useActivity } from '@/services/inventory'
import { useNow } from '@/hooks/useNow'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { Card, LiveDot } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

/** "just now", "12 s ago", "3 min ago" */
export function formatAgo(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s} s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)} h ago`
}

export function ActivityFeed({ centres, limit = 7, className }: { centres: BloodCentre[]; limit?: number; className?: string }) {
  const events = useActivity((s) => s.events)
  const now = useNow(1000)
  const names = useMemo(() => new Map(centres.map((c) => [c.id, c.name])), [centres])
  // Only events from the centres this feed is about (the visitor's city).
  const shown = useMemo(() => events.filter((e) => names.has(e.centreId)).slice(0, limit), [events, names, limit])

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <LiveDot />
          <h2 className="text-base font-semibold">Live activity</h2>
        </div>
        <span className="text-xs text-ink-500">Across {centres.length} centres</span>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="relative grid size-12 place-items-center rounded-2xl bg-ink-50 text-ink-500">
            <Radio className="size-5" />
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-ink-200/60" aria-hidden />
          </span>
          <p className="text-sm font-medium text-ink-800">Listening to {centres.length} centres</p>
          <p className="max-w-56 text-xs text-ink-500">Donations received and units issued will appear here the moment they happen.</p>
        </div>
      ) : (
        <ul className="flex flex-col px-2 py-2" aria-label="Recent stock movements">
          <AnimatePresence initial={false}>
            {shown.map((e) => {
              const received = e.kind === 'received'
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="flex items-start gap-3 rounded-2xl px-3 py-3"
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl',
                      received ? 'bg-emerald-50 text-emerald-700' : 'bg-blood-50 text-blood-700',
                    )}
                    aria-hidden
                  >
                    {received ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink-800">{describeEvent(e, names.get(e.centreId) ?? 'a partner centre')}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      <span className={cn('font-semibold', received ? 'text-emerald-700' : 'text-blood-700')}>
                        {received ? 'Received' : 'Issued'}
                      </span>{' '}
                      · <time dateTime={new Date(e.at).toISOString()}>{formatAgo(now - e.at)}</time>
                    </p>
                  </div>
                  <BloodGroupBadge group={e.group} size="sm" className="shrink-0" />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </Card>
  )
}
