import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Bike, Droplet, IndianRupee, Radio, Siren, Timer } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { useCentres } from '@/services/inventory'
import { useCurrentUser } from '@/services/auth'
import { BRAND } from '@/config/brand'
import { formatINR } from '@/lib/utils'
import { cityShortages, COMMON_GROUPS, lowGroups, storeInventory, useBoardOrders, useCollectionRows, useLoad, useRiderViews, useScope, useScopedStaff } from '@/services/admin/hooks'
import { useOps } from '@/services/admin/store'
import { byScore, isActive, isPreDispatch, PRIORITY_ORDER, sla, SLA_MIN } from '@/services/admin/priority'
import { scopeLabel, storesIn } from '@/services/admin/stores'
import { sumRows } from '@/services/admin/collections'
import { startOfDay } from '@/services/admin/time'
import { LiveDot } from '@/components/ui/primitives'
import { Page, PageHead, Panel, PRIORITY_STYLE, StatTile } from '@/components/admin/ui'
import { LoadMeter } from '@/components/admin/LoadMeter'
import { AttentionList, useAttention } from '@/components/admin/overview/Attention'
import { ActivityLog } from '@/components/admin/overview/ActivityLog'
import { NextUp } from '@/components/admin/overview/NextUp'
import { RushButton } from '@/components/admin/RushButton'
import { cn } from '@/lib/utils'

