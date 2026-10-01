import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Hash, KeyRound, MapPinned, PackageSearch, Snowflake } from 'lucide-react'
import { ACTIVE_STATUSES, liveStatus, useMyOrders } from '@/services/orders'
import { useCurrentUser } from '@/services/auth'
import { useNow } from '@/hooks/useNow'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, EmptyState, Input, LiveDot } from '@/components/ui/primitives'
import { LiveOrderCard } from '@/components/tracking/OrderCards'

/** Accepts "rf-7k2m9q", "RF7K2M9Q" or "7K2M9Q" and returns "RF-7K2M9Q". */
function normalizeOrderId(raw: string) {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '')
  const m = /^(?:RF-?)?([A-Z0-9]{6})$/.exec(v)
  return m ? `RF-${m[1]}` : null
}

const FEATURES = [
  { icon: MapPinned, title: 'Live rider location', body: 'See the rider move along the route from the blood centre to the hospital, with an ETA that updates every second.' },
  { icon: Snowflake, title: 'Cold-chain readings', body: 'The sealed box carries a temperature logger. Readings stream to your screen with the safe range marked.' },
  { icon: KeyRound, title: 'OTP handover', body: 'The box is released only at the blood transfusion desk, against a 4-digit code that only you and the hospital see.' },
]

export default function TrackLookup() {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const orders = useMyOrders()
  const now = useNow(1000)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const active = useMemo(
    () =>
      orders
        .filter((o) => ACTIVE_STATUSES.includes(liveStatus(o, now)))
        .sort((a, b) => (b.placedAt ?? b.createdAt) - (a.placedAt ?? a.createdAt)),
    [orders, now],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const id = normalizeOrderId(value)
    if (!id) {
      setError('Order IDs look like RF-7K2M9Q: “RF-” followed by 6 letters or numbers.')
      return
    }
    setError(null)
    navigate(`/track/${id}`)
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="grain pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_top_right,black,transparent_65%)]" aria-hidden />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <p className="eyebrow mb-4">
              <LiveDot className="size-2" /> Live tracking
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">
              Every minute,
              <br />
              on the map.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-600">
              Follow the sealed cold box from the licensed blood centre to the hospital&rsquo;s transfusion desk, with a live ETA, the rider&rsquo;s
              position and temperature readings.
            </p>

            <form onSubmit={submit} className="mt-8 max-w-lg" noValidate>
              <label htmlFor="order-id" className="text-sm font-medium text-ink-800">
                Order ID
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Hash className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-400" aria-hidden />
                  <Input
                    id="order-id"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value.toUpperCase())
                      if (error) setError(null)
                    }}
                    placeholder="RF-7K2M9Q"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={12}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'order-id-error' : 'order-id-hint'}
                    className="h-14 pl-12 font-display text-lg font-semibold tracking-wider"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14">
                  Track order <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
              {error ? (
                <p id="order-id-error" role="alert" className="mt-2 text-sm font-medium text-blood-700">
                  {error}
                </p>
              ) : (
                <p id="order-id-hint" className="mt-2 text-xs text-ink-500">
                  You&rsquo;ll find it on your receipt and in My orders.
                </p>
              )}
            </form>
          </div>

          <RouteIllustration />
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        {user ? (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2">In progress</p>
                <h2 className="text-3xl font-bold">Your active deliveries</h2>
              </div>
              <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-700 hover:text-ink-950">
                All orders <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {active.length > 0 ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((o, i) => (
                  <motion.li key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <LiveOrderCard order={o} now={now} />
                  </motion.li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<PackageSearch className="size-6" />}
                title="No deliveries in progress"
                description="When you place an order, it shows up here with a live countdown the moment payment is confirmed."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ButtonLink to="/order">Order blood</ButtonLink>
                    <ButtonLink to="/orders" variant="outline">
                      Past orders
                    </ButtonLink>
                  </div>
                }
              />
            )}
          </>
        ) : (
          <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-2xl font-bold">Sign in to see your deliveries</h2>
              <p className="mt-1 text-ink-600">Your in-progress orders appear here automatically, with live ETAs.</p>
            </div>
            <ButtonLink to={`/login?next=${encodeURIComponent('/track')}`} variant="dark" size="lg">
              Sign in <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </Card>
        )}

        <ul className="mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-ink-950 text-white">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-600">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

/** Decorative mini tracking scene: route, pickup, drop and a moving rider. */
function RouteIllustration() {
  const reduce = useReducedMotion()
  const path = 'M70 240 L70 180 L160 180 L160 120 L250 120 L250 78 L330 78'
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-blood-600/10 blur-3xl" />
      <div className="overflow-hidden rounded-4xl bg-ink-950 shadow-lift">
        <svg viewBox="0 0 400 300" className="block h-auto w-full">
          <defs>
            <pattern id="rf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgb(255 255 255 / 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#rf-grid)" />
          {/* streets */}
          <g stroke="rgb(255 255 255 / 0.09)" strokeWidth="10" strokeLinecap="round" fill="none">
            <path d="M0 180 H400" />
            <path d="M160 0 V300" />
            <path d="M0 78 H400" />
            <path d="M250 0 V300" />
            <path d="M70 300 V120" />
          </g>
          <path d={path} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" />
          <motion.path
            d={path}
            fill="none"
            stroke="var(--color-blood-500)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
          {/* pickup */}
          <rect x="54" y="224" width="32" height="32" rx="10" fill="var(--color-blood-600)" stroke="white" strokeWidth="2.5" />
          <path d="M70 233v14M63 240h14" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
          {/* drop */}
          <circle cx="330" cy="78" r="17" fill="var(--color-ice-600)" stroke="white" strokeWidth="2.5" />
          <path d="M324 86v-10l6-4 6 4v10" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          {/* rider */}
          <g transform={reduce ? 'translate(203 120)' : undefined}>
            <circle r="16" fill="var(--color-blood-600)" opacity="0.25">
              {!reduce && <animate attributeName="r" values="12;22;12" dur="2.2s" repeatCount="indefinite" />}
            </circle>
            <circle r="10" fill="var(--color-blood-600)" stroke="white" strokeWidth="3" />
            {!reduce && <animateMotion dur="8s" repeatCount="indefinite" path={path} />}
          </g>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute -bottom-5 -left-3 rounded-2xl bg-white p-3.5 pr-5 shadow-lift sm:-left-6"
      >
        <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-500 uppercase">Arriving in</p>
        <p className="font-display text-3xl leading-none font-bold text-ink-950 tabular">06:42</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute -top-4 -right-2 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-lift sm:-right-5"
      >
        <Snowflake className="size-4 text-ice-600" />
        <span className="text-sm font-semibold text-ink-950 tabular">4.1 °C</span>
        <span className="text-xs font-medium text-emerald-700">In range</span>
      </motion.div>
    </div>
  )
}
