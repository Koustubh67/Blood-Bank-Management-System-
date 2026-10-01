import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Bike, CircleCheck, Droplet, IdCard, ShieldCheck, Siren, ThermometerSun, type LucideIcon } from 'lucide-react'
import type { BloodCentre } from '@/types'
import type { FridgeExcursion, OpsOrder, StaffMember } from '@/services/admin/types'
import type { LoadInfo } from '@/services/admin/dispatch'
import { cityShortages, COMMON_GROUPS, fridgeOk, fridgeTemp, lowGroups, outletFor, storeInventory, useScope } from '@/services/admin/hooks'
import { cityById } from '@/data/cities'
import { isPreDispatch, sla } from '@/services/admin/priority'
import { hospitalName } from '@/services/admin/store'
import { shortStoreName, storeById } from '@/services/admin/stores'
import { daysUntil } from '@/services/admin/time'
import type { OpsStore } from '@/services/admin/types'
import { cn, formatDuration } from '@/lib/utils'
import { Panel } from '../ui'
import { openOrder } from '../orders/state'

interface Item {
  id: string
  severity: 'critical' | 'warning'
  icon: LucideIcon
  title: ReactNode
  detail: ReactNode
  action: { label: string; run: () => void }
}

/**
 * Everything that needs a person, worst first: orders past or near their
 * dispatch target, fridges outside 2–6 °C, red cells out of stock, riders
 * short of cover, and licences or training about to lapse.
 */
