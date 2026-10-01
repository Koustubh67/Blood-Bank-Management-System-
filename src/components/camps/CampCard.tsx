import type { ReactNode } from 'react'
import { CircleCheck, Clock, ExternalLink, Heart, Hospital, MapPin, Navigation, Phone, Users } from 'lucide-react'
import type { DonationCamp } from '@/types'
import { campRegistrationUrl } from '@/services/camps'
import { Button } from '@/components/ui/Button'
import { Badge, LiveDot, Skeleton } from '@/components/ui/primitives'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { campHosts, campTimeRange, directionsUrl, phoneLink, type CampPhase } from './format'

const iconAction =
  'grid size-11 shrink-0 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 hover:text-ink-950'

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-ink-400" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </li>
  )
}

export function CampCard({
  camp,
  phase,
  pledgeCount,
  pledged,
  onPledge,
}: {
  camp: DonationCamp
  phase: CampPhase
  /** Active pledges recorded for this camp */
  pledgeCount: number
  /** This device or account already pledged here */
  pledged: boolean
  onPledge: (camp: DonationCamp) => void
}) {
  const { organiser, bloodCentre } = campHosts(camp)
  const phone = camp.contact ? phoneLink(camp.contact) : null
  const ended = phase === 'ended'

  return (
    <article
      id={`camp-${camp.id}`}
      tabIndex={-1}
      className={cn(
        'group flex h-full flex-col rounded-3xl border bg-white p-5 shadow-soft transition duration-300 sm:p-6',
        pledged ? 'border-emerald-200' : 'border-ink-100 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-lift',
        ended && 'bg-ink-50/60 shadow-none',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('inline-flex items-center gap-1.5 text-sm font-semibold tabular', camp.startTime ? 'text-ink-900' : 'text-ink-500')}>
          <Clock className="size-4 shrink-0 text-blood-600" aria-hidden />
          {campTimeRange(camp)}
        </p>
        {phase === 'live' && (
          <Badge tone="green">
            <LiveDot className="size-2" color="bg-emerald-500" /> On now
          </Badge>
        )}
        {ended && <Badge>Ended</Badge>}
      </div>

      <h4 className={cn('mt-3 text-lg leading-snug font-bold wrap-anywhere', ended && 'text-ink-600')}>{camp.name}</h4>

      <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
        <Detail icon={<MapPin className="size-4" />}>{camp.venue || camp.district}</Detail>
        {organiser && (
          <Detail icon={<Users className="size-4" />}>
            <span className="sr-only">Organised by </span>
            {organiser}
          </Detail>
        )}
        {bloodCentre && (
          <Detail icon={<Hospital className="size-4" />}>
            <span className="sr-only">Blood centre: </span>
            {bloodCentre}
          </Detail>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {camp.district && <Badge>{camp.district}</Badge>}
        {pledgeCount > 0 && (
          <Badge tone="red">
            <Heart className="size-3 fill-current" aria-hidden />
            {pledgeCount} pledged via {BRAND.name}
          </Badge>
        )}
      </div>

      <div className="mt-auto pt-5">
        <div className="border-t border-ink-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {pledged ? (
                <p className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CircleCheck className="size-4.5 shrink-0" aria-hidden /> You&rsquo;re pledged
                </p>
              ) : ended ? (
                <p className="flex h-11 items-center justify-center rounded-full bg-ink-100 text-sm font-medium text-ink-500">Ended for today</p>
              ) : (
                <Button className="w-full" onClick={() => onPledge(camp)} icon={<Heart className="size-4" aria-hidden />}>
                  I&rsquo;ll donate here
                </Button>
              )}
            </div>
            <a
              href={directionsUrl(camp)}
              target="_blank"
              rel="noopener noreferrer"
              title="Directions"
              aria-label={`Directions to ${camp.name} (opens Google Maps)`}
              className={iconAction}
            >
              <Navigation className="size-4.5" aria-hidden />
            </a>
            {phone && (
              <a href={phone.href} title={`Call ${phone.label}`} aria-label={`Call the organiser on ${phone.label}`} className={iconAction}>
                <Phone className="size-4.5" aria-hidden />
              </a>
            )}
          </div>

          {camp.portalRegistration && !ended && (
            <a
              href={campRegistrationUrl(camp.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-full py-1 text-xs font-semibold text-blood-700 underline-offset-4 hover:text-blood-800 hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Pre-register on e-RaktKosh
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function CampCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6" aria-hidden>
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-4 h-6 w-4/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-6 border-t border-ink-100 pt-4">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <Skeleton className="mx-auto mt-3 h-4 w-44" />
      </div>
    </div>
  )
}
