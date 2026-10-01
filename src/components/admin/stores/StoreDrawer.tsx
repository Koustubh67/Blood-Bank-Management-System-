import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Thermometer } from 'lucide-react'
import type { Inventory } from '@/types'
import { BLOOD_GROUPS, COMPONENTS, COMPONENT_CODES } from '@/data/blood'
import { cityById } from '@/data/cities'
import { stockLevel, useCentres } from '@/services/inventory'
import { LEVEL } from '@/components/stock/levels'
import { cn, formatINR, formatTime } from '@/lib/utils'
import { useNow } from '@/hooks/useNow'
import { FRIDGE_MAX_C, FRIDGE_MIN_C, fridgeOk, fridgeTemp, inventoryTotal, outletFor, storeInventory, useBoardOrders, useCollectionRows, useScopedStaff } from '@/services/admin/hooks'
import { useOps, hospitalName } from '@/services/admin/store'
import { shortStoreName, storeById, STORE_KIND_LABEL } from '@/services/admin/stores'
import { ROLE_LABEL, SHIFT_LABEL, STATUS_LABEL } from '@/services/admin/staffSeed'
import { sumRows } from '@/services/admin/collections'
import { DAY_MS, startOfDay } from '@/services/admin/time'
import { Sheet } from '../Sheet'
import { DayBars } from '../DayBars'
import { PriorityPill, StageBadge, Tag } from '../ui'
import { openOrder } from '../orders/state'

