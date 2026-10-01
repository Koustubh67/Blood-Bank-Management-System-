import { Clock, Refrigerator, Thermometer } from 'lucide-react'
import { COMPONENTS, COMPONENT_CODES } from '@/data/blood'
import { cn } from '@/lib/utils'

// ---------- Temperature ruler ----------

const MIN = -40
const MAX = 30
const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100
const TICKS = [-40, -30, -20, -10, 0, 10, 20, 30]

interface Band {
  label: string
  range: string
  from: number
  to: number
  /** Stagger row for the label (0 = top) */
  row: 0 | 1
  align: 'start' | 'center' | 'end'
  color: string
  openLeft?: boolean
}

const BANDS: Band[] = [
  {
    label: `${COMPONENTS.FFP.short} & ${COMPONENTS.CRYO.short.toLowerCase()}`,
    range: COMPONENTS.FFP.tempRange,
    from: MIN,
    to: -30,
    row: 1,
    align: 'start',
    color: 'var(--color-ice-500)',
    openLeft: true,
  },
  {
    label: `${COMPONENTS.PRBC.short} & ${COMPONENTS.WB.short.toLowerCase()}`,
    range: COMPONENTS.PRBC.tempRange,
    from: 2,
    to: 6,
    row: 0,
    align: 'center',
    color: 'var(--color-blood-600)',
  },
  {
    label: COMPONENTS.PLT.short,
    range: COMPONENTS.PLT.tempRange.replace(' with agitation', ', agitated'),
    from: 20,
    to: 24,
    row: 1,
    align: 'end',
    color: '#CA8A04',
  },
]

const ROW_H = 44
const TRACK_H = 28

/** Gradient track, component bands, 0 °C marker and axis. */
function Track({ top }: { top: number }) {
  return (
    <>
      <div
        className="absolute inset-x-0 overflow-hidden rounded-full bg-linear-to-r from-ice-50 via-ink-50 to-amber-50 ring-1 ring-ink-100"
        style={{ top, height: TRACK_H }}
      >
        {BANDS.map((b) => (
          <span
            key={b.label}
            className="absolute inset-y-1 rounded-full"
            style={{
              left: b.openLeft ? 4 : `${pct(b.from)}%`,
              width: b.openLeft ? `calc(${pct(b.to)}% - 4px)` : `${pct(b.to) - pct(b.from)}%`,
              minWidth: 6,
              background: b.openLeft ? `linear-gradient(to right, transparent, ${b.color} 45%)` : b.color,
            }}
          />
        ))}
        <span className="absolute inset-y-0 border-l border-dashed border-ink-400" style={{ left: `${pct(0)}%` }} aria-hidden />
      </div>
      <div className="absolute inset-x-0" style={{ top: top + TRACK_H + 8 }} aria-hidden>
        {TICKS.map((t, i) => (
          <span
            key={t}
            className={cn(
              'absolute text-[10px] whitespace-nowrap text-ink-400 tabular sm:text-xs',
              t === 0 && 'font-semibold text-ink-600',
              i === 0 ? '' : i === TICKS.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
            )}
            style={{ left: `${pct(t)}%` }}
          >
            {t < 0 ? `\u2212${Math.abs(t)}` : t}
            {i === TICKS.length - 1 ? ' °C' : ''}
          </span>
        ))}
      </div>
    </>
  )
}

const bandCentre = (b: Band) => (b.openLeft ? pct(b.to) - 4 : (pct(b.from) + pct(b.to)) / 2)

