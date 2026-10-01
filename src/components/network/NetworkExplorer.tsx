import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LocateFixed, MapPinOff, Search, SearchX, X } from 'lucide-react'
import type { LatLng, RealHospital } from '@/types'
import type { MapMarker } from '@/components/map/LiveMap'
import type { HospitalResult, LoadState } from '@/services/hospitals'
import { hospitalsServedBy, useCityOutlets } from '@/services/outlets'
import { useCity } from '@/services/location'
import { distanceMeters, formatDistance } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Skeleton } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/disclosure'
import { HospitalCard } from './HospitalCard'
import { OutletCard } from './OutletCard'
import { LocationBar } from './LocationBar'
import { CardSkeletons, IllustratedState, HospitalsError, SourceChip } from './parts'
import { SERVE_RADIUS_M, cityOrigin, inServiceArea, reachableOutlet, type Origin, type RadiusM } from './geo'
import type { MapLink } from './NetworkMap'

// Leaflet is heavy: the map loads after the hero and list have painted.
const NetworkMap = lazy(() => import('./NetworkMap'))

type TabKey = 'hospitals' | 'outlets'
type Selection = { kind: 'hospital' | 'outlet'; id: string } | null

const PAGE = 30
/** Spokes drawn from a selected outlet to the hospitals beside it */
const MAX_SPOKES = 8

const matches = (h: RealHospital, q: string) => h.name.toLowerCase().includes(q) || h.area.toLowerCase().includes(q)

