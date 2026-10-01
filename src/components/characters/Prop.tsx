import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PropTone = 'blood' | 'ice' | 'amber' | 'emerald' | 'indigo' | 'ink'

// Inset white glow on top for depth, plus a coloured drop shadow.
const GLOSS = 'inset_0_10px_14px_-8px_rgb(255_255_255/0.55)'
const TONES: Record<PropTone, string> = {
  blood: `from-blood-400 to-blood-700 shadow-[${GLOSS},0_14px_28px_-12px_rgb(200_16_46/0.6)]`,
  ice: `from-ice-400 to-ice-700 shadow-[${GLOSS},0_14px_28px_-12px_rgb(8_145_178/0.6)]`,
  amber: `from-amber-300 to-amber-600 shadow-[${GLOSS},0_14px_28px_-12px_rgb(217_119_6/0.55)]`,
  emerald: `from-emerald-400 to-emerald-700 shadow-[${GLOSS},0_14px_28px_-12px_rgb(4_120_87/0.55)]`,
  indigo: `from-indigo-400 to-indigo-700 shadow-[${GLOSS},0_14px_28px_-12px_rgb(67_56_202/0.55)]`,
  ink: `from-ink-700 to-ink-950 shadow-[${GLOSS},0_14px_28px_-12px_rgb(15_12_11/0.6)]`,
}

/**
 * A glossy icon tile used as an illustration prop (camp tent, cold box, clock…).
 * Size it with a width class; it stays square and the icon scales with it.
 * It sets no position of its own, so callers can place it absolutely.
 */
export function Prop({
  icon: Icon,
  tone = 'blood',
  className,
  float = false,
  delay = 0,
}: {
  icon: LucideIcon
  tone?: PropTone
  className?: string
  float?: boolean
  delay?: number
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid aspect-square shrink-0 place-items-center rounded-[28%] bg-linear-to-br text-white ring-1 ring-white/30',
        TONES[tone],
        float && 'animate-float',
        className,
      )}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      <Icon className="size-[48%]" strokeWidth={2} />
    </span>
  )
}
