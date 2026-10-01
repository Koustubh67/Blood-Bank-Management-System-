import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/**
 * Detail drawer: slides in from the right on tablets and up, and rises as a
 * bottom sheet on phones. Sits under action modals so "Assign rider" can open
 * on top of an order's details.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  header,
  footer,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  /** Extra content under the title (badges, stats) */
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  const wide = useMediaQuery('(min-width: 640px)')
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      // An action modal open on top (z-1000) handles its own Escape.
      if (e.key === 'Escape' && !document.querySelector('.z-\\[1000\\] [role="dialog"]')) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-900">
          <motion.div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'absolute flex flex-col bg-paper shadow-lift',
              wide ? 'inset-y-0 right-0 w-full max-w-xl border-l border-ink-100' : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-4xl',
              className,
            )}
            initial={wide ? { x: '100%' } : { y: '100%' }}
            animate={wide ? { x: 0 } : { y: 0 }}
            exit={wide ? { x: '100%' } : { y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div className={cn('shrink-0 border-b border-ink-100 bg-white px-5 pt-4 pb-4 sm:px-6 sm:pt-6', !wide && 'rounded-t-4xl')}>
              {!wide && <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" aria-hidden />}
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="text-xl leading-tight font-bold sm:text-2xl">
                    {title}
                  </h2>
                  {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  aria-label="Close details"
                >
                  <X className="size-5" />
                </button>
              </div>
              {header && <div className="mt-3">{header}</div>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
            {footer && <div className="shrink-0 border-t border-ink-100 bg-white px-5 py-3 sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