function greeting(now: number) {
  const h = new Date(now).getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const now = useNow(1000)
  const user = useCurrentUser()
  const scope = useScope()
  const orders = useBoardOrders(now)
  const views = useRiderViews(now)
  const load = useLoad(now)
  const staff = useScopedStaff()
  const centres = useCentres()
  const excursions = useOps((s) => s.excursions)
  const stores = useMemo(() => storesIn(scope), [scope])
  const today = useCollectionRows(1, now)

  const kpi = useMemo(() => {
    const live = orders.filter(isActive)
    const byPriority = Object.fromEntries(PRIORITY_ORDER.map((p) => [p, live.filter((o) => o.priority === p).length]))
    const dayStart = startOfDay(now)
    const dispatched = orders.filter((o) => (o.stageAt.out_for_delivery ?? 0) >= dayStart)
    const avgMin = dispatched.length ? dispatched.reduce((s, o) => s + (o.stageAt.out_for_delivery! - o.createdAt), 0) / dispatched.length / 60_000 : null
    const onTarget = dispatched.filter((o) => sla(o, now).state === 'met').length
    const pre = orders.filter(isPreDispatch).map((o) => sla(o, now).state)
    const risk = pre.filter((s) => s === 'risk' || s === 'breached').length
    const breached = pre.filter((s) => s === 'breached').length
    const free = views.filter((v) => v.state === 'available').length
    const busy = views.filter((v) => v.state === 'to_pickup' || v.state === 'on_the_way' || v.state === 'returning').length
    const off = views.filter((v) => v.state === 'off_shift' || v.state === 'leave').length
    return { live: live.length, byPriority, avgMin, dispatched: dispatched.length, onTarget, risk, breached, free, busy, off }
  }, [orders, views, now])

  const minute = Math.floor(now / 60_000)
  const stock = useMemo(() => {
    const shortages = cityShortages(scope, centres)
    const storesOut = stores.filter((s) => lowGroups(storeInventory(s, centres)).some((g) => g.level === 'out' && COMMON_GROUPS.includes(g.group))).length
    return { shortages, storesOut }
  }, [scope, stores, centres, minute]) // eslint-disable-line react-hooks/exhaustive-deps

  const money = useMemo(() => sumRows(today), [today])
  const attention = useAttention({ orders, stores, centres, excursions, staff, load, now })
  const next = useMemo(() => orders.filter(isPreDispatch).sort(byScore(now)).slice(0, 5), [orders, now])

  return (
    <Page title="Overview">
      <PageHead
        eyebrow={
          <>
            <LiveDot className="size-2" /> Live · {scopeLabel(scope)}
          </>
        }
        title={`${greeting(now)}, ${user?.name.split(' ')[0] ?? 'team'}`}
        description={`${new Date(now).toLocaleDateString(BRAND.locale, { weekday: 'long', day: 'numeric', month: 'long' })} · ${stores.length} stores, ${views.length} riders on the register. Everything below updates live.`}
        actions={
          <>
            <RushButton scope={scope} />
            <Link to="/admin/orders" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-950 px-5 text-sm font-semibold text-white hover:bg-ink-800">
              Priority board <ArrowRight className="size-4" aria-hidden />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
        <StatTile
          label="Live orders"
          icon={<Radio className="size-4" />}
          tone={kpi.byPriority.emergency ? 'red' : 'ink'}
          value={kpi.live}
          sub={
            <span className="flex flex-wrap gap-x-2.5 gap-y-1">
              {PRIORITY_ORDER.map((p) => (
                <span key={p} className="inline-flex items-center gap-1">
                  <span className={cn('size-1.5 rounded-full', PRIORITY_STYLE[p].dot)} aria-hidden />
                  <span className="tabular">{kpi.byPriority[p]}</span> {p}
                </span>
              ))}
            </span>
          }
        />
        <StatTile
          label="Avg order → dispatch"
          icon={<Timer className="size-4" />}
          value={kpi.avgMin === null ? '—' : <>{kpi.avgMin.toFixed(1)}<span className="ml-1 text-sm font-medium text-ink-500">min</span></>}
          sub={kpi.dispatched ? `${kpi.onTarget} of ${kpi.dispatched} dispatched today within target` : 'No dispatches yet today'}
        />
        <StatTile
          label="SLA at risk"
          icon={<Siren className="size-4" />}
          tone={kpi.breached ? 'red' : kpi.risk ? 'amber' : 'green'}
          value={kpi.risk}
          sub={kpi.breached ? `${kpi.breached} past target · emergency ≤ ${SLA_MIN.emergency} min` : `Targets: ${SLA_MIN.emergency} / ${SLA_MIN.urgent} / ${SLA_MIN.scheduled} min`}
        />
        <StatTile
          label="Riders"
          icon={<Bike className="size-4" />}
          tone={load.level === 'surge' ? 'red' : load.level === 'busy' ? 'amber' : 'ink'}
          value={<>{kpi.free}<span className="ml-1 text-sm font-medium text-ink-500">free</span></>}
          sub={`${kpi.busy} busy · ${kpi.off} off shift or on leave`}
        />
        <StatTile
          label="Collections today"
          icon={<IndianRupee className="size-4" />}
          value={formatINR(money.total)}
          sub={`${money.orders} orders${money.refunds ? ` · ${formatINR(money.refunds)} refunded` : ''}`}
        />
        <StatTile
          label="Stock alerts"
          icon={<Droplet className="size-4" />}
          tone={stock.shortages.some((s) => s.level === 'out') ? 'red' : stock.shortages.length || stock.storesOut ? 'amber' : 'green'}
          value={stock.shortages.length + stock.storesOut}
          sub={
            stock.shortages.length || stock.storesOut
              ? [
                  stock.shortages.length ? `${[...new Set(stock.shortages.map((s) => s.group.replace('-', '−')))].slice(0, 4).join(', ')} short city-wide` : '',
                  stock.storesOut ? `${stock.storesOut} store${stock.storesOut === 1 ? '' : 's'} with a common group at 0` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Every group in stock'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <AttentionList items={attention} className="lg:col-span-7 xl:col-span-8" />
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-5 xl:col-span-4">
          <LoadMeter load={load} scope={scope} />
          <Panel title="Next up" description="Highest priority score first" bodyClassName="p-2 sm:p-3" actions={<Link to="/admin/orders" className="text-xs font-semibold text-blood-700 hover:underline">Board</Link>}>
            <NextUp orders={next} now={now} />
          </Panel>
        </div>
      </div>

      <ActivityLog now={now} />
    </Page>
  )
}
