import { Link } from 'react-router'
import { ArrowRight, CalendarClock, CalendarDays, HeartHandshake, MapPin, Scale, Tent, UserRound } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { useCity } from '@/services/location'
import { useCamps, usePledgeStats } from '@/services/camps'
import { useDonorCount } from '@/services/donors'
import { ButtonLink } from '@/components/ui/Button'
import { LiveDot } from '@/components/ui/primitives'
import { Person } from '@/components/characters/Person'
import { Prop } from '@/components/characters/Prop'
import { EcgLine } from './graphics'
import { Reveal, SECTION_Y } from './Reveal'

const ELIGIBILITY = [
  { icon: UserRound, label: 'Aged 18–65' },
  { icon: Scale, label: '45 kg or more' },
  { icon: CalendarClock, label: '90 days since your last donation (120 for women)' },
  { icon: HeartHandshake, label: 'Fit and well on the day' },
]

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(BRAND.locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Placeholder bar that reads on the red card (the shared Skeleton is tuned for white). */
function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/15 ${className}`} />
}

/** This week's camps in the visitor's state, from the national e-RaktKosh schedule. */
function CampsPanel() {
  const city = useCity()
  const { status, camps } = useCamps(city.stateCode, 7)
  const stats = usePledgeStats()

  return (
    <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20">
            <LiveDot color="bg-emerald-400" className="size-2" /> Live from e-RaktKosh
          </p>
          <div className="mt-4" aria-live="polite">
            {status === 'loading' ? (
              <Shimmer className="h-12 w-40" />
            ) : status === 'error' ? (
              <p className="text-sm text-blood-50">The national camp schedule is not responding right now. Try the camps page in a minute.</p>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-5xl leading-none font-bold tracking-[-0.04em] text-white tabular">{camps.length}</span>
                <span className="text-sm text-blood-50">
                  {camps.length === 1 ? 'camp' : 'camps'} in {city.state} in the next 7 days
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="-mt-1 -mr-1 hidden shrink-0 items-end min-[400px]:flex" aria-hidden>
          <Prop icon={Tent} tone="emerald" className="mb-1 w-9" />
          <Person who="priya" mood="happy" badge="heart" className="-ml-1 w-16 sm:w-20" />
        </div>
      </div>

      {status !== 'error' && (
        <ul className="mt-4 flex flex-col gap-2">
          {status === 'loading'
            ? [0, 1].map((i) => <Shimmer key={i} className="h-14 w-full" />)
            : camps.slice(0, 2).map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 text-ink-900">
                  <span className="grid w-14 shrink-0 place-items-center rounded-xl bg-blood-50 py-1.5 text-center">
                    <CalendarDays className="size-4 text-blood-600" aria-hidden />
                    <span className="mt-0.5 text-[11px] leading-tight font-semibold text-ink-700">{shortDate(c.date)}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-950">{c.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-ink-500">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{c.venue || c.district}</span>
                    </p>
                  </div>
                </li>
              ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link to="/camps" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
          See every camp and pledge
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        {stats.pledged > 0 && (
          <p className="text-xs text-blood-100">
            <span className="font-semibold text-white tabular">{stats.pledged.toLocaleString(BRAND.locale)}</span> pledged via {BRAND.name}
          </p>
        )}
      </div>
    </div>
  )
}

/** Donating, compact: why it matters, a quick eligibility read, and the camps near the visitor. */
export function GiveBlood() {
  const donors = useDonorCount()
  return (
    <section aria-labelledby="donate-title" className={SECTION_Y}>
      <div className="container-page">
        <Reveal className="relative isolate overflow-hidden rounded-4xl bg-blood-600 p-5 text-white sm:rounded-5xl sm:p-10 lg:p-12">
          {/* Texture */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'radial-gradient(50% 70% at 100% 0%, var(--color-blood-500), transparent 70%), radial-gradient(45% 60% at 0% 100%, var(--color-blood-800), transparent 70%), radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)',
              backgroundSize: 'auto, auto, 20px 20px',
            }}
          />
          <EcgLine beats={6} className="absolute bottom-6 left-0 -z-10 w-[160%] text-white/30 sm:w-full" strokeWidth={2} trackOpacity={0.25} glow={false} />

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="eyebrow mb-3 text-white/80">Give blood</p>
              <h2 id="donate-title" className="text-[2rem] leading-[1.02] font-extrabold tracking-[-0.04em] text-white sm:text-5xl">
                Every unit on the map started with a donor.
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-blood-50 sm:text-lg">
                One donation is separated into red cells, plasma and platelets, helping up to three patients. Check your eligibility in a minute,
                then book a slot at a licensed centre or join a camp.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Who can donate">
                {ELIGIBILITY.map(({ icon: Icon, label }) => (
                  <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/20">
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                <ButtonLink to="/donate" variant="white" size="lg" className="w-full sm:w-auto">
                  Book a donation slot <ArrowRight className="size-5" aria-hidden />
                </ButtonLink>
                {donors > 0 && (
                  <p className="text-sm text-blood-100">
                    <span className="font-semibold text-white tabular">{donors.toLocaleString(BRAND.locale)}</span>{' '}
                    {donors === 1 ? 'donor has' : 'donors have'} registered
                  </p>
                )}
              </div>
            </div>

            <CampsPanel />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
