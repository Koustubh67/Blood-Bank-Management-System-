import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Status pill for dark surfaces (the shared Badge is tuned for light ones). */
export function DarkPill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1', className)}>{children}</span>
}