export function TemperatureRuler() {
  const labelledTop = ROW_H * 2 + 14
  return (
    <figure className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-bold text-ink-950">Where each component lives on the thermometer</span>
        <span className="text-sm text-ink-500">Storage and transit ranges, °C</span>
      </figcaption>

      {/* sm and up: direct labels with leader lines */}
      <div className="relative mt-6 hidden sm:block" style={{ height: labelledTop + TRACK_H + 34 }}>
        {BANDS.map((b) => {
          const centre = bandCentre(b)
          const top = b.row * ROW_H
          const pos =
            b.align === 'start'
              ? { left: 0 }
              : b.align === 'end'
                ? { right: `${100 - pct(b.to)}%` }
                : { left: `${centre}%`, transform: 'translateX(-50%)' }
          return (
            <div key={b.label}>
              <div
                className={cn('absolute whitespace-nowrap', b.align === 'end' && 'text-right', b.align === 'center' && 'text-center')}
                style={{ top, ...pos }}
              >
                <p className="text-sm font-semibold text-ink-950">{b.label}</p>
                <p className="text-xs text-ink-500">{b.range}</p>
              </div>
              <span
                className="absolute w-px bg-ink-300"
                style={{ left: `${centre}%`, top: top + 38, height: labelledTop - (top + 38) }}
                aria-hidden
              />
            </div>
          )
        })}
        <Track top={labelledTop} />
      </div>

      {/* Phones: track first, then a legend */}
      <div className="sm:hidden">
        <div className="relative mt-5" style={{ height: TRACK_H + 30 }}>
          <Track top={0} />
        </div>
        <ul className="mt-2 space-y-2">
          {BANDS.map((b) => (
            <li key={b.label} className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-6 shrink-0 rounded-full" style={{ background: b.color }} aria-hidden />
              <span className="font-semibold text-ink-950">{b.label}</span>
              <span className="ml-auto text-right text-xs text-ink-500">{b.range}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Dashed line marks 0 °C. Red cells must stay cold but never freeze; platelets must never be refrigerated.
      </p>
    </figure>
  )
}

// ---------- Table / cards ----------

export function ColdChainTable() {
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-soft lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Storage temperature, storage equipment, shelf life and common uses for each blood component</caption>
          <thead className="bg-ink-50 text-xs tracking-wide text-ink-500 uppercase">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">
                Component
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Temperature
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Stored in
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Shelf life
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Commonly used for
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {COMPONENT_CODES.map((code) => {
              const c = COMPONENTS[code]
              return (
                <tr key={code} className="align-top transition-colors hover:bg-paper">
                  <th scope="row" className="px-6 py-5 font-normal">
                    <span className="flex items-center gap-3">
                      <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: c.tone }} aria-hidden />
                      <span>
                        <span className="block font-semibold text-ink-950">{c.name}</span>
                        <span className="block text-xs text-ink-500">{c.code}</span>
                      </span>
                    </span>
                  </th>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ice-50 px-2.5 py-1 font-semibold whitespace-nowrap text-ice-700 ring-1 ring-ice-100 tabular">
                      <Thermometer className="size-3.5" aria-hidden />
                      {c.tempRange}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-ink-700">{c.storage}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-ink-700">{c.shelfLife}</td>
                  <td className="px-6 py-5 text-ink-600">{c.usedFor}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {COMPONENT_CODES.map((code) => {
          const c = COMPONENTS[code]
          return (
            <li key={code} className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: c.tone }} aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-950">{c.name}</p>
                  <p className="text-xs text-ink-500">{c.code}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ice-50 px-2.5 py-1 text-xs font-semibold text-ice-700 ring-1 ring-ice-100 tabular">
                  <Thermometer className="size-3.5" aria-hidden />
                  {c.tempRange.replace(' with agitation', '')}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="sr-only">Stored in</dt>
                  <Refrigerator className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                  <dd className="text-ink-700">
                    {c.storage}
                    {code === 'PLT' && ', with continuous agitation'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="sr-only">Shelf life</dt>
                  <Clock className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
                  <dd className="text-ink-700">{c.shelfLife}</dd>
                </div>
                <div className="border-t border-ink-100 pt-2">
                  <dt className="text-xs font-semibold text-ink-500">Commonly used for</dt>
                  <dd className="text-ink-600">{c.usedFor}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
