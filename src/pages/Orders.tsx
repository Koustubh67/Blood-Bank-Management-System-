import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CreditCard, PackageOpen, Plus } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'
import { ACTIVE_STATUSES, liveStatus, useMyOrders } from '@/services/orders'
import { useCurrentUser } from '@/services/auth'
import { hospitalById } from '@/data/network'
import { useNow } from '@/hooks/useNow'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, LiveDot, PageHeader } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/disclosure'
import { OrderListCard } from '@/components/tracking/OrderCards'

type Filter = 'active' | 'completed' | 'all'

function matches(filter: Filter, status: OrderStatus) {
  if (filter === 'active') return ACTIVE_STATUSES.includes(status)
  if (filter === 'completed') return status === 'delivered'
  return true
}

const EMPTY: Record<Filter, { title: string; description: string }> = {
  active: { title: 'No deliveries in progress', description: 'Paid orders show up here with a live countdown until handover.' },
  completed: { title: 'No completed deliveries yet', description: 'Orders move here once the sealed box is handed over at the hospital.' },
  all: { title: 'No orders yet', description: 'Blood you order for a patient at a partner hospital will be listed here.' },
}

export default function Orders() {
  const orders = useMyOrders()
  const user = useCurrentUser()
  const now = useNow(1000)

  const rows = useMemo(
    () => orders.map((order) => ({ order, status: liveStatus(order, now) })).sort((a, b) => b.order.createdAt - a.order.createdAt),
    [orders, now],
  )
  const counts = useMemo(() => {
    const c = { active: 0, completed: 0, all: rows.length, unpaid: 0, units: 0 }
    for (const r of rows) {
      if (ACTIVE_STATUSES.includes(r.status)) c.active++
      if (r.status === 'delivered') {
        c.completed++
        c.units += r.order.items.reduce((s, i) => s + i.units, 0)
      }
      if (r.status === 'pending_payment' || r.status === 'payment_failed') c.unpaid++
    }
    return c
  }, [rows])

  const [filter, setFilter] = useState<Filter>(() => (counts.active > 0 ? 'active' : 'all'))
  const shown = useMemo(() => rows.filter((r) => matches(filter, r.status)).map((r) => r.order), [rows, filter])

  const hospital = user?.role === 'hospital' && user.hospitalId ? hospitalById(user.hospitalId) : undefined

  return (
    <>
      <PageHeader
        eyebrow={hospital ? 'Hospital orders' : 'My orders'}
        title={hospital ? 'Orders for your blood desk' : 'Your orders'}
        description={
          hospital
            ? `Every RaktFlow order delivered to ${hospital.name}, whoever placed it.`
            : 'Track live deliveries, finish pending payments and download receipts.'
        }
      >
        {rows.length > 0 && (
          <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            <Stat label="In progress" value={counts.active} live={counts.active > 0} />
            <Stat label="Delivered" value={counts.completed} />
            <Stat label="Units received" value={counts.units} />
          </dl>
        )}
      </PageHeader>

      <section className="container-page py-10 sm:py-12">
        {rows.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="size-6" />}
            title="No orders yet"
            description="When a doctor requests blood for a patient at a partner hospital, you can order it here and track it to the transfusion desk."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink to="/order" icon={<Plus className="size-4" aria-hidden />}>
                  Order blood
                </ButtonLink>
                <ButtonLink to="/availability" variant="outline">
                  Check live stock
                </ButtonLink>
              </div>
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative -mx-4 overflow-x-auto px-4 py-1 no-scrollbar sm:mx-0 sm:px-0">
                <Tabs<Filter>
                  value={filter}
                  onChange={setFilter}
                  tabs={[
                    { value: 'active', label: <TabLabel label="Active" count={counts.active} /> },
                    { value: 'completed', label: <TabLabel label="Completed" count={counts.completed} /> },
                    { value: 'all', label: <TabLabel label="All" count={counts.all} /> },
                  ]}
                />
              </div>
              <ButtonLink to="/order" variant="dark" size="md" icon={<Plus className="size-4" aria-hidden />} className="self-start sm:self-auto">
                New order
              </ButtonLink>
            </div>

            {counts.unpaid > 0 && filter !== 'all' && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setFilter('all')}
                className="group mt-6 flex w-full items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left text-sm text-amber-900 transition hover:border-amber-200"
              >
                <CreditCard className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">
                  <span className="font-semibold">
                    {counts.unpaid} order{counts.unpaid > 1 ? 's are' : ' is'} waiting for payment.
                  </span>{' '}
                  Units are dispatched only after payment is confirmed.
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
                  Show <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </motion.button>
            )}

            <ul className="mt-6 flex flex-col gap-4" aria-live="off">
              <AnimatePresence mode="popLayout" initial={false}>
                {shown.map((order: Order) => (
                  <motion.li
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  >
                    <OrderListCard order={order} now={now} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {shown.length === 0 && (
              <EmptyState
                title={EMPTY[filter].title}
                description={EMPTY[filter].description}
                action={
                  filter === 'active' ? (
                    <ButtonLink to="/order" icon={<Plus className="size-4" aria-hidden />}>
                      Order blood
                    </ButtonLink>
                  ) : (
                    <ButtonLink to="/order" variant="outline">
                      Order blood
                    </ButtonLink>
                  )
                }
              />
            )}
          </>
        )}
      </section>
    </>
  )
}

function TabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {label}
      <span className="rounded-full bg-current/15 px-1.5 text-[11px] tabular">{count}</span>
    </span>
  )
}

function Stat({ label, value, live }: { label: string; value: number; live?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-2xl border border-ink-100 bg-paper p-3 sm:p-4">
      <dt className="flex items-center gap-1.5 text-xs leading-tight text-ink-500">
        {live && <LiveDot className="size-2" />}
        {label}
      </dt>
      <dd className="font-display text-2xl font-bold text-ink-950 tabular sm:text-3xl">{value}</dd>
    </div>
  )
}
