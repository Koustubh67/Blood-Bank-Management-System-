import { useMemo } from 'react'
import { FlaskConical, MapPin, Menu, Pause } from 'lucide-react'
import { citiesByState } from '@/data/cities'
import { BRAND } from '@/config/brand'
import { useNow } from '@/hooks/useNow'
import { useAlertPrefs } from '@/services/admin/alerts'
import { AlertsMenu } from './AlertsMenu'
import { LiveDot } from '@/components/ui/primitives'
import { LogoMark } from '@/components/ui/Logo'
import { setScope } from '@/services/admin/actions'
import { useBoardOrders, useScope } from '@/services/admin/hooks'
import { isActive } from '@/services/admin/priority'
import { ALL_INDIA } from '@/services/admin/stores'
import { cn } from '@/lib/utils'

const GROUPS = citiesByState()

export function CitySwitcher({ className }: { className?: string }) {
  const scope = useScope()
  return (
    <label className={cn('relative block min-w-0', className)}>
      <span className="sr-only">City shown on every operations page</span>
      <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-blood-600" aria-hidden />
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="h-10 w-full appearance-none truncate rounded-full border border-ink-200 bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%237c706a%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat pr-9 pl-9 text-sm font-semibold text-ink-950 hover:border-ink-300 focus:border-blood-500 focus:ring-4 focus:ring-blood-100 focus:outline-none"
      >
        <option value={ALL_INDIA}>All India</option>
        {GROUPS.map(({ state, cities }) => (
          <optgroup key={state} label={state}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}

function Clock() {
  const now = useNow(1000)
  const d = new Date(now)
  const full = d.toLocaleTimeString(BRAND.locale, { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  const short = d.toLocaleTimeString(BRAND.locale, { hour: 'numeric', minute: '2-digit' })
  return (
    <time dateTime={d.toISOString()} className="text-sm font-semibold whitespace-nowrap text-ink-800 tabular" aria-label={`Time ${short}`}>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </time>
  )
}

function LiveCount() {
  const now = useNow(2000)
  const orders = useBoardOrders(now)
  const live = useMemo(() => orders.filter(isActive).length, [orders])
  const feedOn = useAlertPrefs((s) => s.feedOn)
  return (
    <p className="hidden items-center gap-2 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700 md:inline-flex" aria-live="polite" aria-atomic="true">
      {feedOn ? <LiveDot className="size-2" /> : <Pause className="size-3 text-amber-600" aria-hidden />}
      <span className="tabular">{live}</span> live orders{!feedOn && <span className="text-amber-700"> · feed paused</span>}
    </p>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="-ml-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-700 hover:bg-ink-100 lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <LogoMark className="hidden size-8 shrink-0 sm:block lg:hidden" />
        <CitySwitcher className="w-full max-w-60 flex-1 sm:flex-none" />
        <LiveCount />
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span
            title="Prototype · simulated operations"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-1 text-[11px] font-semibold text-ink-600 ring-1 ring-ink-100 sm:px-2.5"
          >
            <FlaskConical className="size-3.5 text-blood-500" aria-hidden />
            <span className="hidden xl:inline">Prototype · simulated operations</span>
            <span className="hidden sm:inline xl:hidden">Simulated</span>
            <span className="sr-only sm:hidden">Prototype · simulated operations</span>
          </span>
          <Clock />
          <AlertsMenu />
        </div>
      </div>
    </header>
  )
}
