import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, Info, LocateFixed, RefreshCw, X } from 'lucide-react'
import type { BloodGroup, ComponentCode } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, COMPONENT_CODES } from '@/data/blood'
import { hospitalsInCity } from '@/data/network'
import { useCity } from '@/services/location'
import { stockLevel, useCityCentres, useCityStock } from '@/services/inventory'
import { buildPlan } from '@/services/orders'
import { useNow } from '@/hooks/useNow'
import { distanceMeters } from '@/lib/utils'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'
import { LiveDot, Select } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/disclosure'
import { LiveNumber } from '@/components/stock/LiveNumber'
import { StockMatrix, unitsFor } from '@/components/stock/StockMatrix'
import { ActivityFeed, formatAgo } from '@/components/stock/ActivityFeed'
import { CentreCard } from '@/components/stock/CentreCard'
import { CompatibilityHint } from '@/components/stock/CompatibilityHint'
import type { ComponentFilter } from '@/components/stock/levels'

const TABS: { value: ComponentFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  ...COMPONENT_CODES.map((c) => ({ value: c as ComponentFilter, label: COMPONENTS[c].short })),
]

export default function Availability() {
  const city = useCity()
  const centres = useCityCentres()
  const stock = useCityStock()
  const cityHospitals = useMemo(() => hospitalsInCity(city.id), [city.id])
  const now = useNow(1000)

  const [component, setComponent] = useState<ComponentFilter>('PRBC')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [origin, setOrigin] = useState<string>('city')
  // A hospital picked in another city no longer applies.
  useEffect(() => setOrigin('city'), [city.id])
  const [compatGroup, setCompatGroup] = useState<BloodGroup>(
    () => BLOOD_GROUPS.find((g) => stockLevel(stock[g].PRBC) !== 'good') ?? 'O-',
  )
  const compatRef = useRef<HTMLElement>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())

  // "Updated x s ago": stamp every time any centre's stock changes.
  const [updatedAt, setUpdatedAt] = useState(() => Date.now())
  useEffect(() => {
    setUpdatedAt(Date.now())
  }, [centres])

  const hospital = origin === 'city' ? undefined : cityHospitals.find((h) => h.id === origin)
  const from = hospital?.location ?? city.center
  const compatComponent: ComponentCode = component === 'ALL' ? 'PRBC' : component

  const summary = useMemo(() => {
    let total = 0
    let short = 0
    for (const g of BLOOD_GROUPS) {
      const u = unitsFor(stock, g, component)
      total += u
      if (stockLevel(u) === 'low' || stockLevel(u) === 'out') short++
    }
    return { total, short }
  }, [stock, component])

  const ranked = useMemo(
    () =>
      centres
        .map((c) => ({
          centre: c,
          distanceM: distanceMeters(c.location, from),
          etaMin: hospital ? Math.max(1, Math.round(buildPlan('emergency', c.location, hospital.location).deliverAt / 60_000)) : undefined,
        }))
        .sort((a, b) => a.distanceM - b.distanceM),
    [centres, from, hospital],
  )

  const selected = centres.find((c) => c.id === selectedId)

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = centres.map((c) => ({
      id: c.id,
      position: c.location,
      kind: 'centre',
      label: `${c.name} · ${c.area}`,
      active: c.id === selectedId,
      onClick: () => {
        setSelectedId(c.id)
        cardRefs.current.get(c.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      },
    }))
    if (hospital) m.push({ id: hospital.id, position: hospital.location, kind: 'hospital', label: hospital.name })
    return m
  }, [centres, selectedId, hospital])

  const fitTo = useMemo(() => {
    if (selected) return hospital ? [selected.location, hospital.location] : [selected.location]
    const pts = centres.map((c) => c.location)
    return hospital ? [...pts, hospital.location] : pts
  }, [selected, hospital, centres])

  const findCompatible = (g: BloodGroup) => {
    setCompatGroup(g)
    compatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const open24 = centres.filter((c) => c.open24x7).length
  const ago = formatAgo(now - updatedAt)

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="grain pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_top_right,black,transparent_60%)]" aria-hidden />
        <div className="container-page relative py-10 sm:py-14">
          <p className="eyebrow mb-3">
            <LiveDot className="size-2" /> Live · {city.name}
          </p>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">Blood on the shelf, right now.</h1>
              <p className="mt-4 text-lg text-ink-600">
                Units available across {centres.length} licensed partner blood centres. Numbers move as centres receive donations and issue
                units to hospitals.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3 lg:w-104">
              <HeaderStat label={component === 'ALL' ? 'Units in network' : `${COMPONENTS[component].short} units`}>
                <LiveNumber value={summary.total} />
              </HeaderStat>
              <HeaderStat label="Groups low">{summary.short}</HeaderStat>
              <HeaderStat label="Open 24×7">
                {open24}
                <span className="text-base text-ink-400">/{centres.length}</span>
              </HeaderStat>
            </dl>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-600" aria-live="off">
            <RefreshCw className="size-3.5" aria-hidden />
            Updated <span className="tabular">{ago}</span>
          </p>
        </div>
      </section>

      {/* Matrix + live feed */}
      <section className="container-page py-10 sm:py-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative -mx-4 max-w-[100vw] overflow-x-auto px-4 py-1 no-scrollbar md:mx-0 md:px-0">
            <Tabs<ComponentFilter> value={component} onChange={setComponent} tabs={TABS} className="whitespace-nowrap" />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={component}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-sm text-ink-500"
            >
              {component === 'ALL' ? (
                'All five components combined, per blood group.'
              ) : (
                <>
                  <span className="font-medium text-ink-800">{COMPONENTS[component].name}</span> · {COMPONENTS[component].tempRange} ·{' '}
                  {COMPONENTS[component].shelfLife.toLowerCase()}
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-6">
            <StockMatrix stock={stock} component={component} onFindCompatible={findCompatible} />
            <CompatibilityHint ref={compatRef} stock={stock} component={compatComponent} group={compatGroup} onGroupChange={setCompatGroup} />
          </div>
          <ActivityFeed centres={centres} className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start" />
        </div>
      </section>

      {/* Centres */}
      <section className="border-t border-ink-100 bg-white/70">
        <div className="container-page py-12 sm:py-16">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow mb-2">Partner centres</p>
              <h2 className="text-3xl font-bold sm:text-4xl">Licensed blood centres</h2>
              <p className="mt-2 text-ink-600">Tap a centre to see it on the map. Pick your hospital to sort by distance and see emergency delivery estimates.</p>
            </div>
            <label className="flex w-full flex-col gap-1.5 md:w-80">
              <span className="text-sm font-medium text-ink-800">Distance from</span>
              <Select value={origin} onChange={(e) => setOrigin(e.target.value)}>
                <option value="city">{city.name} city centre</option>
                <optgroup label="Partner hospitals">
                  {cityHospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}, {h.area}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </label>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="relative lg:sticky lg:top-24 lg:self-start">
              <LiveMap markers={markers} fitTo={fitTo} className="h-85 shadow-soft sm:h-105 lg:h-[calc(100dvh-8rem)] lg:max-h-170" />
              <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end">
                <AnimatePresence>
                  {selected && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      onClick={() => setSelectedId(null)}
                      aria-label={`Clear selection: ${selected.name}. Show all centres.`}
                      className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 py-2 pr-3 pl-3.5 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur hover:bg-white"
                    >
                      <LocateFixed className="size-3.5 shrink-0 text-blood-600" aria-hidden />
                      <span className="truncate">{selected.name}</span>
                      <X className="size-3.5 shrink-0 text-ink-500" aria-hidden />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              {hospital && (
                <p className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-800 shadow-soft">
                  <Building2 className="size-3.5 shrink-0 text-ice-600" aria-hidden />
                  <span className="truncate">{hospital.name}</span>
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {ranked.map(({ centre, distanceM, etaMin }) => (
                <motion.li key={centre.id} layout transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
                  <CentreCard
                    ref={(el) => {
                      if (el) cardRefs.current.set(centre.id, el)
                      else cardRefs.current.delete(centre.id)
                    }}
                    centre={centre}
                    component={component}
                    distanceM={distanceM}
                    fromLabel={hospital ? 'hospital' : 'city centre'}
                    etaMin={etaMin}
                    selected={centre.id === selectedId}
                    onSelect={() => setSelectedId((id) => (id === centre.id ? null : centre.id))}
                  />
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="mt-10 flex max-w-3xl items-start gap-3 text-sm text-ink-500">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Stock is indicative until a centre reserves units against a verified doctor&rsquo;s requisition. In this prototype the figures,
              centres and hospitals are simulated; in the live service they would come from each licensed centre&rsquo;s own stock register.
              Emergency estimates assume a rider leaves within minutes of verification and are targets, not guarantees.
            </span>
          </p>
        </div>
      </section>
    </>
  )
}

function HeaderStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-paper p-3 sm:p-4">
      <dt className="truncate text-[11px] font-medium text-ink-500 sm:text-xs">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold text-ink-950 tabular sm:text-3xl">{children}</dd>
    </div>
  )
}
