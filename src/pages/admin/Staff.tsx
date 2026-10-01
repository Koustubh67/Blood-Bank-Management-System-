import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { UserPlus } from 'lucide-react'
import type { StaffMember, StaffRole, StaffStatus } from '@/services/admin/types'
import { useNow } from '@/hooks/useNow'
import { cityById } from '@/data/cities'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useOps } from '@/services/admin/store'
import { useScope, useScopedStaff, useStaff } from '@/services/admin/hooks'
import { riderBusy, setStaffStatus } from '@/services/admin/actions'
import { ROLE_LABEL, STATUS_LABEL } from '@/services/admin/staffSeed'
import { ALL_INDIA, scopeLabel, shortStoreName, storeById, storesIn } from '@/services/admin/stores'
import { startOfDay } from '@/services/admin/time'
import { FilterSelect, MoreButton, Page, PageHead, SearchField, StatTile } from '@/components/admin/ui'
import { StaffTable } from '@/components/admin/staff/StaffTable'
import { StaffForm } from '@/components/admin/staff/StaffForm'
import { staffFlags } from '@/components/admin/staff/flags'

const ROLES = Object.keys(ROLE_LABEL) as StaffRole[]
const STATUSES = Object.keys(STATUS_LABEL) as StaffStatus[]

export default function Staff() {
  const now = useNow(30_000)
  const scope = useScope()
  const people = useScopedStaff()
  const all = useStaff()
  const orders = useOps((s) => s.orders)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<'all' | StaffRole>('all')
  const [status, setStatus] = useState<'all' | StaffStatus>('all')
  const [limit, setLimit] = useState(40)
  const [adding, setAdding] = useState(false)

  const stores = useMemo(() => storesIn(scope), [scope])
  const storeParam = params.get('store')
  const storeId = storeParam && stores.some((s) => s.id === storeParam) ? storeParam : 'all'
  const flagOnly = params.get('flag') === 'expiring'
  const editId = params.get('edit')
  const editing = editId ? (all.find((m) => m.id === editId) ?? null) : null

  const setParam = (key: string, value: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const todayLive = useMemo(() => {
    const m = new Map<string, number>()
    const today = startOfDay(now)
    for (const o of orders) if (o.riderId && o.stage === 'delivered' && (o.stageAt.delivered ?? 0) >= today) m.set(o.riderId, (m.get(o.riderId) ?? 0) + 1)
    return m
  }, [orders, now])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const digits = needle.replace(/\D/g, '')
    return people
      .filter((m) => role === 'all' || m.role === role)
      .filter((m) => status === 'all' || m.status === status)
      .filter((m) => storeId === 'all' || m.storeId === storeId)
      .filter((m) => !flagOnly || staffFlags(m, now).length > 0)
      .filter(
        (m) =>
          !needle ||
          [m.name, m.vehicleReg ?? '', m.registrationNo ?? '', shortStoreName(storeById(m.storeId)), m.id].some((s) => s.toLowerCase().includes(needle)) ||
          (digits.length >= 3 && m.phone.includes(digits)),
      )
      .sort((a, b) => Number(b.status === 'on_shift') - Number(a.status === 'on_shift') || a.storeId.localeCompare(b.storeId) || ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
  }, [people, role, status, storeId, flagOnly, q, now])

  const summary = useMemo(() => {
    const active = people.filter((m) => m.status !== 'inactive')
    const riders = active.filter((m) => m.role === 'rider')
    return {
      total: active.length,
      onShift: active.filter((m) => m.status === 'on_shift').length,
      riders: riders.length,
      ridersOn: riders.filter((m) => m.status === 'on_shift').length,
      flagged: active.filter((m) => staffFlags(m, now).length > 0).length,
      onTime: riders.length ? riders.reduce((s, m) => s + (m.onTimePct ?? 0), 0) / riders.length : 0,
    }
  }, [people, now])

  const toggle = (m: StaffMember) => {
    if (m.status === 'inactive') {
      setStaffStatus(m.id, 'off_shift')
      toast.success(`${m.name} reactivated`, 'Set to off shift; edit the record to put them on shift.')
      return
    }
    if (riderBusy(m.id)) return toast.error(`${m.name} is on a delivery`, 'Deactivate after the handover, or reassign the order first.')
    if (!confirm(`Deactivate ${m.name}? They will no longer be rostered or dispatched. The record is kept.`)) return
    setStaffStatus(m.id, 'inactive')
    toast.success(`${m.name} deactivated`)
  }

  const defaultStore = storeId !== 'all' ? storeId : (stores[0]?.id ?? '')
  const shown = filtered.slice(0, limit)

  return (
    <Page title="Staff & drivers">
      <PageHead
        eyebrow={`Staff & drivers · ${scopeLabel(scope)}`}
        title="People at every store"
        description="Store managers, lab technicians, medical officers, dispatchers and riders. Licences and cold-chain training are flagged 30 days before they lapse."
        actions={
          <Button variant="dark" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            Add employee
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="People" value={summary.total} sub={`${summary.onShift} on shift now`} />
        <StatTile label="Riders" value={summary.riders} sub={`${summary.ridersOn} on shift`} />
        <StatTile label="Rider on-time" value={`${summary.onTime.toFixed(1)}%`} sub="Average across riders" />
        <StatTile label="Compliance flags" value={summary.flagged} tone={summary.flagged ? 'amber' : 'green'} sub="Licences and training due or lapsed" />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-3xl border border-ink-100 bg-white p-3 shadow-soft sm:p-4 md:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_auto]">
        <SearchField value={q} onChange={setQ} label="Search staff" placeholder="Name, phone, plate, registration" className="col-span-2 md:col-span-1" />
        <FilterSelect label="Role" value={role} onChange={(v) => setRole(v as 'all' | StaffRole)}>
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={status} onChange={(v) => setStatus(v as 'all' | StaffStatus)}>
          <option value="all">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Store" value={storeId} onChange={(v) => setParam('store', v === 'all' ? null : v)} className="col-span-2 md:col-span-1">
          <option value="all">All stores ({stores.length})</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {shortStoreName(s)}
              {scope === ALL_INDIA ? ` · ${cityById(s.cityId).name}` : ''}
            </option>
          ))}
        </FilterSelect>
        <label className="col-span-2 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-ink-200 px-4 text-sm font-medium whitespace-nowrap text-ink-800 hover:bg-ink-50 md:col-span-1">
          <input type="checkbox" className="size-4 accent-ink-950" checked={flagOnly} onChange={(e) => setParam('flag', e.target.checked ? 'expiring' : null)} />
          Flagged only
        </label>
      </div>

      <p className="-mt-2 text-xs text-ink-500" aria-live="polite">
        Showing {Math.min(limit, filtered.length)} of {filtered.length} people
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">Nobody matches these filters.</p>
      ) : (
        <div>
          <StaffTable people={shown} now={now} showCity={scope === ALL_INDIA} todayLive={todayLive} onEdit={(m) => setParam('edit', m.id)} onToggle={toggle} />
          <MoreButton shown={shown.length} total={filtered.length} onMore={() => setLimit((n) => n + 40)} noun="people" />
        </div>
      )}

      <StaffForm
        open={adding || !!editing}
        member={editing}
        scope={scope}
        defaultStore={defaultStore}
        onClose={() => {
          setAdding(false)
          setParam('edit', null)
        }}
      />
    </Page>
  )
}
