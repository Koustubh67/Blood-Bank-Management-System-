import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tail = 'left' | 'right' | 'top' | 'bottom' | 'none'
type BubbleTone = 'white' | 'dark' | 'mint'

const BUBBLE_TONES: Record<BubbleTone, string> = {
  white: 'bg-white text-ink-900 ring-1 ring-ink-100',
  dark: 'bg-ink-900 text-white ring-1 ring-white/10',
  mint: 'bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200',
}

const TAIL_POS: Record<Exclude<Tail, 'none'>, string> = {
  left: 'top-1/2 -left-1.5 -translate-y-1/2',
  right: 'top-1/2 -right-1.5 -translate-y-1/2',
  top: '-top-1.5 left-8',
  bottom: '-bottom-1.5 left-8',
}

/** A short line of dialogue next to an illustrated person. */
export function SpeechBubble({
  children,
  tail = 'top',
  tone = 'white',
  className,
  tailClassName,
}: {
  children: ReactNode
  tail?: Tail
  tone?: BubbleTone
  className?: string
  /** Override where the tail sits, e.g. "left-auto right-10". */
  tailClassName?: string
}) {
  return (
    <div className={cn('relative rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug font-medium shadow-soft sm:px-4 sm:py-3 sm:text-[15px]', BUBBLE_TONES[tone], className)}>
      {tail !== 'none' && (
        <span aria-hidden className={cn('absolute size-3 rotate-45 rounded-[2px]', BUBBLE_TONES[tone].split(' ')[0], TAIL_POS[tail], tailClassName)} />
      )}
      <span className="relative">{children}</span>
    </div>
  )
}
