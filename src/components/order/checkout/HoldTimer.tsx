import { useEffect, useRef } from 'react'
import { RotateCcw, Timer } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { cn, formatClock } from '@/lib/utils'
import { HOLD_MS } from '../paymentHold'

/** Countdown pill for the payment session. Owns its own 1 s tick so the page doesn't re-render. */
export function HoldTimer({
  deadline,
  onExpire,
  onRestart,
  className,
}: {
  deadline: number
  onExpire: () => void
  onRestart: () => void
  className?: string
}) {
  const now = useNow(1000)
  const remaining = Math.max(0, deadline - now)
  const expired = remaining === 0
  const fired = useRef(false)

  useEffect(() => {
    if (expired && !fired.current) {
      fired.current = true
      onExpire()
    }
    if (!expired) fired.current = false
  }, [expired, onExpire])

  const frac = Math.min(1, remaining / HOLD_MS)
  const C = 2 * Math.PI * 16
  const low = remaining < 2 * 60_000

  if (expired)
    return (
      <div className={cn('inline-flex items-center gap-3 rounded-full bg-blood-50 py-1.5 pr-1.5 pl-4 ring-1 ring-blood-100', className)} role="status">
        <span className="text-sm font-semibold text-blood-800">Hold expired</span>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-ink-950 shadow-soft hover:bg-ink-50"
        >
          <RotateCcw className="size-4" aria-hidden /> Re-check stock
        </button>
      </div>
    )

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-full py-1.5 pr-5 pl-1.5 ring-1 transition-colors',
        low ? 'bg-amber-50 ring-amber-200' : 'bg-white ring-ink-100',
        className,
      )}
      role="timer"
      aria-label={`Units held for ${Math.ceil(remaining / 60_000)} more minutes`}
    >
      <span className="relative grid size-10 place-items-center">
        <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3" className="stroke-ink-100" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            className={cn('transition-[stroke-dashoffset] duration-1000 ease-linear', low ? 'stroke-amber-500' : 'stroke-ice-500')}
          />
        </svg>
        <Timer className={cn('size-4', low ? 'text-amber-700' : 'text-ice-700')} aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-xs text-ink-500">Units held for you</span>
        <span className={cn('block font-display text-lg font-bold tabular', low ? 'text-amber-800' : 'text-ink-950')}>{formatClock(remaining)}</span>
      </span>
    </div>
  )
}
