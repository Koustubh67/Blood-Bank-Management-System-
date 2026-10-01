import { create } from 'zustand'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }))
let nextId = 1

function push(kind: ToastKind, title: string, description?: string) {
  const id = nextId++
  useToasts.setState((s) => ({ items: [...s.items, { id, kind, title, description }].slice(-4) }))
  setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
}

function dismiss(id: number) {
  useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) }))
}

/** Usage: toast.success('Saved'), toast.error('Something failed', 'details') */
export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description),
  info: (title: string, description?: string) => push('info', title, description),
}

const icons = {
  success: <CheckCircle2 className="size-5 text-emerald-600" />,
  error: <AlertCircle className="size-5 text-blood-600" />,
  info: <Info className="size-5 text-ice-600" />,
}

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-1100 flex flex-col items-center gap-2 sm:left-auto sm:items-end" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-lift')}
          >
            {icons[t.kind]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-950">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-600">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
