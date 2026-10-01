import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { MotionConfig } from 'motion/react'
import { CalendarRange, FilterX, Info, LocateFixed, MapPin, X } from 'lucide-react'
import type { DonationCamp } from '@/types'
import { BRAND } from '@/config/brand'
import { DEFAULT_STATE_CODE, stateByCode } from '@/data/regions'
import { useCity } from '@/services/location'
import { ERAKTKOSH_CAMPS_PAGE, MAX_RANGE_DAYS, useCampPledgeCounts, useCamps, useMyPledges } from '@/services/camps'
import { ApiError } from '@/services/api'
import { useNow } from '@/hooks/useNow'
import { Button, ButtonLink } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Person } from '@/components/characters/Person'
import { CampsHero } from '@/components/camps/CampsHero'
import { CampFilters, type DistrictCount } from '@/components/camps/CampFilters'
import { CAMPS_PAGE_SIZE, CampList, CampsEmpty } from '@/components/camps/CampList'
import { PledgeModal } from '@/components/camps/PledgeModal'
import { MyPledges } from '@/components/camps/MyPledges'
import { locateNearMe, matchDistrict } from '@/components/camps/geo'
import { campPhase, matchesQuery, parseRange, plural, rangePhrase } from '@/components/camps/format'

export default function Camps() {
  useEffect(() => {
    document.title = `Blood donation camps near you — ${BRAND.name}`
  }, [])

  // State and range live in the URL so a filtered list can be shared.
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const latest = useRef(location)
  useEffect(() => {
    latest.current = location
  })
  // Without ?state=, show the visitor's own state.
  const city = useCity()
  const state = stateByCode(params.get('state') ?? '') ?? stateByCode(city.stateCode) ?? stateByCode(DEFAULT_STATE_CODE)!
  const days = parseRange(params.get('days'))

  const { status, camps, error, retry } = useCamps(state.code, days)
  const now = useNow(60_000)
  const counts = useCampPledgeCounts()
  const myPledges = useMyPledges()
  const pledgedIds = useMemo(() => new Set(myPledges.map((p) => p.campId)), [myPledges])

  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  // null: nothing picked yet, so a location match may apply. '': all districts.
  const [districtChoice, setDistrictChoice] = useState<string | null>(null)
  const [nearby, setNearby] = useState<{ stateCode: string; places: string[] } | null>(null)
  const [locating, setLocating] = useState(false)
  const [pledgeCamp, setPledgeCamp] = useState<DonationCamp | null>(null)
  const selectRef = useRef<HTMLSelectElement>(null)
  const returnFocus = useRef<{ el: HTMLElement | null; campId: string } | null>(null)

  const ready = status === 'ready'

  const districts = useMemo<DistrictCount[]>(() => {
    if (!ready) return []
    const byName = new Map<string, number>()
    for (const c of camps) if (c.district) byName.set(c.district, (byName.get(c.district) ?? 0) + 1)
    return [...byName].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [camps, ready])

  // A location lookup pre-selects the matching district once that state's camps are in.
  const nearbyHere = nearby?.stateCode === state.code ? nearby : null
  const nearbyMatch = useMemo(
    () => (nearbyHere ? matchDistrict(nearbyHere.places, districts.map((d) => d.name)) : undefined),
    [nearbyHere, districts],
  )
  const district = districtChoice ?? nearbyMatch ?? ''
  // Keep a picked district visible as a chip even when the new range has none there.
  const chips = ready && district && !districts.some((d) => d.name === district) ? [{ name: district, count: 0 }, ...districts] : districts

  const filtered = useMemo(() => {
    const rank = (c: DonationCamp) => (campPhase(c, now) === 'ended' ? 1 : 0)
    return camps
      .filter((c) => (!district || c.district === district) && matchesQuery(c, deferredQuery))
      .sort((a, b) => a.date.localeCompare(b.date) || rank(a) - rank(b)) // camps already over today go last
  }, [camps, district, deferredQuery, now])

  // Back to the first page whenever the filters change.
  const filterKey = `${state.code}|${days}|${district}|${deferredQuery}`
  const [page, setPage] = useState({ key: filterKey, limit: CAMPS_PAGE_SIZE })
  const limit = page.key === filterKey ? page.limit : CAMPS_PAGE_SIZE

  // Keeps the #hash: dropping it would make the layout scroll back to the top.
  const setParam = useCallback(
    (key: 'state' | 'days', value: string) => {
      const { search, hash } = latest.current
      const next = new URLSearchParams(search)
      next.set(key, value)
      navigate({ search: `?${next.toString()}`, hash }, { replace: true, preventScrollReset: true })
    },
    [navigate],
  )

  const changeState = (code: string) => {
    setParam('state', code)
    setDistrictChoice(null)
  }
  const changeDays = (d: number) => setParam('days', String(d))
  const clearFilters = () => {
    setQuery('')
    setDistrictChoice('')
  }
  const pickState = () => {
    const el = selectRef.current
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus({ preventScroll: true })
  }

  const locate = async () => {
    setLocating(true)
    try {
      const found = await locateNearMe()
      changeState(found.state.code)
      setNearby({ stateCode: found.state.code, places: found.places })
      toast.success(`Showing camps in ${found.state.name}`, found.places[0] ? `Near ${found.places[0]}` : undefined)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not find your location. Pick your state from the list.')
    } finally {
      setLocating(false)
    }
  }

  const openPledge = useCallback((camp: DonationCamp) => {
    returnFocus.current = { el: document.activeElement instanceof HTMLElement ? document.activeElement : null, campId: camp.id }
    setPledgeCamp(camp)
  }, [])
  const closePledge = useCallback(() => {
    setPledgeCamp(null)
    // Back to the button that opened it, or to its card once that button has become "You're pledged".
    const back = returnFocus.current
    requestAnimationFrame(() => {
      const el = back?.el?.isConnected ? back.el : back && document.getElementById(`camp-${back.campId}`)
      el?.focus({ preventScroll: true })
    })
  }, [])

  const range = rangePhrase(days)
  const summary =
    status === 'loading'
      ? `Checking e-RaktKosh for camps ${range}…`
      : status === 'error'
        ? 'The camp schedule could not be loaded.'
        : filtered.length === camps.length
          ? `${plural(camps.length, 'camp')} ${range}`
          : `${filtered.length} of ${plural(camps.length, 'camp')} ${range} match`

  const what = district && deferredQuery.trim() ? `${district} and “${deferredQuery.trim()}”` : district ? `${district} district` : `“${deferredQuery.trim()}”`
  const empty =
    camps.length > 0 ? (
      <CampsEmpty title="No camps match your filters" description={`None of the ${plural(camps.length, 'camp')} in ${state.name} ${range} match ${what}.`}>
        <Button onClick={clearFilters} icon={<FilterX className="size-4" aria-hidden />}>
          Clear filters
        </Button>
        {days < MAX_RANGE_DAYS && (
          <Button variant="outline" onClick={() => changeDays(MAX_RANGE_DAYS)} icon={<CalendarRange className="size-4" aria-hidden />}>
            Look {MAX_RANGE_DAYS} days ahead
          </Button>
        )}
      </CampsEmpty>
    ) : (
      <CampsEmpty
        title={`No camps listed ${range}`}
        description={`Blood centres in ${state.name} haven’t put any camps on e-RaktKosh ${range}. New camps are added often, or try a state next door.`}
      >
        {days < MAX_RANGE_DAYS && (
          <Button onClick={() => changeDays(MAX_RANGE_DAYS)} icon={<CalendarRange className="size-4" aria-hidden />}>
            Look {MAX_RANGE_DAYS} days ahead
          </Button>
        )}
        <Button variant="outline" onClick={pickState} icon={<MapPin className="size-4" aria-hidden />}>
          Pick a neighbouring state
        </Button>
      </CampsEmpty>
    )

  const showNearby = ready && nearbyHere && districtChoice === null

  return (
    // "user": transform-based motion is skipped for people who prefer reduced motion.
    <MotionConfig reducedMotion="user">
      <CampsHero
        campCount={status === 'ready' ? camps.length : status}
        days={days}
        stateName={state.name}
        myPledgeCount={myPledges.length}
      />

      <section
        id="camps"
        aria-labelledby="camps-title"
        className="scroll-mt-16 border-y border-ink-100 bg-white/60 pb-16 sm:pb-20 lg:scroll-mt-18"
      >
        <CampFilters
          stateCode={state.code}
          onStateChange={changeState}
          days={days}
          onDaysChange={changeDays}
          query={query}
          onQueryChange={setQuery}
          districts={chips}
          district={district}
          onDistrictChange={setDistrictChoice}
          totalCount={camps.length}
          loading={status === 'loading'}
          locating={locating}
          onLocate={locate}
          selectRef={selectRef}
        />

        <div className="container-page">
          <div className="mt-8 mb-6 flex flex-col gap-3 sm:mt-10 sm:mb-8 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h2 id="camps-title" className="text-3xl font-bold wrap-anywhere sm:text-4xl">
                Camps in {district && <>{district}, </>}
                {state.name}
              </h2>
              <p className="mt-1.5 text-sm text-ink-500" aria-live="polite">
                {summary}
              </p>
            </div>
            {showNearby && (
              <p className="inline-flex max-w-full items-center gap-2 self-start rounded-full bg-ice-50 py-1.5 pr-1.5 pl-3 text-xs font-medium text-ice-700 ring-1 ring-ice-100 md:self-auto">
                <LocateFixed className="size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">
                  {nearbyMatch
                    ? `Based on your location${nearbyHere.places[0] ? ` near ${nearbyHere.places[0]}` : ''}`
                    : `No camps listed near ${nearbyHere.places[0] ?? 'you'} for these dates. Showing all of ${state.name}.`}
                </span>
                <button
                  type="button"
                  onClick={() => setNearby(null)}
                  aria-label="Stop using my location"
                  className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-ice-100"
                >
                  <X className="size-3.5" />
                </button>
              </p>
            )}
          </div>

          <CampList
            status={status}
            error={error}
            onRetry={retry}
            camps={filtered}
            limit={limit}
            onShowMore={() => setPage({ key: filterKey, limit: limit + CAMPS_PAGE_SIZE })}
            now={now}
            counts={counts}
            pledgedIds={pledgedIds}
            onPledge={openPledge}
            empty={empty}
          />
        </div>
      </section>

      <MyPledges className="pt-12 sm:pt-16" />

      {/* Another way to give */}
      <section className="container-page pt-12 sm:pt-16">
        <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-5xl bg-ink-950 p-6 text-white sm:flex-row sm:items-center sm:p-10">
          <div className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-blood-600/40 blur-3xl" aria-hidden />
          <Person who="doctor" mood="happy" backdrop="rgb(255 255 255 / 0.08)" className="w-20 shrink-0 sm:w-28" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">No camp on a day that suits you?</h2>
            <p className="mt-2 max-w-xl text-ink-300">
              Book a slot at a licensed blood centre instead. It takes about 45 minutes and you can pick the time.
            </p>
          </div>
          <ButtonLink to="/donate#book" variant="white" size="lg" className="shrink-0">
            Book a slot
          </ButtonLink>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14" aria-label="About this information">
        <p className="flex max-w-3xl items-start gap-3 text-sm text-ink-500">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Camp schedule from{' '}
            <a href={ERAKTKOSH_CAMPS_PAGE} target="_blank" rel="noopener noreferrer" className="font-medium text-ink-700 underline underline-offset-4 hover:text-ink-950">
              e-RaktKosh
            </a>
            , Ministry of Health &amp; Family Welfare, Government of India. {BRAND.name} is not affiliated with e-RaktKosh or the camp organisers.
            Timings can change, so call the organiser before you go. Pledges are counted through {BRAND.name}; in this prototype they are stored
            on this device. Blood donation in India is voluntary and unpaid.
          </span>
        </p>
      </section>

      <PledgeModal camp={pledgeCamp} onClose={closePledge} />
    </MotionConfig>
  )
}
