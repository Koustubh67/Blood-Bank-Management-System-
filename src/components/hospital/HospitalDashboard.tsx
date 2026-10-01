import { useEffect, useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { BadgeCheck, Building2, Clock3, Headset, IndianRupee, MapPin, PackageCheck, Radio, Siren, Timer, Truck } from 'lucide-react'
import type { User } from '@/types'
import { ButtonLink } from '@/components/ui/Button'
import { LiveDot } from '@/components/ui/primitives'
import { useNow } from '@/hooks/useNow'
import { useMyOrders } from '@/services/orders'
import { useCityCentres, useCityStock } from '@/services/inventory'
import { hospitalById } from '@/data/network'
import { cityById } from '@/data/cities'
import { PRIORITIES } from '@/data/blood'
import { BRAND } from '@/config/brand'
import { cn, formatINR } from '@/lib/utils'
import { deliveredAt, etaMs, isActive, startOfMonth, unitsOf, unitsPerDay } from './metrics'
import { EmergencyPanel, orderHref } from './EmergencyPanel'
import { ActiveDeliveries } from './ActiveDeliveries'
import { UnitsChart } from './UnitsChart'
import { StockSnapshot } from './StockSnapshot'
import { DarkPill } from './DarkPill'
import { OrderHistory } from './OrderHistory'

// ---------- pieces ----------

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion()
  const mv = useSpring(reduce ? value : 0, { stiffness: 80, damping: 20, restDelta: 0.001 })
  const text = useTransform(mv, (v) => format(v))
  useEffect(() => {
    if (reduce) mv.jump(value)
    else mv.set(value)
  }, [value, mv, reduce])
  return <motion.span>{text}</motion.span>
}