function Block({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function StockGrid({ inv }: { inv: Inventory }) {
  return (
    <div className="relative overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-100">
      <table className="w-full text-center text-xs">
        <caption className="sr-only">Units on the shelf by blood group and component</caption>
        <thead>
          <tr className="text-ink-500">
            <th scope="col" className="px-2 py-2 text-left font-semibold">Group</th>
            {COMPONENT_CODES.map((c) => (
              <th key={c} scope="col" className="px-1.5 py-2 font-semibold" title={COMPONENTS[c].name}>
                {COMPONENTS[c].short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BLOOD_GROUPS.map((g) => (
            <tr key={g} className="border-t border-ink-100">
              <th scope="row" className="px-2 py-1.5 text-left font-bold text-ink-900">
                {g.replace('-', '−')}
              </th>
              {COMPONENT_CODES.map((c) => {
                const n = inv[g][c]
                const lvl = LEVEL[stockLevel(n)]
                return (
                  <td key={c} className="px-1 py-1">
                    <span className={cn('block rounded-lg py-1 font-semibold tabular', lvl.tint, lvl.text)} title={`${g} ${COMPONENTS[c].short}: ${n} (${lvl.label})`}>
                      {n}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Everything about one store: stock, fridge, takings, people and today's orders. */
export function StoreDrawer({ storeId, onClose }: { storeId: string | null; onClose: () => void }) {
  const store = storeById(storeId ?? undefined)
  const now = useNow(2000)
  const centres = useCentres()
  const excursions = useOps((s) => s.excursions)
  const staff = useScopedStaff()
  const orders = useBoardOrders(now)
  const rows = useCollectionRows(30, now, store?.id)

  const inv = store ? storeInventory(store, centres) : null
  const outlet = store ? outletFor(store) : undefined
  const mother = outlet ? storeById(outlet.motherCentreId) : undefined
  const temp = outlet ? fridgeTemp(outlet, centres.find((c) => c.id === outlet.motherCentreId), now, excursions[outlet.id]) : null
  const people = useMemo(() => staff.filter((m) => m.storeId === storeId && m.status !== 'inactive').sort((a, b) => Number(b.status === 'on_shift') - Number(a.status === 'on_shift')), [staff, storeId])
  const todays = useMemo(() => orders.filter((o) => o.storeId === storeId && o.createdAt >= startOfDay(now)).sort((a, b) => b.createdAt - a.createdAt), [orders, storeId, now])
  const today = startOfDay(now)
  const bars = rows.map((r) => ({ day: r.day, value: r.total, detail: `${r.orders} orders` }))
  const month = sumRows(rows.filter((r) => r.day >= today - (new Date(now).getDate() - 1) * DAY_MS))
  const todayRow = sumRows(rows.filter((r) => r.day >= today))

  return (
    <Sheet
      open={!!store}
      onClose={onClose}
      title={store ? shortStoreName(store) : ''}
      subtitle={store ? `${store.name} · ${store.area}, ${cityById(store.cityId).name}` : undefined}
      header={
        store && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className={store.kind === 'outlet' ? 'bg-blood-50 text-blood-700' : 'bg-ink-950 text-white'}>{STORE_KIND_LABEL[store.kind]}</Tag>
            <Tag className={store.open24x7 ? 'bg-emerald-50 text-emerald-700' : ''}>{store.open24x7 ? 'Open 24×7' : 'Open 8–22'}</Tag>
            <Tag className="font-mono normal-case">{store.licenseNo}</Tag>
          </div>
        )
      }
      footer={
        store && (
          <Link to={`/admin/staff?store=${store.id}`} onClick={onClose} className="flex items-center justify-center gap-2 rounded-full bg-ink-950 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
            Manage this store&rsquo;s staff <ArrowRight className="size-4" aria-hidden />
          </Link>
        )
      }
    >
      {store && (
        <>
          <dl className="grid grid-cols-2 gap-2">
            {[
              ['Units on shelf', String(inventoryTotal(inv)) + (store.capacityUnits ? ` / ${store.capacityUnits}` : '')],
              ['Orders today', String(todayRow.orders)],
              ['Collected today', formatINR(todayRow.total)],
              ['Month to date', formatINR(month.total)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-ink-100">
                <dt className="text-xs text-ink-500">{k}</dt>
                <dd className="mt-0.5 font-display text-xl font-bold text-ink-950 tabular">{v}</dd>
              </div>
            ))}
          </dl>

          {temp && (
            <Block title="Fridge logger">
              <div className={cn('flex items-center gap-4 rounded-2xl p-4 ring-1', fridgeOk(temp.tempC) ? 'bg-white ring-ink-100' : 'bg-blood-50 ring-blood-200')}>
                <Thermometer className={cn('size-8', fridgeOk(temp.tempC) ? 'text-ice-600' : 'text-blood-600')} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-bold tabular">{temp.tempC.toFixed(1)} °C</p>
                  <p className="text-xs text-ink-500">
                    {fridgeOk(temp.tempC) ? `Within ${FRIDGE_MIN_C}–${FRIDGE_MAX_C} °C` : `Outside ${FRIDGE_MIN_C}–${FRIDGE_MAX_C} °C: quarantine units`} · logged {temp.loggedAgoS} s ago
                  </p>
                  <div className="relative mt-2 h-1.5 rounded-full bg-linear-to-r from-ice-400 via-emerald-400 to-blood-500" aria-hidden>
                    <span className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 rounded-full bg-ink-950 ring-2 ring-white" style={{ left: `${Math.min(100, Math.max(0, (temp.tempC / 8) * 100))}%` }} />
                  </div>
                </div>
              </div>
              {mother && <p className="mt-2 text-xs text-ink-500">Stocked by {mother.name}. Shelf counts are this outlet&rsquo;s share of the mother centre&rsquo;s live stock.</p>}
            </Block>
          )}

          {inv && (
            <Block title="Stock by group and component">
              <StockGrid inv={inv} />
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-500">
                {(['good', 'ok', 'low', 'out'] as const).map((l) => (
                  <span key={l} className="inline-flex items-center gap-1">
                    <span className={cn('size-2 rounded-full', LEVEL[l].dot)} aria-hidden /> {LEVEL[l].label}
                  </span>
                ))}
              </p>
            </Block>
          )}

          <Block title="Collections · last 30 days" action={<span className="text-xs font-semibold text-ink-900 tabular">{formatINR(sumRows(rows).total)}</span>}>
            <div className="rounded-2xl bg-white p-3 ring-1 ring-ink-100">
              <DayBars data={bars} format={formatINR} label={`Daily collections for ${shortStoreName(store)}, last 30 days`} height={84} compact />
            </div>
          </Block>

          <Block title={`Staff · ${people.filter((p) => p.status === 'on_shift').length} on shift`}>
            <ul className="divide-y divide-ink-100 rounded-2xl bg-white px-3 ring-1 ring-ink-100">
              {people.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-950">{m.name}</span>
                    <span className="block truncate text-xs text-ink-500">
                      {ROLE_LABEL[m.role]} · {SHIFT_LABEL[m.shift]}
                    </span>
                  </span>
                  <span className={cn('shrink-0 text-xs font-semibold', m.status === 'on_shift' ? 'text-emerald-700' : 'text-ink-400')}>{STATUS_LABEL[m.status]}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title={`Today's orders · ${todays.length} on the board`}>
            {todays.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink-500 ring-1 ring-ink-100">No board orders for this store yet today.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {todays.slice(0, 12).map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        openOrder(o.id)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left ring-1 ring-ink-100 hover:ring-ink-300"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <PriorityPill priority={o.priority} />
                          <span className="font-mono text-xs text-ink-500">{o.id}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-ink-900">{hospitalName(o)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <StageBadge stage={o.stage} />
                        <span className="text-[11px] text-ink-400">{formatTime(o.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        </>
      )}
    </Sheet>
  )
}
