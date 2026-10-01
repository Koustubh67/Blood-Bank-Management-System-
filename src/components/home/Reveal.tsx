import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

/** Shared "expo out" curve so every section eases the same way. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Distance in px the element rises from */
  y?: number
}

const VIEWPORT = { once: true, margin: '0px 0px -64px 0px' } as const

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, className, delay = 0, y = 28 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Same as Reveal, rendered as a list item so ordered lists keep their semantics. */
export function RevealItem({ children, className, delay = 0, y = 28 }: RevealProps) {
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.li>
  )
}

/**
 * Vertical rhythm shared by every home section after the hero, so the page
 * breathes evenly instead of alternating huge and tiny gaps.
 */
export const SECTION_Y = 'py-12 sm:py-16 lg:py-18'

/** Section heading used across the home page. `md` is the compact size the home page itself uses. */
export function HomeHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'light',
  size = 'lg',
  className,
}: {
  id: string
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  tone?: 'light' | 'dark'
  size?: 'lg' | 'md'
  className?: string
}) {
  const dark = tone === 'dark'
  const md = size === 'md'
  return (
    <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className={cn('eyebrow', md ? 'mb-3' : 'mb-4', dark && 'text-blood-400', align === 'center' && 'justify-center')}>{eyebrow}</p>}
      <h2
        id={id}
        className={cn(
          md
            ? 'text-[2rem] leading-[1.04] font-bold tracking-[-0.032em] sm:text-[2.6rem] lg:text-[2.85rem]'
            : 'text-[2.35rem] leading-[1.02] font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl',
          dark ? 'text-white' : 'text-ink-950',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'leading-relaxed',
            md ? 'mt-4 text-base sm:text-lg' : 'mt-5 text-lg sm:text-xl',
            dark ? 'text-ink-300' : 'text-ink-600',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  )
}
