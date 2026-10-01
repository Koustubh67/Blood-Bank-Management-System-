import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { hashString, seeded } from '@/lib/utils'

/** Blood drop that lands, draws a check and sends out soft ripples. */
export function SuccessMark() {
  const reduce = useReducedMotion()
  return (
    <div className="relative grid size-36 place-items-center" aria-hidden>
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-6 rounded-full border-2 border-blood-300"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 2], opacity: [0.65, 0] }}
            transition={{ duration: 2.2, delay: 0.55 + i * 0.55, repeat: 2, repeatDelay: 0.8, ease: 'easeOut' }}
          />
        ))}
      <motion.span
        className="absolute bottom-5 h-3 w-16 rounded-full bg-blood-900/15 blur-md"
        initial={{ scaleX: 0.2, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />
      <motion.svg
        viewBox="0 0 64 64"
        className="relative size-24"
        initial={reduce ? false : { y: -48, opacity: 0, scaleY: 1.15, scaleX: 0.85 }}
        animate={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, mass: 0.9 }}
      >
        <defs>
          <linearGradient id="drop-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-blood-500)" />
            <stop offset="100%" stopColor="var(--color-blood-700)" />
          </linearGradient>
        </defs>
        <path d="M32 3C21 17.5 13 27.5 13 38.5a19 19 0 0 0 38 0C51 27.5 43 17.5 32 3z" fill="url(#drop-fill)" />
        <path d="M22.5 33c1-5 4-9.5 7.5-14" stroke="white" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" fill="none" />
        <motion.path
          d="M23 40l6.5 6.5L42 33.5"
          stroke="white"
          strokeWidth="4.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
        />
      </motion.svg>
    </div>
  )
}

const COLORS = ['#c8102e', '#fb6173', '#ffc6cc', '#22d3ee', '#0891b2', '#f59e0b', '#10b981', '#2e2927']

/** One-shot confetti burst made of plain motion divs. */
export function Confetti({ seed, count = 44 }: { seed: string; count?: number }) {
  const reduce = useReducedMotion()
  const pieces = useMemo(() => {
    const r = seeded(hashString(seed))
    return Array.from({ length: count }, (_, i) => {
      const round = r() < 0.3
      const w = 6 + r() * 5
      return {
        id: i,
        left: 4 + r() * 92,
        w,
        h: round ? w : w * (1.4 + r() * 0.8),
        round,
        color: COLORS[Math.floor(r() * COLORS.length)],
        drift: (r() - 0.5) * 140,
        fall: 360 + r() * 320,
        spin: (r() - 0.5) * 900,
        delay: r() * 0.5,
        duration: 2.2 + r() * 1.6,
      }
    })
  }, [seed, count])

  if (reduce) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden print:hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color, borderRadius: p.round ? 999 : 2 }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 0 }}
          animate={{ y: p.fall, x: p.drift, rotate: p.spin, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: 0.35 + p.delay, ease: [0.15, 0.55, 0.35, 1], opacity: { times: [0, 0.08, 0.7, 1], duration: p.duration, delay: 0.35 + p.delay } }}
        />
      ))}
    </div>
  )
}
