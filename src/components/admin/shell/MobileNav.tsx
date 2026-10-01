import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { SidebarContent } from './Sidebar'

/** Navigation drawer for phones and tablets, sliding in from the left. */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => (panel.current?.querySelector<HTMLElement>('a[aria-current="page"]') ?? panel.current?.querySelector<HTMLElement>('a'))?.focus())
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      previous?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-700 lg:hidden">
          <motion.div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Operations navigation"
            className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] bg-white shadow-lift"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <button type="button" onClick={onClose} className="absolute top-5 right-3 z-10 grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Close navigation">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
