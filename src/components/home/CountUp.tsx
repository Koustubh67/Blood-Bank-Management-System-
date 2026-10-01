import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { BRAND } from '@/config/brand'
import { EASE_OUT } from './Reveal'

/** Counts up from zero the first time it is seen, then eases between live values. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const current = useRef(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      current.current = value
      setDisplay(value)
      return
    }
    const from = current.current
    const controls = animate(from, value, {
      duration: from === 0 ? 1.4 : 0.6,
      ease: EASE_OUT,
      onUpdate: (v) => {
        current.current = v
        setDisplay(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, value, reduced])

  return (
    <span ref={ref}>
      <span aria-hidden>{display.toLocaleString(BRAND.locale)}</span>
      <span className="sr-only">{value.toLocaleString(BRAND.locale)}</span>
    </span>
  )
}