export function NetworkExplorer({
  origin,
  onOriginChange,
  radiusM,
  onRadiusChange,
  status,
  result,
  refreshing,
  retry,
  pool,
}: {
  origin: Origin
  onOriginChange: (o: Origin) => void
  radiusM: RadiusM
  onRadiusChange: (r: RadiusM) => void
  status: LoadState
  result: HospitalResult | null
  /** Live OpenStreetMap data is loading in the background */
  refreshing: boolean
  retry: () => void
  /** Live hospitals topped up with the Delhi snapshot, for outlet "beside" lists */
  pool: RealHospital[]
}) {
  const outlets = useCityOutlets()
  const [tab, setTab] = useState<TabKey>('hospitals')
  const [selection, setSelection] = useState<Selection>(null)
  const [query, setQuery] = useState('')
  const [scrollReq, setScrollReq] = useState<{ id: string; n: number } | null>(null)
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const mapRef = useRef<HTMLDivElement>(null)

  const city = useCity()
  const isUser = origin.kind === 'user'
  const fromLabel = isUser ? 'you' : 'city centre'
  const list = useMemo(() => result?.hospitals ?? [], [result])
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => (q ? list.filter((h) => matches(h, q)) : list), [list, q])

  // "Show more" resets whenever the list itself changes.
  const listKey = `${origin.location.lat},${origin.location.lng}|${radiusM}|${q}`
  const [shown, setShown] = useState({ key: listKey, count: PAGE })
  const count = shown.key === listKey ? shown.count : PAGE
  const visible = filtered.slice(0, count)

  const outletRows = useMemo(
    () =>
      outlets
        .map(({ outlet, centre }) => ({
          outlet,
          centre,
          distanceM: distanceMeters(origin.location, outlet.location),
          served: hospitalsServedBy(outlet, pool, SERVE_RADIUS_M),
        }))
        .sort((a, b) => a.distanceM - b.distanceM),
    [outlets, origin.location, pool],
  )

  const selectedHospital = selection?.kind === 'hospital' ? pool.find((h) => h.id === selection.id) : undefined
  const selectedOutlet = selection?.kind === 'outlet' ? outletRows.find((r) => r.outlet.id === selection.id) : undefined
  const selectedNearest = useMemo(() => (selectedHospital ? reachableOutlet(selectedHospital.location) : null), [selectedHospital])
  const selectedName = selectedHospital?.name ?? selectedOutlet?.outlet.name

  useEffect(() => {
    if (scrollReq) cardRefs.current.get(scrollReq.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [scrollReq])

  /** Marker click: select, switch to its list, make sure its card is rendered, then scroll to it. */
  const selectFromMap = useCallback(
    (kind: 'hospital' | 'outlet', id: string) => {
      setSelection({ kind, id })
      setTab(kind === 'hospital' ? 'hospitals' : 'outlets')
      if (kind === 'hospital') {
        const i = filtered.findIndex((h) => h.id === id)
        if (i >= count) setShown({ key: listKey, count: Math.ceil((i + 1) / PAGE) * PAGE })
      }
      setScrollReq((r) => ({ id, n: (r?.n ?? 0) + 1 }))
    },
    [filtered, count, listKey],
  )

  /** Card click: toggle; on phones bring the map into view so the route is visible. */
  const selectFromCard = (kind: 'hospital' | 'outlet', id: string) => {
    const deselect = selection?.id === id
    setSelection(deselect ? null : { kind, id })
    if (!deselect && window.matchMedia('(max-width: 1023px)').matches) {
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const changeOrigin = (o: Origin) => {
    setSelection(null)
    onOriginChange(o)
  }

  const changeTab = (t: TabKey) => {
    setTab(t)
    if (selection && (selection.kind === 'hospital') !== (t === 'hospitals')) setSelection(null)
  }

  const markers = useMemo<MapMarker[]>(() => {
    const hospitals = new Map<string, RealHospital>(filtered.map((h) => [h.id, h]))
    // Keep the hospitals a selection refers to on the map even if outside the search.
    for (const s of selectedOutlet?.served.slice(0, MAX_SPOKES) ?? []) hospitals.set(s.hospital.id, s.hospital)
    if (selectedHospital) hospitals.set(selectedHospital.id, selectedHospital)

    const m: MapMarker[] = [...hospitals.values()].map((h) => ({
      id: h.id,
      position: h.location,
      kind: 'hospital',
      compact: true,
      label: h.name,
      active: selection?.kind === 'hospital' && selection.id === h.id,
      onClick: () => selectFromMap('hospital', h.id),
    }))
    for (const { outlet } of outletRows) {
      m.push({
        id: outlet.id,
        position: outlet.location,
        kind: 'outlet',
        label: outlet.name,
        active: selection?.kind === 'outlet' && selection.id === outlet.id,
        onClick: () => selectFromMap('outlet', outlet.id),
      })
    }
    return m
  }, [filtered, outletRows, selection, selectedHospital, selectedOutlet, selectFromMap])

  const fitTo = useMemo<LatLng[]>(() => {
    if (selectedHospital) return selectedNearest ? [selectedNearest.outlet.location, selectedHospital.location] : [selectedHospital.location]
    if (selectedOutlet) return [selectedOutlet.outlet.location, ...selectedOutlet.served.slice(0, MAX_SPOKES).map((s) => s.hospital.location)]
    if (tab === 'outlets') {
      const pts = outletRows.map((r) => r.outlet.location)
      return inServiceArea(origin.location) ? [origin.location, ...pts] : pts
    }
    const near = outletRows.filter((r) => r.distanceM <= radiusM).map((r) => r.outlet.location)
    return [origin.location, ...filtered.map((h) => h.location), ...near]
  }, [selectedHospital, selectedNearest, selectedOutlet, tab, outletRows, origin.location, filtered, radiusM])

  const links = useMemo<MapLink[]>(() => {
    if (selectedHospital && selectedNearest) {
      return [
        {
          id: 'ride',
          from: selectedNearest.outlet.location,
          to: selectedHospital.location,
          label: `≈ ${selectedNearest.rideMin} min · ${formatDistance(selectedNearest.distanceM)}`,
          strong: true,
        },
      ]
    }
    if (selectedOutlet) {
      // Spokes stay unlabelled: they're short, so a label would sit on the outlet pin.
      return selectedOutlet.served.slice(0, MAX_SPOKES).map((s, i) => ({
        id: s.hospital.id,
        from: selectedOutlet.outlet.location,
        to: s.hospital.location,
        strong: i === 0,
      }))
    }
    return []
  }, [selectedHospital, selectedNearest, selectedOutlet])

  const km = radiusM / 1000
  const loadingFirst = status === 'loading' && !result
  const countText =
    tab === 'outlets'
      ? `${outletRows.length} outlets across ${city.name}, nearest to ${isUser ? 'you' : 'the city centre'} first.`
      : loadingFirst
        ? `Finding hospitals within ${km} km…`
        : status === 'error'
          ? ''
          : q
            ? `${filtered.length} of ${list.length} hospitals match “${query.trim()}”.`
            : `${list.length} hospitals within ${km} km of ${isUser ? 'you' : 'the city centre'}, nearest first.`

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el)
    else cardRefs.current.delete(id)
  }

  return (
    <section id="explore" aria-labelledby="explore-title" className="scroll-mt-20 border-t border-ink-100 bg-white/70">
      <div className="container-page py-12 sm:py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-2">Live map</p>
            <h2 id="explore-title" className="text-3xl font-bold sm:text-4xl">
              Hospitals &amp; outlets near you
            </h2>
            <p className="mt-2 text-ink-600">
              Tap a hospital to see its nearest outlet and the emergency ride between them. Tap an outlet to see the hospitals beside it.
            </p>
          </div>
          <SourceChip status={status} source={result?.source} refreshing={refreshing} />
        </div>

        <div className="mt-6">
          <LocationBar origin={origin} onOriginChange={changeOrigin} radiusM={radiusM} onRadiusChange={onRadiusChange} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Map */}
          <div ref={mapRef} className="relative scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<Skeleton className="h-80 rounded-3xl sm:h-105 lg:h-[calc(100dvh-8rem)] lg:max-h-170" />}>
              <NetworkMap
                markers={markers}
                fitTo={fitTo}
                links={links}
                userLocation={isUser ? origin.location : null}
                className="h-80 shadow-soft sm:h-105 lg:h-[calc(100dvh-8rem)] lg:max-h-170"
              />
            </Suspense>
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end">
              <AnimatePresence mode="wait" initial={false}>
                {selectedName ? (
                  <motion.button
                    key="clear"
                    type="button"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onClick={() => setSelection(null)}
                    aria-label={`Clear selection: ${selectedName}. Show everything.`}
                    className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 py-2 pr-3 pl-3.5 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur hover:bg-white"
                  >
                    <LocateFixed className="size-3.5 shrink-0 text-blood-600" aria-hidden />
                    <span className="truncate">{selectedName}</span>
                    <X className="size-3.5 shrink-0 text-ink-500" aria-hidden />
                  </motion.button>
                ) : (
                  <motion.ul
                    key="legend"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    aria-label="Map key"
                    className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1 rounded-2xl bg-white/95 px-3 py-2 text-[11px] font-semibold text-ink-700 shadow-soft backdrop-blur"
                  >
                    <li className="inline-flex items-center gap-1.5">
                      <span className="size-3 rounded-[4px] bg-blood-600 ring-2 ring-white" aria-hidden /> RaktFlow outlet
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-ice-600 ring-2 ring-white" aria-hidden /> Hospital
                    </li>
                    {isUser && (
                      <li className="inline-flex items-center gap-1.5">
                        <span className="size-3 rounded-full bg-blue-600 ring-2 ring-white" aria-hidden /> You
                      </li>
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Lists */}
          <div className="min-w-0">
            <div className="relative -mx-4 overflow-x-auto px-4 py-1 no-scrollbar sm:mx-0 sm:px-0">
              <Tabs<TabKey>
                value={tab}
                onChange={changeTab}
                className="whitespace-nowrap"
                tabs={[
                  {
                    value: 'hospitals',
                    label: (
                      <>
                        Hospitals<span className="hidden min-[400px]:inline"> near you</span>{' '}
                        <span className="tabular opacity-70">({loadingFirst ? '…' : list.length})</span>
                      </>
                    ),
                  },
                  {
                    value: 'outlets',
                    label: (
                      <>
                        Our outlets <span className="tabular opacity-70">({outletRows.length})</span>
                      </>
                    ),
                  },
                ]}
              />
            </div>

            {tab === 'hospitals' && list.length > 0 && (
              <div className="relative mt-4">
                <label htmlFor="hospital-search" className="sr-only">
                  Search hospitals by name or area
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
                <Input
                  id="hospital-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by hospital or area"
                  autoComplete="off"
                  className="pl-11 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                )}
              </div>
            )}

            <p className="mt-3 min-h-5 text-sm text-ink-500" aria-live="polite">
              {countText}
            </p>

            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-3">
              {tab === 'outlets' ? (
                <ul className="flex flex-col gap-3">
                  {outletRows.map(({ outlet, centre, distanceM, served }) => (
                    <li key={outlet.id}>
                      <OutletCard
                        ref={register(outlet.id)}
                        outlet={outlet}
                        centre={centre}
                        distanceM={distanceM}
                        fromLabel={fromLabel}
                        served={served}
                        selected={selection?.id === outlet.id}
                        onSelect={() => selectFromCard('outlet', outlet.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : loadingFirst ? (
                <CardSkeletons />
              ) : status === 'error' ? (
                <HospitalsError onRetry={retry} />
              ) : list.length === 0 ? (
                <IllustratedState
                  icon={MapPinOff}
                  title={`No hospitals mapped within ${km} km`}
                  description="OpenStreetMap has no hospitals tagged around this point. Try a wider radius."
                  action={
                    radiusM < 8000 ? (
                      <Button variant="dark" onClick={() => onRadiusChange(8000)}>
                        Search within 8 km
                      </Button>
                    ) : isUser ? (
                      <Button variant="dark" onClick={() => changeOrigin(cityOrigin(city))}>
                        Show {city.name}
                      </Button>
                    ) : undefined
                  }
                />
              ) : filtered.length === 0 ? (
                <IllustratedState
                  icon={SearchX}
                  title="No hospitals match that search"
                  description={`Nothing within ${km} km is called “${query.trim()}”. Check the spelling or search by area.`}
                  action={
                    <Button variant="outline" onClick={() => setQuery('')}>
                      Clear search
                    </Button>
                  }
                />
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {visible.map((h) => (
                      <li key={h.id}>
                        <HospitalCard
                          ref={register(h.id)}
                          hospital={h}
                          distanceM={distanceMeters(origin.location, h.location)}
                          fromLabel={fromLabel}
                          nearest={reachableOutlet(h.location)}
                          selected={selection?.id === h.id}
                          onSelect={() => selectFromCard('hospital', h.id)}
                        />
                      </li>
                    ))}
                  </ul>
                  {filtered.length > visible.length && (
                    <div className="mt-5 flex flex-col items-center gap-2">
                      <Button variant="outline" onClick={() => setShown({ key: listKey, count: count + PAGE })}>
                        Show {Math.min(PAGE, filtered.length - visible.length)} more
                      </Button>
                      <p className="text-xs text-ink-500 tabular">
                        Showing {visible.length} of {filtered.length}
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
