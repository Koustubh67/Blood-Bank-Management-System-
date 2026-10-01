import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { BRAND } from '@/config/brand'

// Chart chrome from the ink ramp; one series in brand red, out-of-range days in ink.
const GRID = '#edeae8'
const BASELINE = '#bfb6b1'
const MUTED = '#7c706a'
const LABEL = '#2e2927'
const HOVER_BAND = '#f7f5f4'
const ON = 'var(--color-blood-600)'
const OFF = '#dcd6d3'

export interface DayBar {
  day: number
  value: number
  /** Drawn in brand red; others are muted context */
  highlight?: boolean
  detail?: ReactNode
}

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function niceTop(max: number) {
  if (max <= 0) return { top: 1, ticks: [0] }
  const raw = max / 3
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v)
  return { top, ticks }
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + rr}A${rr},${rr} 0 0 1 ${x + rr},${y}H${x + w - rr}A${rr},${rr} 0 0 1 ${x + w},${y + rr}V${y + h}Z`
}

const dayLabel = (ts: number, o: Intl.DateTimeFormatOptions) => new Date(ts).toLocaleDateString(BRAND.locale, o)

/**
 * Daily columns with a hover/keyboard tooltip. `compact` drops the axes for
 * a sparkline-sized version (store drawer); the full one has a y-axis and
 * date labels (collections page).
 */
export function DayBars({
  data,
  format,
  label,
  height = 200,
  compact = false,
  tickFormat,
}: {
  data: DayBar[]
  format: (n: number) => string
  label: string
  height?: number
  compact?: boolean
  tickFormat?: (n: number) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useWidth(ref)
  const [active, setActive] = useState<number | null>(null)
  const M = compact ? { top: 6, right: 0, bottom: 4, left: 0 } : { top: 18, right: 4, bottom: 26, left: 52 }
  const plotH = height - M.top - M.bottom
  const n = data.length
  const max = Math.max(0, ...data.map((d) => d.value))
  const { top, ticks } = niceTop(max)
  const plotW = Math.max(0, width - M.left - M.right)
  const slot = n ? plotW / n : 0
  const barW = Math.max(2, Math.min(compact ? 14 : 22, slot - 2))
  const y = (v: number) => M.top + plotH - (v / top) * plotH
  const cx = (i: number) => M.left + slot * i + slot / 2
  const labelEvery = Math.max(1, Math.ceil(52 / Math.max(slot, 1)))
  const act = active !== null ? data[active] : null
  const tipW = 180
  const tipLeft = active === null ? 0 : Math.max(0, Math.min(width - tipW, cx(active) < width / 2 ? cx(active) + 12 : cx(active) - 12 - tipW))

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setActive((a) => Math.min(n - 1, Math.max(0, (a ?? n - 1) + (e.key === 'ArrowRight' ? 1 : -1))))
    } else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else if (e.key === 'Escape') setActive(null)
  }

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Use the arrow keys to read each day.`}
      onKeyDown={onKey}
      onFocus={() => setActive((a) => a ?? n - 1)}
      onBlur={() => setActive(null)}
      className="relative rounded-2xl outline-offset-4"
      style={{ height }}
    >
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" aria-hidden onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}>
          {!compact &&
            ticks.map((t) => (
              <g key={t}>
                {t > 0 && <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={GRID} shapeRendering="crispEdges" />}
                <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={MUTED} className="tabular">
                  {(tickFormat ?? format)(t)}
                </text>
              </g>
            ))}
          {active !== null && <rect x={M.left + slot * active} y={M.top - 4} width={slot} height={plotH + 4} rx={6} fill={HOVER_BAND} />}
          {data.map((d, i) => {
            const h = Math.max(d.value > 0 ? 2 : 0, (d.value / top) * plotH)
            return <path key={d.day} d={roundedTop(cx(i) - barW / 2, y(0) - h, barW, h, compact ? 2 : 4)} fill={d.highlight === false ? OFF : ON} opacity={active === null || active === i ? 1 : 0.55} />
          })}
          <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} stroke={BASELINE} shapeRendering="crispEdges" />
          {!compact &&
            data.map((d, i) =>
              (n - 1 - i) % labelEvery === 0 ? (
                <text key={d.day} x={cx(i)} y={M.top + plotH + 17} textAnchor={i === n - 1 ? 'end' : 'middle'} dx={i === n - 1 ? barW / 2 : 0} fontSize={11} fontWeight={i === n - 1 ? 600 : 400} fill={i === n - 1 ? LABEL : MUTED}>
                  {i === n - 1 ? 'Today' : dayLabel(d.day, { day: 'numeric', month: 'short' })}
                </text>
              ) : null,
            )}
          {data.map((d, i) => (
            <rect key={d.day} x={M.left + slot * i} y={0} width={slot} height={height} fill="transparent" onPointerEnter={() => setActive(i)} onPointerDown={() => setActive(i)} />
          ))}
        </svg>
      )}
      {act && (
        <div className="pointer-events-none absolute z-10 rounded-2xl border border-ink-100 bg-white p-3 shadow-lift" style={{ left: tipLeft, top: compact ? -8 : M.top, width: tipW }}>
          <p className="text-xs text-ink-500">{active === n - 1 ? 'Today so far' : dayLabel(act.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="mt-0.5 text-base font-semibold text-ink-950 tabular">{format(act.value)}</p>
          {act.detail && <div className="mt-1.5 text-xs text-ink-600">{act.detail}</div>}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {act ? `${dayLabel(act.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${format(act.value)}` : ''}
      </p>
    </div>
  )
}
