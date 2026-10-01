import { Link } from 'react-router'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

/** Blood drop with a heartbeat line through it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9', className)} aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--color-blood-600)" />
      <path d="M32 11c-8.5 11.5-14.5 19.5-14.5 27.5a14.5 14.5 0 0 0 29 0C46.5 30.5 40.5 22.5 32 11z" fill="#fff" />
      <path
        d="M21 40h6.5l3-6.5 4 11 3.2-4.5H43"
        fill="none"
        stroke="var(--color-blood-600)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label={`${BRAND.name} home`}>
      <LogoMark className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6" />
      <span className={cn('font-display text-xl font-bold tracking-tight', light ? 'text-white' : 'text-ink-950')}>
        Rakt<span className="text-blood-600">Flow</span>
      </span>
    </Link>
  )
}
