import { useEffect, useId, useRef, type ReactNode, type Ref } from 'react'
import { Loader2, LocateFixed, Search, X } from 'lucide-react'
import { ERAKTKOSH_STATES } from '@/data/regions'
import { Input, Select, Skeleton } from '@/components/ui/primitives'
import { Tabs } from '@/components/ui/disclosure'
import { cn } from '@/lib/utils'
import { plural, RANGE_OPTIONS, type RangeValue } from './format'

export interface DistrictCount {
  name: string
  count: number
}

interface CampFiltersProps {
  stateCode: string
  onStateChange: (code: string) => void
  days: number
  onDaysChange: (days: number) => void
  query: string
  onQueryChange: (q: string) => void
  districts: DistrictCount[]
  /** '' means all districts */
  district: string
  onDistrictChange: (name: string) => void
  /** Camps loaded for the state and range, for the "All districts" chip */
  totalCount: number
  loading: boolean
  locating: boolean
  onLocate: () => void
  selectRef?: Ref<HTMLSelectElement>
}

/**
 * State, date range, search and "near me" stay pinned under the navbar on
 * desktop; district chips sit below and scroll sideways on phones.
 */
export function CampFilters({
  stateCode,
  onStateChange,
  days,
  onDaysChange,
  query,
  onQueryChange,
  districts,
  district,
  onDistrictChange,
  totalCount,
  loading,
  locating,
  onLocate,
  selectRef,
}: CampFiltersProps) {
  const stateId = useId()
  const searchId = useId()
  const chipsRef = useRef<HTMLDivElement>(null)
  const range = RANGE_OPTIONS.find((o) => Number(o.value) === days)?.value ?? RANGE_OPTIONS[1].value

  // Bring the active chip into view when it changes (e.g. after "Use my location").
  useEffect(() => {
    const row = chipsRef.current
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' })
  }, [district, loading])

  return (
    <>
      <div className="z-400 border-b border-ink-100 bg-white/90 backdrop-blur-xl lg:sticky lg:top-18">
        <div className="container-page flex flex-wrap items-center gap-2 py-3 sm:gap-3 sm:py-4">
          <label htmlFor={stateId} className="sr-only">
            State or union territory
          </label>
          <Select
            id={stateId}
            ref={selectRef}
            value={stateCode}
            onChange={(e) => onStateChange(e.target.value)}
            className="min-w-0 flex-1 font-semibold sm:w-60 sm:flex-none"
          >
            {ERAKTKOSH_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            title="Use my location"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-3.5 text-sm font-semibold text-ink-900 transition hover:border-ink-300 hover:bg-ink-50 disabled:cursor-progress disabled:opacity-70"
          >
            {locating ? <Loader2 className="size-4.5 animate-spin text-blood-600" aria-hidden /> : <LocateFixed className="size-4.5 text-blood-600" aria-hidden />}
            <span className="sr-only sm:not-sr-only lg:sr-only xl:not-sr-only">{locating ? 'Finding you…' : 'Use my location'}</span>
          </button>

          <div role="group" aria-label="Date range" className="relative w-full overflow-x-auto no-scrollbar sm:w-auto">
            <Tabs<RangeValue> value={range} onChange={(v) => onDaysChange(Number(v))} tabs={RANGE_OPTIONS} className="whitespace-nowrap" />
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-48 sm:flex-1">
            <label htmlFor={searchId} className="sr-only">
              Search camps
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Camp, venue or organiser"
              autoComplete="off"
              enterKeyHint="search"
              className="pr-11 pl-11 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {(loading || districts.length > 0) && (
        <div className="container-page pt-4 sm:pt-5">
          <div
            ref={chipsRef}
            role="group"
            aria-label="Filter by district"
            className="relative -mx-4 flex gap-2 overflow-x-auto px-4 py-1 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {loading ? (
              ['w-32', 'w-24', 'w-28', 'w-20', 'w-26'].map((w) => <Skeleton key={w} className={cn('h-10 shrink-0 rounded-full', w)} />)
            ) : (
              <>
                <Chip active={!district} count={totalCount} onClick={() => onDistrictChange('')}>
                  All districts
                </Chip>
                {districts.map((d) => (
                  <Chip key={d.name} active={district === d.name} count={d.count} onClick={() => onDistrictChange(d.name)}>
                    {d.name}
                  </Chip>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Chip({ active, count, onClick, children }: { active: boolean; count: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border pr-1.5 pl-4 text-sm font-semibold whitespace-nowrap transition',
        active ? 'border-ink-950 bg-ink-950 text-white shadow-soft' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:text-ink-950',
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn('grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs tabular', active ? 'bg-white/15 text-white' : 'bg-ink-100 text-ink-600')}
      >
        {count}
      </span>
      <span className="sr-only">, {plural(count, 'camp')}</span>
    </button>
  )
}
