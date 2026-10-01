import { lazy, Suspense, useMemo, useState } from 'react'
import { PhoneCall, Wand2 } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/utils'
import { useBoardOrders, useLoad, useRiderViews, useScope, useStaff } from '@/services/admin/hooks'
import { useOps } from '@/services/admin/store'
import { autoAssignAll, callInOffShift, setAutopilot, setSurge } from '@/services/admin/actions'
import { byScore, DEFER_IF_MORE_THAN_MIN } from '@/services/admin/priority'
import { scopeLabel } from '@/services/admin/stores'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { playSound } from '@/lib/sound'
import { FilterSelect, Page, PageHead, SearchField, Switch } from '@/components/admin/ui'
import { LoadMeter } from '@/components/admin/LoadMeter'
import { PriorityHelp } from '@/components/admin/PriorityHelp'
import { Queue } from '@/components/admin/dispatch/Queue'
import { RiderGroups, groupByStore } from '@/components/admin/dispatch/RiderGroups'
import { RushButton } from '@/components/admin/RushButton'

const DispatchMap = lazy(() => import('@/components/admin/dispatch/DispatchMap'))

type StateFilter = 'all' | 'available' | 'busy' | 'off'

export default function Dispatch() {
  const now = useNow(1000)
  const scope = useScope()
  const orders = useBoardOrders(now)
  const views = useRiderViews(now)
  const load = useLoad(now)
  const staff = useStaff()
  const autopilot = useOps((s) => s.autopilot)
  const surge = useOps((s) => s.surge)
  const [q, setQ] = useState('')
  const [state, setState] = useState<StateFilter>('all')

  const queue = useMemo(() => orders.filter((o) => o.stage === 'packing' || o.stage === 'ready').sort(byScore(now)), [orders, now])
  const waiting = queue.filter((o) => o.stage === 'ready' && !o.riderId && o.source === 'ops')
  const names = useMemo(() => new Map(staff.map((m) => [m.id, m.name])), [staff])

  const filteredViews = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return views.filter((v) => {
      if (state === 'available' && v.state !== 'available') return false
      if (state === 'busy' && !['to_pickup', 'on_the_way', 'returning'].includes(v.state)) return false
      if (state === 'off' && !['off_shift', 'leave'].includes(v.state)) return false
      if (v.state === 'inactive') return false
      return !needle || [v.rider.name, v.rider.vehicleReg ?? '', v.store.name, v.store.area].some((s) => s.toLowerCase().includes(needle))
    })
  }, [views, q, state])
  const groups = useMemo(() => groupByStore(filteredViews, waiting), [filteredViews, waiting])

  const counts = useMemo(
    () => ({
      available: views.filter((v) => v.state === 'available').length,
      busy: views.filter((v) => ['to_pickup', 'on_the_way', 'returning'].includes(v.state)).length,
      off: views.filter((v) => v.state === 'off_shift' || v.state === 'leave').length,
    }),
    [views],
  )

  const assignAll = () => {
    const r = autoAssignAll(scope)
    if (r.assigned) playSound('tap')
    if (r.assigned) toast.success(`${r.assigned} rider${r.assigned === 1 ? '' : 's'} assigned`, r.waiting ? `${r.waiting} still waiting for a rider.` : 'Every packed order now has a rider.')
    else toast.info(waiting.length ? 'No free rider can take these yet' : 'Nothing to assign', waiting.length ? (surge ? 'Call in off-shift riders or wait for returns.' : 'Turn on Surge mode to borrow riders from nearby stores.') : undefined)
  }
  const callIn = () => {
    const n = callInOffShift(scope)
    if (n) toast.success(`${n} rider${n === 1 ? '' : 's'} called in`, 'Shown as available straight away in this prototype.')
    else toast.info('No off-shift riders to call in')
  }

  return (
    <Page title="Dispatch">
      <PageHead
        eyebrow={`Dispatch · ${scopeLabel(scope)}`}
        title="Riders and the queue"
        description="Who is free, who is on the road, and which packed orders still need someone. Auto-assign takes the highest score first and the nearest free rider."
        actions={<PriorityHelp />}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Dispatch controls" className="xl:col-start-1 rounded-3xl border border-ink-100 bg-white p-4 shadow-soft sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Switch
              checked={autopilot}
              onChange={setAutopilot}
              label="Autopilot"
              description="Stores verify, pack, dispatch and hand over on their own. Orders you touch are left to you for 3 min."
            />
            <Switch
              checked={surge}
              onChange={setSurge}
              label="Surge mode"
              description={`Borrow the nearest free rider from other stores in the city, and hold scheduled orders with over ${DEFER_IF_MORE_THAN_MIN} min to spare.`}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            <Button variant="dark" size="md" icon={<Wand2 className="size-4" />} onClick={assignAll}>
              Auto-assign all{waiting.length ? ` (${waiting.length})` : ''}
            </Button>
            <Button variant="outline" size="md" icon={<PhoneCall className="size-4" />} onClick={callIn} disabled={!counts.off}>
              Call in off-shift riders
            </Button>
            <RushButton scope={scope} />
          </div>
        </section>
        <div className="xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <div className="flex flex-col gap-5 xl:sticky xl:top-24">
            <LoadMeter load={load} scope={scope} />
            <Queue orders={queue} now={now} surge={surge} riderName={(id) => (id ? names.get(id) : undefined)} />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4 xl:col-start-1">
          <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl sm:h-96" />}>
            <DispatchMap scope={scope} views={views} className="h-72 border border-ink-100 shadow-soft sm:h-96" />
          </Suspense>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchField value={q} onChange={setQ} label="Search riders" placeholder="Rider, registration or store" className="sm:max-w-xs sm:flex-1" />
            <FilterSelect label="Rider status" value={state} onChange={(v) => setState(v as StateFilter)} className="sm:w-56">
              <option value="all">All riders ({views.length})</option>
              <option value="available">Available ({counts.available})</option>
              <option value="busy">Busy ({counts.busy})</option>
              <option value="off">Off shift or leave ({counts.off})</option>
            </FilterSelect>
            <p className={cn('text-xs text-ink-500 sm:ml-auto')} aria-live="polite">
              <span className="font-semibold text-emerald-700 tabular">{counts.available}</span> free · <span className="font-semibold text-ink-900 tabular">{counts.busy}</span> busy ·{' '}
              <span className="tabular">{counts.off}</span> off
            </p>
          </div>
          <RiderGroups groups={groups} />
        </div>
      </div>
    </Page>
  )
}