function Kpi({
  icon,
  label,
  children,
  sub,
  accent,
  index,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
  sub: ReactNode
  accent?: boolean
  index: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      className={cn(
        'flex flex-col rounded-3xl border p-4 shadow-soft sm:p-5',
        accent ? 'border-blood-100 bg-white ring-1 ring-blood-100' : 'border-ink-100 bg-white',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-500 sm:text-sm">{label}</p>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', accent ? 'bg-blood-50 text-blood-600' : 'bg-ink-50 text-ink-600')}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{children}</p>
      <p className="mt-1.5 text-xs text-ink-500">{sub}</p>
    </motion.div>
  )
}

function LiveClock({ now, city }: { now: number; city?: string }) {
  const d = new Date(now)
  const time = d.toLocaleTimeString(BRAND.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const [hms, ampm] = time.split(/\s+/)
  return (
    <div className="flex flex-col items-start sm:items-end">
      <p className="flex items-baseline gap-1.5" aria-label={`Local time ${time}`}>
        <span className="text-4xl font-semibold tracking-tight text-white tabular sm:text-5xl">{hms}</span>
        {ampm && <span className="text-sm font-semibold text-ink-400 uppercase">{ampm}</span>}
      </p>
      <p className="mt-1 text-sm text-ink-400">
        {d.toLocaleDateString(BRAND.locale, { weekday: 'long', day: 'numeric', month: 'long' })}{city && ` · ${city}`}
      </p>
    </div>
  )
}

// ---------- dashboard ----------

export function HospitalDashboard({ user }: { user: User }) {
  const now = useNow(1000)
  const orders = useMyOrders()
  const hospital = user.hospitalId ? hospitalById(user.hospitalId) : undefined
  // A hospital sees stock and centres in its own city.
  const cityId = hospital?.cityId ?? user.cityId
  const centres = useCityCentres(cityId)
  const stock = useCityStock(cityId)

  const active = useMemo(() => orders.filter((o) => isActive(o, now)).sort((a, b) => etaMs(a, now) - etaMs(b, now)), [orders, now])

  const kpis = useMemo(() => {
    const monthStart = startOfMonth(now)
    const delivered = orders.flatMap((o) => {
      const at = deliveredAt(o, now)
      return at === null ? [] : [{ o, at }]
    })
    const unitsThisMonth = delivered.filter((d) => d.at >= monthStart).reduce((s, d) => s + unitsOf(d.o), 0)
    const avgMinutes = delivered.length ? delivered.reduce((s, d) => s + d.o.plan!.deliverAt, 0) / delivered.length / 60_000 : null
    const emergencies = delivered.filter((d) => d.o.priority === 'emergency')
    const onTarget = emergencies.filter((d) => d.o.plan!.deliverAt <= PRIORITIES.emergency.targetMinutes * 60_000).length
    let spend = 0
    let paidCount = 0
    for (const o of orders) {
      if (o.userId !== user.id || o.status === 'cancelled') continue
      const p = o.payments.find((x) => x.status === 'success')
      if (p && p.paidAt >= monthStart) {
        spend += p.amount
        paidCount++
      }
    }
    return { unitsThisMonth, avgMinutes, deliveredCount: delivered.length, emergencies: emergencies.length, onTarget, spend, paidCount }
  }, [orders, now, user.id])

  // The chart only needs refreshing every few seconds.
  const tick = Math.floor(now / 10_000)
  const perDay = useMemo(() => unitsPerDay(orders, Date.now(), 14), [orders, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  const fortnight = perDay.reduce((s, d) => s + d.total, 0)
  const monthName = new Date(now).toLocaleDateString(BRAND.locale, { month: 'long' })

  return (
    <div className="container-page flex flex-col gap-4 py-6 sm:gap-6 sm:py-10">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-4xl bg-ink-950 p-6 text-white sm:rounded-5xl sm:p-10"
      >
        <div className="absolute inset-0 -z-10 opacity-50 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] bg-size-[18px_18px]" aria-hidden />
        <div className="absolute -top-40 -right-20 -z-10 size-112 rounded-full bg-blood-600/35 blur-3xl" aria-hidden />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {user.verified ? (
                <DarkPill className="bg-emerald-400/15 text-emerald-300 ring-emerald-400/30">
                  <BadgeCheck className="size-3.5" /> Verified partner
                </DarkPill>
              ) : (
                <DarkPill className="bg-amber-400/15 text-amber-200 ring-amber-400/30">Verification pending</DarkPill>
              )}
              <DarkPill className="bg-white/10 text-ink-200 ring-white/10">
                <LiveDot className="size-2" color="bg-emerald-400" /> Desk online
              </DarkPill>
            </div>
            <h1 className="mt-4 text-3xl leading-[1.05] font-bold text-white sm:text-5xl">{hospital?.name ?? user.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-300">
              {hospital && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-ink-500" /> {hospital.area}, {cityById(hospital.cityId).name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 text-ink-500" /> Reg. no. {user.registrationNo ?? hospital?.registrationNo ?? '—'}
              </span>
              {hospital && <span className="text-ink-400">{hospital.beds} beds</span>}
            </p>
          </div>
          <LiveClock now={now} city={hospital ? cityById(hospital.cityId).name : undefined} />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
          <ButtonLink to={orderHref({ priority: 'emergency' })} size="lg" icon={<Siren className="size-4" />}>
            Emergency order
          </ButtonLink>
          <ButtonLink to="/order?priority=scheduled" size="lg" variant="white">
            Schedule for surgery
          </ButtonLink>
          <a
            href={`tel:${BRAND.supportPhone}`}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-ink-200 transition hover:bg-white/10 hover:text-white sm:ml-auto"
          >
            <Headset className="size-4" /> Hospital desk {BRAND.supportPhone}
          </a>
        </div>
      </motion.header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi index={0} icon={active.length ? <Radio className="size-4" /> : <Truck className="size-4" />} label="Active deliveries" accent={active.length > 0} sub={active.length ? 'Live on the map below' : 'Nothing on the way'}>
          <span className="flex items-center gap-3">
            <AnimatedNumber value={active.length} format={(n) => String(Math.round(n))} />
            {active.length > 0 && <LiveDot />}
          </span>
        </Kpi>
        <Kpi index={1} icon={<PackageCheck className="size-4" />} label={`Units received · ${monthName}`} sub={`${kpis.deliveredCount} deliveries handed over in all`}>
          <AnimatedNumber value={kpis.unitsThisMonth} format={(n) => String(Math.round(n))} />
        </Kpi>
        <Kpi
          index={2}
          icon={<Timer className="size-4" />}
          label="Avg door-to-desk"
          sub={
            kpis.avgMinutes === null
              ? 'Shown after your first delivery'
              : kpis.emergencies
                ? `${kpis.onTarget} of ${kpis.emergencies} emergencies within ${PRIORITIES.emergency.targetMinutes} min`
                : `Across ${kpis.deliveredCount} deliveries`
          }
        >
          {kpis.avgMinutes === null ? (
            <span className="text-ink-300">—</span>
          ) : (
            <>
              <AnimatedNumber value={kpis.avgMinutes} format={(n) => n.toFixed(1)} />
              <span className="ml-1 text-base font-medium text-ink-500">min</span>
            </>
          )}
        </Kpi>
        <Kpi index={3} icon={<IndianRupee className="size-4" />} label={`Spend · ${monthName}`} sub={kpis.paidCount ? `${kpis.paidCount} paid order${kpis.paidCount === 1 ? '' : 's'} · processing + logistics` : 'Processing charges + logistics only'}>
          <AnimatedNumber value={kpis.spend} format={formatINR} />
        </Kpi>
      </div>

      {/* Emergency + live */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <EmergencyPanel stock={stock} />
        </div>
        <div className="lg:col-span-7">
          <ActiveDeliveries orders={active} now={now} hospital={hospital} centres={centres} />
        </div>
      </div>

      {/* Chart + stock */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <section aria-labelledby="units-chart" className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6 lg:col-span-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="units-chart" className="font-sans text-lg font-semibold">
                Units received per day
              </h2>
              <p className="mt-1 text-sm text-ink-500">Last 14 days, by component family, counted at handover</p>
            </div>
            <p className="text-sm text-ink-500">
              <span className="text-2xl font-semibold text-ink-950">{fortnight}</span> units in 14 days
            </p>
          </div>
          <UnitsChart data={perDay} />
        </section>
        <div className="lg:col-span-4">
          <StockSnapshot stock={stock} centreCount={centres.length} />
        </div>
      </div>

      <OrderHistory orders={orders} now={now} ownUserId={user.id} />

      <p className="flex items-start justify-center gap-2 text-center text-xs text-ink-500">
        <Clock3 className="mt-0.5 size-3.5 shrink-0" />
        Door-to-desk time runs from payment confirmation to OTP handover. The {PRIORITIES.emergency.targetMinutes}-minute figure is an
        emergency dispatch target, not a guarantee.
      </p>
    </div>
  )
}
