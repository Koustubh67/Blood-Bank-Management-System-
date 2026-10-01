import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Building2, MapPin, Motorbike, Snowflake } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { hospitalsInCity, totalUnits } from '@/data/network'
import { useCity, useDeliveryLocation } from '@/services/location'
import { useCityCentres, useCityStock } from '@/services/inventory'
import { useNearbyHospitals } from '@/services/hospitals'
import { hospitalsServedBy, nearestOutlet, outletTelemetry, useCityOutlets } from '@/services/outlets'
import { rideMinutes } from '@/services/orders'
import { useNow } from '@/hooks/useNow'
import { ButtonLink } from '@/components/ui/Button'
import { LiveDot } from '@/components/ui/primitives'
import { Person } from '@/components/characters/Person'
import { Prop } from '@/components/characters/Prop'
import { cn, distanceMeters, formatDistance } from '@/lib/utils'
import { CountUp } from './CountUp'
import { HomeHeading, Reveal, SECTION_Y } from './Reveal'

/** Real hospitals are looked up within this radius of the city centre. */
const HOSPITAL_RADIUS_M = 6000
const SHOWN_OUTLETS = 3

/**
 * The visitor's city's outlet fridges, nearest to them first. Real hospitals
 * from OpenStreetMap fill in when they arrive; until then (or if the lookup
 * fails) each row still shows the outlet, its shelf count and fridge reading.
 */
function OutletsCard() {
  const city = useCity()
  const { point, source } = useDeliveryLocation()
  const rows = useCityOutlets()
  const now = useNow(5000)
  const nearby = useNearbyHospitals(city.center, HOSPITAL_RADIUS_M)
  const hospitals = nearby.result?.hospitals

  const shown = useMemo(() => {
    const sorted = [...rows].sort((a, b) => distanceMeters(a.outlet.location, point) - distanceMeters(b.outlet.location, point))
    return sorted.slice(0, SHOWN_OUTLETS).map((r) => {
      const served = hospitals ? hospitalsServedBy(r.outlet, hospitals) : []
      return { ...r, served, nearest: served[0] }
    })
  }, [rows, point, hospitals])

  const closest = rows.length ? nearestOutlet(point, rows.map((r) => r.outlet)) : null

  const servedCount = useMemo(() => {
    if (!hospitals) return 0
    const ids = new Set<string>()
    for (const r of rows) for (const s of hospitalsServedBy(r.outlet, hospitals)) ids.add(s.hospital.id)
    return ids.size
  }, [rows, hospitals])

  return (
    <Reveal delay={0.08} className="relative isolate overflow-hidden rounded-4xl bg-ink-950 p-5 text-white shadow-lift sm:p-8">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(55% 60% at 100% 0%, rgb(6 182 212 / 0.22), transparent 70%), radial-gradient(45% 55% at 0% 100%, rgb(200 16 46 / 0.26), transparent 70%)',
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-ice-100 ring-1 ring-white/15">
            <Snowflake className="size-3.5" aria-hidden /> {rows.length} {BRAND.name} {rows.length === 1 ? 'outlet' : 'outlets'} in {city.name}
          </p>
          <h3 className="mt-4 text-2xl leading-[1.1] font-bold tracking-tight text-white sm:text-[1.7rem]">Fridges beside the hospitals.</h3>
          <p className="mt-2 text-sm text-ink-300" aria-live="polite">
            {hospitals && servedCount > 0 ? (
              <>
                <span className="font-semibold text-white tabular">{servedCount}</span> real hospitals within 2.5 km of an outlet. Every fridge is
                logged every minute.
              </>
            ) : nearby.status === 'loading' || nearby.refreshing ? (
              'Looking up hospitals near each outlet. Fridge readings are live.'
            ) : (
              'Every fridge is logged every minute.'
            )}
          </p>
        </div>
        <div className="-mt-1 -mr-1 hidden shrink-0 items-end min-[400px]:flex" aria-hidden>
          <Prop icon={Motorbike} tone="blood" className="mb-1 w-9 sm:w-10" />
          <Person who="rider" mood="happy" className="-ml-1 w-16 sm:w-20" />
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2">
        {shown.map(({ outlet, centre, nearest, served }) => {
          const t = outletTelemetry(outlet, centre, now)
          const inRange = t.tempC >= 2 && t.tempC <= 6
          const isClosest = source === 'gps' && closest?.outlet.id === outlet.id
          return (
            <li key={outlet.id} className="flex items-center gap-3 rounded-2xl bg-white/6 p-3 ring-1 ring-white/10">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blood-600 text-white">
                <Building2 className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {nearest ? nearest.hospital.name : `${outlet.area} outlet`}
                  {isClosest && <span className="ml-2 rounded-full bg-ice-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-ice-100 uppercase">Nearest you</span>}
                </p>
                <p className="text-xs text-ink-400 sm:truncate">
                  {nearest ? (
                    <>
                      {outlet.area} outlet · {formatDistance(nearest.distanceM)} · ≈ {rideMinutes(outlet.location, nearest.hospital.location)} min
                      {served.length > 1 && ` · +${served.length - 1} nearby`}
                    </>
                  ) : (
                    <>
                      <span className="tabular">{t.units}</span> units on the shelf · {outlet.open24x7 ? 'open 24×7' : 'day hours'}
                    </>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap tabular',
                  inRange ? 'bg-emerald-400/15 text-emerald-300' : 'bg-blood-500/20 text-blood-300',
                )}
              >
                {t.tempC.toFixed(1)} °C
              </span>
            </li>
          )
        })}
      </ul>
    </Reveal>
  )
}

/** Live network size for the visitor's city, then the outlet fridges near them. */
export function NearYou() {
  const city = useCity()
  const centres = useCityCentres()
  const stock = useCityStock()
  const outlets = useCityOutlets()
  const partners = useMemo(() => hospitalsInCity(city.id), [city.id])
  const units = useMemo(() => totalUnits(stock), [stock])

  const stats = [
    { value: units, label: 'units on the shelf now', live: true },
    { value: centres.length, label: 'licensed blood centres' },
    { value: outlets.length, label: `${BRAND.name} outlets` },
    { value: partners.length, label: 'partner hospitals' },
  ]

  return (
    <section aria-labelledby="near-title" className={SECTION_Y}>
      <div className="container-page grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        <div className="min-w-0">
          <HomeHeading
            size="md"
            id="near-title"
            eyebrow={
              <>
                <MapPin className="size-3.5" aria-hidden /> Near you · {city.name}
              </>
            }
            title={
              <>
                Blood kept <span className="text-ice-600">minutes from</span> the hospital.
              </>
            }
            description={`Licensed storage outlets sit beside busy hospitals in ${city.name}, stocked by partner blood centres and logged around the clock.`}
          />

          <Reveal delay={0.05}>
            <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink-100 ring-1 ring-ink-100">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse bg-white p-4 sm:p-5">
                  <dt className="mt-1 flex items-center gap-1.5 text-sm leading-snug text-ink-500">
                    {s.live && <LiveDot color="bg-emerald-500" className="size-2" />}
                    {s.label}
                  </dt>
                  <dd className="font-display text-3xl leading-none font-bold tracking-[-0.03em] text-ink-950 tabular sm:text-4xl">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink to="/network" variant="dark" size="lg" className="w-full sm:w-auto">
                See the {city.name} network <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
              <Link
                to="/availability"
                className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 font-semibold text-ink-800 hover:bg-ink-100"
              >
                Check live stock
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>

        <OutletsCard />
      </div>
    </section>
  )
}
