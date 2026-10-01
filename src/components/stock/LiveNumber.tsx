import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * A number that tweens to its new value and flashes softly when it changes:
 * green when it goes up, red when it goes down, with a small floating delta.
 */
export function LiveNumber({
  value,
  className,
  showDelta = true,
  format,
}: {
  value: number
  className?: string
  showDelta?: boolean
  format?: (n: number) => string
}) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => {
    const n = Math.round(v)
    return format ? format(n) : String(n)
  })

  // Derive the change pulse during render (no effect round-trip).
  const [prev, setPrev] = useState(value)
  const [pulse, setPulse] = useState<{ id: number; delta: number } | null>(null)
  if (value !== prev) {
    setPrev(value)
    setPulse((p) => ({ id: (p?.id ?? 0) + 1, delta: value - prev }))
  }

  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.8, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, mv, reduce])

  const up = (pulse?.delta ?? 0) > 0

  return (
    <span className={cn('relative inline-flex tabular', className)}>
      {pulse && (
        <motion.span
          key={`flash-${pulse.id}`}
          aria-hidden
          className={cn('pointer-events-none absolute -inset-x-1.5 inset-y-0 rounded-lg', up ? 'bg-emerald-100' : 'bg-blood-100')}
          initial={{ opacity: 0.95 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      )}
      <motion.span className="relative">{text}</motion.span>
      {showDelta && pulse && !reduce && (
        <motion.span
          key={`delta-${pulse.id}`}
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-2 left-full ml-1 font-sans text-[11px] leading-none font-semibold',
            up ? 'text-emerald-700' : 'text-blood-700',
          )}
          initial={{ opacity: 1, y: 4 }}
          animate={{ opacity: 0, y: -10 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        >
          {up ? '+' : '−'}
          {Math.abs(pulse.delta)}
        </motion.span>
      )}
    </span>
  )
}
