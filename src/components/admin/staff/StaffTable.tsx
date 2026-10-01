import { Pencil, Star, UserCheck, UserX } from 'lucide-react'
import type { StaffMember } from '@/services/admin/types'
import { cityById } from '@/data/cities'
import { cn } from '@/lib/utils'
import { maskPhone } from '@/services/admin/names'
import { ROLE_LABEL, SHIFT_LABEL, STATUS_LABEL } from '@/services/admin/staffSeed'
import { shortStoreName, storeById } from '@/services/admin/stores'
import { earlierDeliveriesToday } from '@/services/admin/staffSeed'
import { Avatar, Tag } from '../ui'
import { staffFlags } from './flags'

const STATUS_TONE: Record<StaffMember['status'], string> = {
  on_shift: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  off_shift: 'bg-ink-50 text-ink-600 ring-ink-100',
  leave: 'bg-amber-50 text-amber-800 ring-amber-100',
  inactive: 'bg-white text-ink-400 ring-ink-200',
}

function StatusPill({ status }: { status: StaffMember['status'] }) {
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1', STATUS_TONE[status])}>{STATUS_LABEL[status]}</span>
}

function Flags({ m, now }: { m: StaffMember; now: number }) {
  const flags = staffFlags(m, now)
  if (!flags.length) return <span className="text-xs text-emerald-700">Up to date</span>
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <Tag key={f.label} className={f.tone === 'red' ? 'bg-blood-50 text-blood-700' : 'bg-amber-50 text-amber-800'}>
          {f.label}
        </Tag>
      ))}
    </span>
  )
}

function Performance({ m, now, todayLive }: { m: StaffMember; now: number; todayLive: number }) {
  if (m.role !== 'rider') return <span className="text-ink-300">—</span>
  const today = earlierDeliveriesToday(m, now) + todayLive
  return (
    <span className="block text-xs whitespace-nowrap">
      <span className="font-semibold text-ink-950 tabular">{today}</span> today · <span className="tabular">{(m.deliveriesTotal ?? 0) + todayLive}</span> total
      <span className="mt-0.5 flex items-center gap-2 text-ink-500">
        <span className={cn('tabular', (m.onTimePct ?? 100) < 90 && 'font-semibold text-amber-800')}>{m.onTimePct?.toFixed(1)}% on time</span>
        <span className="inline-flex items-center gap-0.5 tabular">
          <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
          {m.rating?.toFixed(2)}
        </span>
      </span>
    </span>
  )
}

function Actions({ m, onEdit, onToggle }: { m: StaffMember; onEdit: () => void; onToggle: () => void }) {
  return (
    <span className="flex items-center justify-end gap-1">
      <button type="button" onClick={onEdit} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-950" aria-label={`Edit ${m.name}`} title="Edit">
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className={cn('grid size-9 place-items-center rounded-full hover:bg-ink-100', m.status === 'inactive' ? 'text-emerald-700' : 'text-ink-500 hover:text-blood-700')}
        aria-label={m.status === 'inactive' ? `Reactivate ${m.name}` : `Deactivate ${m.name}`}
        title={m.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
      >
        {m.status === 'inactive' ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
      </button>
    </span>
  )
}

function Who({ m }: { m: StaffMember }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={m.name} tone={m.role === 'rider' ? 'bg-blood-50 text-blood-700' : m.role === 'medical_officer' ? 'bg-ice-50 text-ice-700' : 'bg-ink-100 text-ink-700'} />
      <span className="min-w-0">
        <span className={cn('block truncate font-semibold', m.status === 'inactive' ? 'text-ink-400 line-through' : 'text-ink-950')}>{m.name}</span>
        <span className="block truncate text-xs text-ink-500">
          {ROLE_LABEL[m.role]}
          {m.custom && ' · added here'}
        </span>
      </span>
    </span>
  )
}

export interface StaffTableProps {
  people: StaffMember[]
  now: number
  showCity: boolean
  todayLive: Map<string, number>
  onEdit: (m: StaffMember) => void
  onToggle: (m: StaffMember) => void
}

export function StaffTable({ people, now, showCity, todayLive, onEdit, onToggle }: StaffTableProps) {
  return (
    <>
      <div className="relative hidden overflow-x-auto rounded-3xl border border-ink-100 bg-white shadow-soft lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Staff and riders with store, shift, status, compliance and rider performance</caption>
          <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs text-ink-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Person</th>
              <th scope="col" className="px-3 py-3 font-semibold">Store and shift</th>
              <th scope="col" className="px-3 py-3 font-semibold">Status</th>
              <th scope="col" className="px-3 py-3 font-semibold">Contact</th>
              <th scope="col" className="px-3 py-3 font-semibold">Vehicle and compliance</th>
              <th scope="col" className="px-3 py-3 font-semibold">Rider performance</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {people.map((m) => (
              <tr key={m.id} className="hover:bg-ink-50/50">
                <td className="max-w-60 px-4 py-2.5">
                  <Who m={m} />
                </td>
                <td className="max-w-56 px-3 py-2.5">
                  <span className="block truncate font-medium text-ink-800">{shortStoreName(storeById(m.storeId))}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {SHIFT_LABEL[m.shift]}
                    {showCity && ` · ${cityById(m.cityId).name}`}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusPill status={m.status} />
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <span className="block font-medium text-ink-800 tabular">{maskPhone(m.phone)}</span>
                  <span className="text-ink-500">Joined {new Date(m.joinedOn).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                </td>
                <td className="max-w-64 px-3 py-2.5">
                  {m.role === 'rider' && (
                    <span className="mb-1 block text-xs text-ink-600">
                      {m.vehicleType === 'bike' ? 'Bike' : 'EV scooter'} · <span className="font-mono">{m.vehicleReg}</span>
                    </span>
                  )}
                  {m.role === 'medical_officer' && <span className="mb-1 block font-mono text-xs text-ink-600">{m.registrationNo}</span>}
                  <Flags m={m} now={now} />
                </td>
                <td className="px-3 py-2.5">
                  <Performance m={m} now={now} todayLive={todayLive.get(m.id) ?? 0} />
                </td>
                <td className="px-4 py-2.5">
                  <Actions m={m} onEdit={() => onEdit(m)} onToggle={() => onToggle(m)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {people.map((m) => (
          <li key={m.id} className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <Who m={m} />
              <Actions m={m} onEdit={() => onEdit(m)} onToggle={() => onToggle(m)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-600">
              <StatusPill status={m.status} />
              <span className="truncate">{shortStoreName(storeById(m.storeId))}</span>
              <span className="text-ink-400">· {SHIFT_LABEL[m.shift].split(' ·')[0]}</span>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              <span className="tabular">{maskPhone(m.phone)}</span>
              {m.role === 'rider' && (
                <>
                  {' '}
                  · <span className="font-mono">{m.vehicleReg}</span>
                </>
              )}
            </p>
            <div className="mt-2.5 flex flex-wrap items-end justify-between gap-2">
              <Flags m={m} now={now} />
              {m.role === 'rider' && <Performance m={m} now={now} todayLive={todayLive.get(m.id) ?? 0} />}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
