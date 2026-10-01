import { useMemo, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronDown, CloudOff, ExternalLink, RefreshCw, SearchX } from 'lucide-react'
import type { DonationCamp } from '@/types'
import { ERAKTKOSH_CAMPS_PAGE, isoDay, type CampsStatus } from '@/services/camps'
import { Button, buttonClass } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/primitives'
import { Prop } from '@/components/characters/Prop'
import { EASE_OUT } from '@/components/home/Reveal'
import { cn } from '@/lib/utils'
import { CampCard, CampCardSkeleton } from './CampCard'
import { campPhase, dayHeading, plural } from './format'

export const CAMPS_PAGE_SIZE = 24

interface CampListProps {
  status: CampsStatus
  error?: string
  onRetry: () => void
  /** Filtered camps, soonest first */
  camps: DonationCamp[]
  limit: number
  onShowMore: () => void
  now: number
  counts: Record<string, number>
  pledgedIds: Set<string>
  onPledge: (camp: DonationCamp) => void
  /** Shown when the filters leave nothing */
  empty: ReactNode
}

/** Camps grouped by day, paged in blocks of 24. */
export function CampList({ status, error, onRetry, camps, limit, onShowMore, now, counts, pledgedIds, onPledge, empty }: CampListProps) {
  const today = isoDay(new Date(now))

  const groups = useMemo(() => {
    const totals = new Map<string, number>()
    for (const c of camps) totals.set(c.date, (totals.get(c.date) ?? 0) + 1)
    const out: { date: string; total: number; camps: DonationCamp[] }[] = []
    for (const c of camps.slice(0, limit)) {
      let g = out[out.length - 1]
      if (!g || g.date !== c.date) {
        g = { date: c.date, total: totals.get(c.date) ?? 0, camps: [] }
        out.push(g)
      }
      g.camps.push(c)
    }
    return out
  }, [camps, limit])

  if (status === 'loading') {
    return (
      <div aria-hidden>
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-7 w-44" />
          <span className="h-px flex-1 bg-ink-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <CampCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') return <CampsError message={error} onRetry={onRetry} />
  if (camps.length === 0) return <>{empty}</>

  const remaining = camps.length - limit

  return (
    <div>
      <div className="flex flex-col gap-10 sm:gap-12">
        {groups.map((g) => {
          const h = dayHeading(g.date, today)
          return (
            <section key={g.date} aria-labelledby={`camps-day-${g.date}`}>
              <div className="mb-4 flex items-center gap-3 sm:mb-5">
                <h3 id={`camps-day-${g.date}`} className="text-xl font-bold sm:text-2xl">
                  <span className={cn(g.date === today && 'text-blood-600')}>{h.label}</span>
                  <span className="font-semibold text-ink-400"> · {h.detail}</span>
                </h3>
                <span aria-hidden className="h-px flex-1 bg-ink-100" />
                <span className="shrink-0 text-xs font-semibold text-ink-500">{plural(g.total, 'camp')}</span>
              </div>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {g.camps.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_OUT, delay: Math.min(i, 8) * 0.04 }}
                    className="min-w-0"
                  >
                    <CampCard
                      camp={c}
                      phase={campPhase(c, now)}
                      pledgeCount={counts[c.id] ?? 0}
                      pledged={pledgedIds.has(c.id)}
                      onPledge={onPledge}
                    />
                  </motion.li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {remaining > 0 && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <Button variant="outline" size="lg" onClick={onShowMore} icon={<ChevronDown className="size-4" aria-hidden />}>
            Show {plural(Math.min(CAMPS_PAGE_SIZE, remaining), 'more camp')}
          </Button>
          <p className="text-xs text-ink-500 tabular">
            Showing {limit} of {camps.length}
          </p>
        </div>
      )}
    </div>
  )
}

function CampsError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-4xl border border-ink-100 bg-white px-6 py-12 text-center shadow-soft sm:py-16">
      <Prop icon={CloudOff} tone="blood" className="w-16 sm:w-20" />
      <h3 className="mt-4 text-2xl font-bold">Couldn&rsquo;t load the camp schedule</h3>
      <p className="mt-2 max-w-md text-ink-600">
        {message ?? 'Could not load camps.'} You can also see the official schedule on the e-RaktKosh website.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden />}>
          Try again
        </Button>
        <a href={ERAKTKOSH_CAMPS_PAGE} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'outline' })}>
          Open e-RaktKosh <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  )
}

/** Nothing for these filters, and a few ways forward. */
export function CampsEmpty({ title, description, children }: { title: string; description: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-4xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center sm:py-16">
      <Prop icon={SearchX} tone="ink" className="w-16 sm:w-20" />
      <h3 className="mt-4 text-2xl font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-ink-600">{description}</p>
      {children && <div className="mt-6 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{children}</div>}
    </div>
  )
}
