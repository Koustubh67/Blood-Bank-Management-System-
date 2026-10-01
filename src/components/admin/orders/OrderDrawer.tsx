import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Bike, Building2, Check, FileText, MapPin, Smartphone } from 'lucide-react'
import type { OpsOrder, OpsStage } from '@/services/admin/types'
import { BloodGroupBadge } from '@/components/ui/BloodGroupPicker'
import { COMPONENTS } from '@/data/blood'
import { hospitalById } from '@/data/network'
import { useNow } from '@/hooks/useNow'
import { cn, formatDateTime, formatDistance, formatDuration, formatINR, formatTime } from '@/lib/utils'
import { useStaff } from '@/services/admin/hooks'
import { STAGE_LABEL, priorityScore, scoreParts, sla } from '@/services/admin/priority'
import { shortStoreName, storeById, STORE_KIND_LABEL } from '@/services/admin/stores'
import { METHOD_LABEL } from '@/services/admin/collections'
import { maskPhone } from '@/services/admin/names'
import { Sheet } from '../Sheet'
import { Kv, PriorityPill, SlaRing, StageBadge, Tag } from '../ui'
import { OrderMenu, PrimaryButton } from './OrderActions'
import { closeOrder, useOrderById, useOrderUi } from './state'

const FLOW: OpsStage[] = ['incoming', 'verifying', 'packing', 'ready', 'out_for_delivery', 'delivered']

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Timeline({ order }: { order: OpsOrder }) {
  const end = order.stage === 'rejected' || order.stage === 'cancelled' ? order.stage : null
  const steps = end ? [...FLOW.filter((s) => order.stageAt[s]), end] : FLOW
  return (
    <ol className="relative flex flex-col gap-0.5">
      {steps.map((s, i) => {
        const at = order.stageAt[s]
        const current = order.stage === s
        const isLast = i === steps.length - 1
        return (
          <li key={s} className="relative flex gap-3 pb-3">
            {!isLast && <span className={cn('absolute top-6 left-[11px] h-[calc(100%-1rem)] w-0.5', at ? 'bg-ink-300' : 'bg-ink-100')} aria-hidden />}
            <span
              className={cn(
                'relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ring-4 ring-paper',
                current && s !== 'delivered' ? 'bg-ink-950 text-white' : at ? 'bg-ink-200 text-ink-700' : 'bg-white text-ink-300 ring-ink-100',
                s === 'delivered' && at && 'bg-emerald-600 text-white',
                end === s && 'bg-blood-600 text-white',
              )}
              aria-hidden
            >
              {at && !current ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', at ? 'text-ink-950' : 'text-ink-400')}>{STAGE_LABEL[s]}</p>
              <p className="text-xs text-ink-500">{at ? formatTime(at) : 'Not yet'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Full detail for one order: items, route, requisition, payment, score breakdown, timeline and audit log. */
export function OrderDrawer() {
  const id = useOrderUi((s) => s.detailId)
  const now = useNow(1000)
  const order = useOrderById(id, now)
  const staff = useStaff()
  const open = !!id && !!order

  return (
    <Sheet
      open={open}
      onClose={closeOrder}
      title={order ? (hospitalById(order.hospitalId)?.name ?? order.id) : ''}
      subtitle={order ? <span className="font-mono">{order.id}</span> : undefined}
      header={
        order && (
          <div className="flex flex-wrap items-center gap-2">
            <PriorityPill priority={order.priority} />
            <StageBadge stage={order.stage} />
            {order.source === 'app' && (
              <Tag className="bg-ice-50 text-ice-700">
                <Smartphone className="size-3" aria-hidden /> Placed in app
              </Tag>
            )}
            <span className="ml-auto text-xs text-ink-500">
              Score <span className="font-semibold text-ink-950 tabular">{priorityScore(order, now)}</span>
            </span>
          </div>
        )
      }
      footer={
        order &&
        (order.source === 'app' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-ink-500">Read-only: the customer&rsquo;s tracking timeline drives this order.</p>
            <Link to={`/track/${order.id}`} className="shrink-0 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50">
              Open tracking
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <PrimaryButton order={order} size="md" className="flex-1" />
            <OrderMenu order={order} />
          </div>
        ))
      }
    >
      {order && <DrawerBody order={order} now={now} riderLabel={staff.find((s) => s.id === order.riderId)} />}
    </Sheet>
  )
}

function DrawerBody({ order, now, riderLabel }: { order: OpsOrder; now: number; riderLabel?: { name: string; phone: string; vehicleReg?: string } }) {
  const store = storeById(order.storeId)
  const hospital = hospitalById(order.hospitalId)
  const s = sla(order, now)
  const parts = scoreParts(order, now)
  const riderName = order.riderName ?? riderLabel?.name
  return (
    <>
      <div className="flex items-center gap-4 rounded-3xl border border-ink-100 bg-white p-4">
        <SlaRing order={order} now={now} size={52} />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink-950">
            {s.state === 'met' ? 'Dispatched within target' : s.state === 'missed' ? 'Dispatched late' : s.state === 'breached' ? 'Dispatch target missed' : s.state === 'closed' ? 'Closed' : `${formatDuration(s.leftMs)} left to dispatch`}
          </p>
          <p className="text-xs text-ink-500">
            Target {Math.round(s.targetMs / 60_000)} min from order · placed {formatDateTime(order.createdAt)}
          </p>
        </div>
      </div>

      <Section title="Units">
        <ul className="flex flex-col gap-2">
          {order.items.map((i, n) => (
            <li key={n} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 ring-1 ring-ink-100">
              <BloodGroupBadge group={i.group} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink-900">{COMPONENTS[i.component].name}</span>
                <span className="block text-xs text-ink-500">{COMPONENTS[i.component].tempRange} · {COMPONENTS[i.component].shelfLife.toLowerCase()}</span>
              </span>
              <span className="text-sm font-semibold tabular">× {i.units}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Route">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-ink-100">
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-blood-600" aria-hidden />
            <span>
              <span className="font-medium text-ink-950">{store?.name}</span>
              <span className="block text-xs text-ink-500">{store ? `${STORE_KIND_LABEL[store.kind]} · ${store.area}` : ''}</span>
            </span>
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm">
            <Building2 className="mt-0.5 size-4 shrink-0 text-ice-600" aria-hidden />
            <span>
              <span className="font-medium text-ink-950">{hospital?.name}</span>
              <span className="block text-xs text-ink-500">{hospital?.area} · {formatDistance(order.distanceM)} by road · about {order.rideMin} min</span>
            </span>
          </p>
          {riderName && (
            <p className="mt-2 flex items-start gap-2 border-t border-ink-100 pt-2 text-sm">
              <Bike className="mt-0.5 size-4 shrink-0 text-ink-500" aria-hidden />
              <span>
                <span className="font-medium text-ink-950">{riderName}</span>
                {order.borrowed && <Tag className="ml-2 bg-amber-50 text-amber-800">Borrowed</Tag>}
                {riderLabel && (
                  <span className="block text-xs text-ink-500">
                    {maskPhone(riderLabel.phone)} · {riderLabel.vehicleReg}
                  </span>
                )}
              </span>
            </p>
          )}
        </div>
      </Section>

      <Section title="Patient & requisition">
        <dl className="divide-y divide-ink-100 rounded-2xl bg-white px-3 ring-1 ring-ink-100">
          <Kv k="Patient">{order.patient}</Kv>
          {order.ward && <Kv k="Ward">{order.ward}</Kv>}
          <Kv k="Doctor">{order.doctor}</Kv>
          <Kv k="Reg. no.">{order.doctorReg}</Kv>
          <Kv k="Requisition">
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5 text-ink-400" aria-hidden /> {order.requisition}
            </span>
          </Kv>
        </dl>
      </Section>

      <Section title="Payment">
        <dl className="divide-y divide-ink-100 rounded-2xl bg-white px-3 ring-1 ring-ink-100">
          <Kv k="Method">{METHOD_LABEL[order.method]}</Kv>
          <Kv k="Processing charges">{formatINR(order.price.processing)}</Kv>
          <Kv k="Logistics + GST">{formatINR(order.price.logistics + order.price.logisticsGst)}</Kv>
          <Kv k="Total">{formatINR(order.price.total)}</Kv>
          {order.refund ? <Kv k="Refund">{formatINR(order.refund)}</Kv> : null}
        </dl>
      </Section>

      <Section title="Priority score">
        <ul className="rounded-2xl bg-white px-3 py-1 ring-1 ring-ink-100">
          {parts.map((p) => (
            <li key={p.label} className="flex items-center justify-between gap-3 border-b border-ink-100 py-1.5 text-sm last:border-0">
              <span className="text-ink-600">{p.label}</span>
              <span className="font-semibold tabular">+{p.points}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Timeline">
        <Timeline order={order} />
      </Section>

      <Section title="Audit log">
        <ol className="flex flex-col gap-2">
          {[...order.audit].reverse().map((e, i) => (
            <li key={i} className="rounded-2xl bg-white px-3 py-2 text-sm ring-1 ring-ink-100">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium text-ink-950">{e.action}</span>
                <span className="text-xs text-ink-500 tabular">{formatTime(e.at)}</span>
              </p>
              <p className="text-xs text-ink-500">
                {e.actor}
                {e.detail && <> · {e.detail}</>}
              </p>
            </li>
          ))}
        </ol>
      </Section>
      <p className="mt-6 text-center text-xs text-ink-400">{shortStoreName(store)} · simulated operations data</p>
    </>
  )
}
