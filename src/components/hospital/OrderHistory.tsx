import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ChevronDown, CreditCard, FileClock } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/primitives'
import { PRIORITIES } from '@/data/blood'
import { liveStatus } from '@/services/orders'
import { cn, formatDateTime, formatINR } from '@/lib/utils'
import { itemsSummary } from './metrics'

const PAGE = 8

function actionFor(o: Order, status: OrderStatus, ownUserId: string) {
  if ((status === 'pending_payment' || status === 'payment_failed') && o.userId === ownUserId)
    return { to: `/checkout/${o.id}`, label: 'Pay', icon: CreditCard }
  return { to: `/track/${o.id}`, label: status === 'delivered' || status === 'cancelled' ? 'Details' : 'Track', icon: ArrowUpRight }
}

const PRIORITY_TONE = { emergency: 'red', urgent: 'amber', scheduled: 'neutral' } as const

export function OrderHistory({ orders, now, ownUserId }: { orders: Order[]; now: number; ownUserId: string }) {
  const [expanded, setExpanded] = useState(false)
  const sorted = useMemo(() => [...orders].sort((a, b) => b.createdAt - a.createdAt), [orders])
  const shown = expanded ? sorted : sorted.slice(0, PAGE)

  return (
    <section aria-labelledby="order-history" className="rounded-4xl border border-ink-100 bg-white shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 id="order-history" className="font-sans text-lg font-semibold">
            Order history
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Every order delivered to your facility, including those placed by patient families.
          </p>
        </div>
        <span className="text-sm text-ink-500 tabular">{orders.length} total</span>
      </div>

      {sorted.length === 0 ? (
        <div className="mx-5 mb-6 flex flex-col items-center gap-2 rounded-3xl border border-dashed border-ink-200 px-5 py-10 text-center sm:mx-6">
          <FileClock className="size-6 text-ink-400" />
          <p className="font-semibold text-ink-800">No orders yet</p>
          <p className="max-w-sm text-sm text-ink-500">Your requests, invoices and delivery records will be listed here for audits.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="relative hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-ink-100 bg-ink-50/70 text-left text-xs font-semibold text-ink-500">
                  <th scope="col" className="py-3 pr-3 pl-6">
                    Order
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Patient
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Units
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Amount
                  </th>
                  <th scope="col" className="py-3 pr-6 pl-3">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {shown.map((o) => {
                  const status = liveStatus(o, now)
                  const act = actionFor(o, status, ownUserId)
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-paper">
                      <td className="py-3.5 pr-3 pl-6 align-top">
                        <p className="font-mono text-xs font-semibold text-ink-900">{o.id}</p>
                        <p className="mt-0.5 text-xs text-ink-500">{formatDateTime(o.createdAt)}</p>
                      </td>
                      <td className="max-w-48 px-3 py-3.5 align-top">
                        <p className="truncate font-medium text-ink-900">{o.patient.name}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-500">
                          {[o.patient.ward, o.userId === ownUserId ? 'Placed by your team' : 'Placed by family'].filter(Boolean).join(' · ')}
                        </p>
                      </td>
                      <td className="max-w-64 px-3 py-3.5 align-top">
                        <p className="text-ink-800">{itemsSummary(o)}</p>
                        <Badge tone={PRIORITY_TONE[o.priority]} className="mt-1.5 px-2 py-0.5 text-[11px]">
                          {PRIORITIES[o.priority].label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5 align-top">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-3 py-3.5 text-right align-top font-semibold text-ink-900 tabular">{formatINR(o.price.total)}</td>
                      <td className="py-3.5 pr-6 pl-3 text-right align-top">
                        <Link
                          to={act.to}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-ink-100 hover:text-ink-950"
                          aria-label={`${act.label} order ${o.id}`}
                        >
                          {act.label} <act.icon className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2.5 px-3 pb-3 md:hidden">
            {shown.map((o) => {
              const status = liveStatus(o, now)
              const act = actionFor(o, status, ownUserId)
              return (
                <li key={o.id}>
                  <Link to={act.to} className="block rounded-3xl border border-ink-100 bg-paper p-4 transition active:scale-[0.99]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-ink-900">{o.id}</span>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-2.5 font-semibold text-ink-950">{itemsSummary(o)}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-500">
                      {o.patient.name}
                      {o.patient.ward ? ` · ${o.patient.ward}` : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                      <span>
                        {formatDateTime(o.createdAt)} · {PRIORITIES[o.priority].label}
                      </span>
                      <span className="font-semibold text-ink-900 tabular">{formatINR(o.price.total)}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {sorted.length > PAGE && (
            <div className="border-t border-ink-100 p-3 text-center">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50 hover:text-ink-950"
              >
                {expanded ? 'Show fewer' : `Show all ${sorted.length}`}
                <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
