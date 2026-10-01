import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Headset, Mail, Phone, Siren, TriangleAlert } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

/**
 * Fade-and-rise on first scroll into view. Forced visible in print so content
 * below the fold is never printed blank.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.65, 0.3, 1] }}
      className={cn('print:transform-none! print:opacity-100!', className)}
    >
      {children}
    </motion.div>
  )
}

/** Shown on every legal document until a qualified lawyer has signed it off. */
export function DraftNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900',
        compact ? 'p-3 text-sm' : 'p-4 sm:p-5',
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
      <div>
        <p className="font-semibold">Draft template for legal review</p>
        <p className={cn('text-amber-800', compact ? 'mt-0.5' : 'mt-1')}>
          This document is a working draft prepared for the {BRAND.name} prototype. It is not legal advice and must be reviewed and
          finalised by a qualified lawyer practising in India before launch.
        </p>
      </div>
    </div>
  )
}

/** 24×7 support card: phone, email and the emergency number. */
export function ContactCard({
  title = 'Talk to a human, any time',
  description = 'Our care team answers order, payment and delivery questions around the clock.',
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-ink-300 sm:p-8', className)}>
      <div className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-blood-600/25 blur-3xl" aria-hidden />
      <div className="relative">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-white">
          <Headset className="size-5" aria-hidden />
        </span>
        <h3 className="mt-5 text-2xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-ink-400">{description}</p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href={`tel:${BRAND.supportPhone}`}
            className="group flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <Phone className="size-4 text-blood-400" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs text-ink-400">24×7 toll-free</span>
              <span className="block font-semibold text-white tabular">{BRAND.supportPhone}</span>
            </span>
          </a>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="group flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <Mail className="size-4 text-blood-400" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs text-ink-400">Email</span>
              <span className="block truncate font-semibold text-white">{BRAND.supportEmail}</span>
            </span>
          </a>
        </div>
        <a
          href={`tel:${BRAND.emergencyPhone}`}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-blood-600 px-4 py-3 font-semibold text-white shadow-glow transition hover:bg-blood-700"
        >
          <Siren className="size-4" aria-hidden />
          Medical emergency? Call {BRAND.emergencyPhone}
        </a>
      </div>
    </div>
  )
}

/** Small rounded icon tile used across content pages. */
export function IconTile({
  children,
  tone = 'red',
  className,
}: {
  children: ReactNode
  tone?: 'red' | 'ice' | 'dark' | 'neutral'
  className?: string
}) {
  const tones = {
    red: 'bg-blood-50 text-blood-600 ring-blood-100',
    ice: 'bg-ice-50 text-ice-700 ring-ice-100',
    dark: 'bg-ink-950 text-white ring-ink-900',
    neutral: 'bg-ink-50 text-ink-700 ring-ink-100',
  }
  return <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl ring-1', tones[tone], className)}>{children}</span>
}