export function useAttention({
  orders,
  stores,
  centres,
  excursions,
  staff,
  load,
  now,
}: {
  orders: OpsOrder[]
  stores: OpsStore[]
  centres: BloodCentre[]
  excursions: Record<string, FridgeExcursion>
  staff: StaffMember[]
  load: LoadInfo
  now: number
}) {
  const navigate = useNavigate()
  const scope = useScope()
  const minute = Math.floor(now / 60_000)
  // Stock and licences move slowly; refresh them once a minute rather than every tick.
  const slow = useMemo(() => {
    const out: Item[] = []
    for (const sh of cityShortages(scope, centres).slice(0, 3)) {
      out.push({
        id: `short-${sh.cityId}-${sh.group}`,
        severity: sh.level === 'out' ? 'critical' : 'warning',
        icon: Droplet,
        title: `${sh.group.replace('-', '−')} red cells ${sh.level === 'out' ? 'out' : 'low'} across ${cityById(sh.cityId).name}`,
        detail: `${sh.units} unit${sh.units === 1 ? '' : 's'} in ${sh.centres} centres · call registered ${sh.group.replace('-', '−')} donors or request a transfer`,
        action: { label: 'Stores', run: () => navigate('/admin/stores?sort=low') },
      })
    }
    const commonOut = stores
      .map((s) => ({ s, groups: lowGroups(storeInventory(s, centres)).filter((g) => g.level === 'out' && COMMON_GROUPS.includes(g.group)) }))
      .filter((x) => x.groups.length > 0)
    for (const { s, groups } of commonOut.slice(0, 3)) {
      out.push({
        id: `stock-${s.id}`,
        severity: 'warning',
        icon: Droplet,
        title: `${shortStoreName(s)}: ${groups.map((g) => g.group).join(', ')} red cells out`,
        detail: s.kind === 'outlet' ? 'Restock from the mother centre on the next cold-chain run' : 'Common group at 0 on the shelf · request a transfer',
        action: { label: 'View store', run: () => navigate(`/admin/stores?store=${s.id}`) },
      })
    }
    if (commonOut.length > 3) {
      out.push({
        id: 'stock-more',
        severity: 'warning',
        icon: Droplet,
        title: `${commonOut.length - 3} more stores with a common group at 0`,
        detail: 'Sorted on the Stores page by low stock',
        action: { label: 'All stores', run: () => navigate('/admin/stores?sort=low') },
      })
    }
    const riders = staff.filter((m) => m.role === 'rider' && m.status !== 'inactive' && m.licenceExpiry)
    const lapsed = riders.filter((m) => daysUntil(m.licenceExpiry!, now) < 0)
    const soon = riders.filter((m) => {
      const d = daysUntil(m.licenceExpiry!, now)
      return d >= 0 && d <= 30
    })
    for (const m of lapsed.slice(0, 2)) {
      out.push({
        id: `lic-${m.id}`,
        severity: 'critical',
        icon: IdCard,
        title: `${m.name}'s driving licence has expired`,
        detail: `${shortStoreName(storeById(m.storeId))} · expired ${Math.abs(daysUntil(m.licenceExpiry!, now))} days ago · take off dispatch until renewed`,
        action: { label: 'Edit record', run: () => navigate(`/admin/staff?edit=${m.id}`) },
      })
    }
    if (soon.length) {
      out.push({
        id: 'lic-soon',
        severity: 'warning',
        icon: IdCard,
        title: `${soon.length} rider licence${soon.length === 1 ? '' : 's'} expire within 30 days`,
        detail: soon
          .slice(0, 3)
          .map((m) => `${m.name} (${daysUntil(m.licenceExpiry!, now)} d)`)
          .join(', ') + (soon.length > 3 ? '…' : ''),
        action: { label: 'Review', run: () => navigate('/admin/staff?flag=expiring') },
      })
    }
    const refresher = staff.filter((m) => m.status !== 'inactive' && daysUntil(m.trainedOn, now) <= -335)
    if (refresher.length) {
      out.push({
        id: 'training',
        severity: 'warning',
        icon: ShieldCheck,
        title: `${refresher.length} cold-chain training refresher${refresher.length === 1 ? '' : 's'} due`,
        detail: 'Yearly refresher for anyone who packs or carries blood boxes',
        action: { label: 'Review', run: () => navigate('/admin/staff?flag=expiring') },
      })
    }
    return out
  }, [scope, stores, centres, staff, minute, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(() => {
    const items: Item[] = []
    const late = orders
      .filter(isPreDispatch)
      .map((o) => ({ o, s: sla(o, now) }))
      .filter((x) => x.s.state === 'breached' || x.s.state === 'risk')
      .sort((a, b) => a.s.leftMs - b.s.leftMs)
    for (const { o, s } of late.slice(0, 4)) {
      items.push({
        id: `sla-${o.id}`,
        severity: s.state === 'breached' ? 'critical' : 'warning',
        icon: Siren,
        title: s.state === 'breached' ? `${o.id} is ${formatDuration(-s.leftMs)} past its dispatch target` : `${o.id} has ${formatDuration(s.leftMs)} left to dispatch`,
        detail: `${o.priority === 'emergency' ? 'Emergency' : o.priority === 'urgent' ? 'Urgent' : 'Scheduled'} · ${hospitalName(o)} · ${o.stage === 'ready' && !o.riderId ? 'waiting for a rider' : `at ${o.stage.replace(/_/g, ' ')}`}`,
        action: { label: 'Open', run: () => openOrder(o.id) },
      })
    }
    if (late.length > 4) {
      items.push({
        id: 'sla-more',
        severity: 'warning',
        icon: Siren,
        title: `${late.length - 4} more orders close to their target`,
        detail: 'Sorted by score on the priority board',
        action: { label: 'Board', run: () => navigate('/admin/orders') },
      })
    }
    for (const s of stores) {
      const outlet = outletFor(s)
      if (!outlet) continue
      const centre = centres.find((c) => c.id === outlet.motherCentreId)
      const t = fridgeTemp(outlet, centre, now, excursions[s.id]).tempC
      const rising = excursions[s.id] && t >= 5.2
      if (fridgeOk(t) && !rising) continue
      items.push({
        id: `fridge-${s.id}`,
        severity: fridgeOk(t) ? 'warning' : 'critical',
        icon: ThermometerSun,
        title: `${shortStoreName(s)} fridge at ${t.toFixed(1)} °C`,
        detail: fridgeOk(t) ? 'Rising after a door-open alarm · blood must stay at 2–6 °C' : 'Outside 2–6 °C · quarantine units until the logger is back in range',
        action: { label: 'View store', run: () => navigate(`/admin/stores?store=${s.id}`) },
      })
    }
    if (load.waiting > 0) {
      items.push({
        id: 'riders',
        severity: load.level === 'surge' ? 'critical' : 'warning',
        icon: Bike,
        title: `${load.waiting} order${load.waiting === 1 ? '' : 's'} with no free rider at ${load.waiting === 1 ? 'its' : 'their'} store`,
        detail: `${load.demand} orders need riders, ${load.available} riders free in this view`,
        action: { label: 'Dispatch', run: () => navigate('/admin/dispatch') },
      })
    }
    items.push(...slow)
    return items.sort((a, b) => Number(b.severity === 'critical') - Number(a.severity === 'critical'))
  }, [orders, stores, centres, excursions, load, now, slow, navigate])
}

export function AttentionList({ items, className }: { items: Item[]; className?: string }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, 7)
  const critical = items.filter((i) => i.severity === 'critical').length
  return (
    <Panel
      title="Needs attention"
      description={items.length ? `${items.length} item${items.length === 1 ? '' : 's'}${critical ? ` · ${critical} critical` : ''}` : 'All clear'}
      className={className}
      bodyClassName="p-2 sm:p-3"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <CircleCheck className="size-8 text-emerald-500" aria-hidden />
          <p className="mt-2 font-semibold text-ink-900">Nothing needs you right now</p>
          <p className="text-sm text-ink-500">Orders are inside their targets and fridges are in range.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((it) => (
            <li key={it.id} className="flex items-start gap-3 rounded-2xl px-2 py-2.5 hover:bg-ink-50/70 sm:px-3">
              <span
                className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl', it.severity === 'critical' ? 'bg-blood-600 text-white' : 'bg-amber-50 text-amber-700')}
                aria-hidden
              >
                <it.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-950">
                  <span className="sr-only">{it.severity === 'critical' ? 'Critical: ' : 'Warning: '}</span>
                  {it.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">{it.detail}</p>
              </div>
              <button type="button" onClick={it.action.run} className="shrink-0 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 hover:border-ink-300 hover:bg-ink-50">
                {it.action.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 7 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 w-full rounded-full py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50">
          {all ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
    </Panel>
  )
}
