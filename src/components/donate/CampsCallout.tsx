import { ArrowRight, Tent } from 'lucide-react'
import { stateByCode } from '@/data/regions'
import { useCity } from '@/services/location'
import { useCamps, usePledgeStats } from '@/services/camps'
import { ButtonLink } from '@/components/ui/Button'
import { LiveDot } from '@/components/ui/primitives'
import { Person } from '@/components/characters/Person'
import { Prop } from '@/components/characters/Prop'
import { SpeechBubble } from '@/components/characters/SpeechBubble'
import { BRAND } from '@/config/brand'

/** Points donors who would rather give at a community camp to the live camp list. */
export function CampsCallout() {
  // Same window as the home page band, so the request is served from cache.
  const city = useCity()
  const { status, camps } = useCamps(city.stateCode, 7)
  const stats = usePledgeStats()
  const stateName = stateByCode(city.stateCode)?.name ?? city.state

  return (
    <div className="relative isolate grid items-center gap-6 overflow-hidden rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:p-8">
      <div aria-hidden className="absolute -right-20 -bottom-24 -z-10 size-72 rounded-full bg-emerald-50 blur-2xl" />
      <div className="min-w-0">
        <p className="eyebrow mb-3 text-emerald-700">
          <LiveDot color="bg-emerald-500" className="size-2" /> Live from e-RaktKosh
        </p>
        <h2 className="text-2xl font-bold sm:text-3xl">Rather give at a camp near you?</h2>
        <p className="mt-2 max-w-xl text-ink-600">
          {status === 'ready' && camps.length > 0 ? (
            <>
              <span className="font-semibold text-ink-900 tabular">{camps.length}</span> voluntary blood donation camps are on in {stateName} this
              week.
            </>
          ) : (
            <>See voluntary blood donation camps from the national schedule.</>
          )}{' '}
          Pledge in a tap and we count it
          {stats.pledged > 0 && (
            <>
              {' '}
              alongside <span className="font-semibold text-ink-900 tabular">{stats.pledged.toLocaleString(BRAND.locale)}</span> others
            </>
          )}
          .
        </p>
        <ButtonLink to="/camps" size="lg" className="mt-6 w-full sm:w-auto">
          Find a camp <ArrowRight className="size-5" aria-hidden />
        </ButtonLink>
      </div>
      <div className="hidden items-end gap-1 sm:flex" aria-hidden>
        <div className="flex flex-col items-end gap-2">
          <SpeechBubble tail="bottom" tailClassName="left-auto right-10">
            Count me in!
          </SpeechBubble>
          <Person who="rohan" mood="happy" badge="heart" className="w-28 lg:w-32" />
        </div>
        <Prop icon={Tent} tone="emerald" className="mb-2 w-12 lg:w-14" />
      </div>
    </div>
  )
}
