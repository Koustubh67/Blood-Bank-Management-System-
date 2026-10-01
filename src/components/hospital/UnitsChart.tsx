import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ChartColumnStacked, PackageOpen, Table2 } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { SERIES, type DayBin } from './metrics'

// Chart chrome, from the ink ramp.
const GRID = '#edeae8' // ink-100 hairline
const BASELINE = '#bfb6b1' // ink-300
const MUTED = '#7c706a' // ink-500 axis text (4.9:1 on white)
const LABEL = '#2e2927' // ink-800
const HOVER_BAND = '#f7f5f4' // ink-50

const PLOT_H = 196
const M = { top: 24, right: 4, bottom: 30, left: 30 }
const GAP = 2
const RADIUS = 4
const TOOLTIP_W = 176

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function niceScale(max: number) {
  if (max <= 0) return { top: 4, ticks: [0, 2, 4] }
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((s) => Math.ceil(max / s) <= 4) ?? Math.ceil(max / 4)
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return { top, ticks }
}

/** Column path with a rounded data-end and a square baseline. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}A${rr},${rr} 0 0 1 ${x + rr},${y}H${x + w - rr}A${rr},${rr} 0 0 1 ${x + w},${y + rr}V${y + h}Z`
}

const dayLabel = (ts: number, opts: Intl.DateTimeFormatOptions) => new Date(ts).toLocaleDateString(BRAND.locale, opts)

export function UnitsChart({ data }: { data: DayBin[] }) {
  const reduce = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const width = useWidth(wrapRef)
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [active, setActive] = useState<number | null>(null)

  const n = data.length
  const totals = useMemo(
    () => Object.fromEntries(SERIES.map((s) => [s.key, data.reduce((sum, d) => sum + d.values[s.key], 0)])) as Record<(typeof SERIES)[number]['key'], number>,
    [data],
  )
  const grand = data.reduce((s, d) => s + d.total, 0)
  const maxTotal = Math.max(0, ...data.map((d) => d.total))
  const peakIndex = maxTotal > 0 ? data.findIndex((d) => d.total === maxTotal) : -1
  const { top, ticks } = niceScale(maxTotal)

  const plotW = Math.max(0, width - M.left - M.right)
  const slot = n ? plotW / n : 0
  const barW = Math.min(24, Math.max(6, slot * 0.56))
  const y = (v: number) => M.top + PLOT_H - (v / top) * PLOT_H
  const cx = (i: number) => M.left + slot * i + slot / 2
  const labelEvery = Math.max(1, Math.ceil(46 / Math.max(slot, 1)))
  const height = M.top + PLOT_H + M.bottom

  const describe = (d: DayBin) =>
    `${dayLabel(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${d.total} unit${d.total === 1 ? '' : 's'}` +
    (d.total ? ` (${SERIES.map((s) => `${d.values[s.key]} ${s.label.toLowerCase()}`).join(', ')})` : '')

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((a) => {
        const cur = a ?? n - 1
        return Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowRight' ? 1 : -1)))
      })
    } else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else if (e.key === 'Escape') setActive(null)
  }

  const activeBin = active !== null ? data[active] : null
  const tooltipLeft =
    active === null ? 0 : cx(active) < width / 2 ? cx(active) + barW / 2 + 10 : cx(active) - barW / 2 - 10 - TOOLTIP_W

  return (
    <div>
      {/* Legend + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Legend">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-sm text-ink-700" title={s.detail}>
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
              {s.label}
              <span className="text-ink-400 tabular">{totals[s.key]}</span>
            </li>
          ))}
        </ul>
        <div className="inline-flex rounded-full border border-ink-100 bg-ink-50 p-0.5" role="group" aria-label="Chart view">
          {(
            [
              { v: 'chart', icon: ChartColumnStacked, label: 'Chart' },
              { v: 'table', icon: Table2, label: 'Table' },
            ] as const
          ).map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition',
                view === v ? 'bg-white text-ink-950 shadow-soft' : 'text-ink-500 hover:text-ink-900',
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        {view === 'chart' ? (
          <div
            tabIndex={0}
            role="group"
            aria-label={`Units received per day, last ${n} days. ${grand} units in total. Use left and right arrow keys to step through days.`}
            onKeyDown={onKey}
            onFocus={() => setActive((a) => a ?? n - 1)}
            onBlur={() => setActive(null)}
            className="relative rounded-2xl outline-offset-4"
            style={{ height }}
          >
            {width > 0 && (
              <svg width={width} height={height} className="block overflow-visible" aria-hidden onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}>
                {/* Grid + y ticks */}
                {ticks.map((t) => (
                  <g key={t}>
                    {t > 0 && <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} shapeRendering="crispEdges" />}
                    <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={MUTED} className="tabular">
                      {t}
                    </text>
                  </g>
                ))}

                {/* Hover band */}
                {active !== null && <rect x={M.left + slot * active} y={M.top - 8} width={slot} height={PLOT_H + 8} rx={8} fill={HOVER_BAND} />}

                {/* Columns */}
                {data.map((d, i) => {
                  let base = y(0)
                  let drawn = 0
                  const visible = SERIES.filter((s) => d.values[s.key] > 0)
                  return (
                    <motion.g
                      key={d.day}
                      initial={reduce ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1, opacity: active === null || active === i ? 1 : 0.4 }}
                      transition={{ scaleY: { delay: 0.1 + i * 0.03, type: 'spring', damping: 22, stiffness: 180 }, opacity: { duration: 0.15 } }}
                      style={{ originY: 1 }}
                    >
                      {visible.map((s, vi) => {
                        const h = (d.values[s.key] / top) * PLOT_H
                        const segTop = base - h
                        const segBottom = drawn > 0 ? base - GAP : base
                        base = segTop
                        drawn++
                        const segH = Math.max(1, segBottom - segTop)
                        const x = cx(i) - barW / 2
                        return vi === visible.length - 1 ? (
                          <path key={s.key} d={topRounded(x, segTop, barW, segH, RADIUS)} fill={s.color} />
                        ) : (
                          <rect key={s.key} x={x} y={segTop} width={barW} height={segH} fill={s.color} />
                        )
                      })}
                    </motion.g>
                  )
                })}

                {/* Baseline */}
                <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} stroke={BASELINE} strokeWidth={1} shapeRendering="crispEdges" />

                {/* Peak direct label */}
                {peakIndex >= 0 && (
                  <text x={cx(peakIndex)} y={y(maxTotal) - 7} textAnchor="middle" fontSize={11} fontWeight={600} fill={LABEL} className="tabular">
                    {maxTotal}
                  </text>
                )}

                {/* X labels */}
                {data.map((d, i) =>
                  (n - 1 - i) % labelEvery === 0 ? (
                    <text
                      key={d.day}
                      x={cx(i)}
                      y={M.top + PLOT_H + 18}
                      textAnchor={i === n - 1 && slot < 40 ? 'end' : 'middle'}
                      dx={i === n - 1 && slot < 40 ? barW / 2 + 2 : 0}
                      fontSize={11}
                      fontWeight={i === n - 1 ? 600 : 400}
                      fill={i === n - 1 ? LABEL : MUTED}
                    >
                      {i === n - 1 ? 'Today' : dayLabel(d.day, { day: 'numeric', month: 'short' })}
                    </text>
                  ) : null,
                )}

                {/* Hit targets: the whole column slot, bigger than the mark */}
                {data.map((d, i) => (
                  <rect
                    key={d.day}
                    x={M.left + slot * i}
                    y={M.top - 8}
                    width={slot}
                    height={PLOT_H + 8 + M.bottom}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                  />
                ))}
              </svg>
            )}

            {grand === 0 && width > 0 && (
              <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center text-center" style={{ top: M.top, height: PLOT_H, left: M.left }}>
                <span className="grid size-11 place-items-center rounded-2xl bg-white text-ink-400 shadow-soft">
                  <PackageOpen className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink-800">No units received in the last {n} days</p>
                <p className="mt-1 max-w-xs px-4 text-xs text-ink-500">Deliveries appear here once handed over at your blood bank desk.</p>
              </div>
            )}

            {/* Tooltip */}
            {activeBin && (
              <div
                className="pointer-events-none absolute z-10 rounded-2xl border border-ink-100 bg-white p-3 shadow-lift"
                style={{ left: Math.max(0, Math.min(width - TOOLTIP_W, tooltipLeft)), top: M.top, width: TOOLTIP_W }}
              >
                <p className="text-xs text-ink-500">{dayLabel(activeBin.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p className="mt-0.5 text-lg font-semibold text-ink-950">
                  {activeBin.total} <span className="text-sm font-normal text-ink-500">unit{activeBin.total === 1 ? '' : 's'}</span>
                </p>
                <ul className="mt-2 space-y-1">
                  {SERIES.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-xs">
                      <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden />
                      <span className="w-5 font-semibold text-ink-950 tabular">{activeBin.values[s.key]}</span>
                      <span className="text-ink-500">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="sr-only" aria-live="polite">
              {activeBin ? describe(activeBin) : ''}
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-2xl border border-ink-100" style={{ minHeight: height }}>
            <table className="w-full text-sm">
              <caption className="sr-only">Units received per day by component family, last {n} days</caption>
              <thead className="bg-ink-50 text-left text-xs text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Date
                  </th>
                  {SERIES.map((s) => (
                    <th key={s.key} scope="col" className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      {s.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {[...data].reverse().map((d, i) => (
                  <tr key={d.day} className={d.total ? '' : 'text-ink-400'}>
                    <th scope="row" className="px-4 py-2 text-left font-medium whitespace-nowrap text-ink-800">
                      {i === 0 ? 'Today' : dayLabel(d.day, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </th>
                    {SERIES.map((s) => (
                      <td key={s.key} className="px-3 py-2 text-right tabular">
                        {d.values[s.key]}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-semibold tabular">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
