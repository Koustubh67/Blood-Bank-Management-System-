import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * One heartbeat, 200 units wide on a 50-unit-tall canvas (baseline y = 36):
 * flat, P wave, sharp QRS spike, T wave, flat.
 */
const BEAT = 'h34 q7 -9 14 0 h10 l4 5 l7 -38 l7 45 l4 -12 h18 q11 -15 22 0 h80'

/**
 * Animated ECG trace. A faint full trace sits underneath while a bright
 * segment sweeps along it like a bedside monitor. Uses the `animate-ecg`
 * token (dash offset 600 → 0), so the path is normalised to length 600.
 */
export function EcgLine({
  beats = 3,
  className,
  strokeWidth = 3,
  trackOpacity = 0.18,
  glow = true,
}: {
  beats?: number
  className?: string
  strokeWidth?: number
  trackOpacity?: number
  glow?: boolean
}) {
  const d = `M0 36 ${Array.from({ length: beats }, () => BEAT).join(' ')}`
  return (
    <svg viewBox={`0 0 ${beats * 200} 50`} className={cn('block overflow-visible', className)} fill="none" aria-hidden focusable="false">
      <path d={d} stroke="currentColor" strokeOpacity={trackOpacity} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        pathLength={600}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="150 450"
        className={cn('animate-ecg motion-reduce:[stroke-dasharray:none]', glow && 'filter-[drop-shadow(0_0_5px_currentColor)]')}
      />
    </svg>
  )
}

/** Glossy blood drop that beats, with a soft pulse ring behind it. */
export function PulseDrop({ className, ring = true }: { className?: string; ring?: boolean }) {
  const gid = `drop-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <span className={cn('relative inline-grid aspect-4/5 place-items-center', className)} aria-hidden>
      {ring && <span className="absolute inset-x-[18%] top-[38%] bottom-[8%] animate-pulse-ring rounded-full bg-blood-500/35" />}
      <svg viewBox="0 0 48 60" className="relative h-full w-full animate-heartbeat drop-shadow-[0_10px_18px_rgb(200_16_46/0.45)]" focusable="false">
        <defs>
          <linearGradient id={gid} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="var(--color-blood-400)" />
            <stop offset="0.55" stopColor="var(--color-blood-600)" />
            <stop offset="1" stopColor="var(--color-blood-800)" />
          </linearGradient>
        </defs>
        <path d="M24 2C15 15 6 26 6 38a18 18 0 0 0 36 0C42 26 33 15 24 2z" fill={`url(#${gid})`} />
        <path d="M14.5 37.5a9.5 9.5 0 0 0 6.5 9" stroke="white" strokeOpacity="0.65" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  )
}
