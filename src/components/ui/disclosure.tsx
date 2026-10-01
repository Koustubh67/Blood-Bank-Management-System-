import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------- Tabs ----------

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T
  onChange: (v: T) => void
  tabs: { value: T; label: ReactNode }[]
  className?: string
}) {
  const id = useId()
  return (
    <div role="tablist" className={cn('inline-flex rounded-full border border-ink-100 bg-white p-1 shadow-soft', className)}>
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              active ? 'text-white' : 'text-ink-600 hover:text-ink-950',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-${id}`}
                className="absolute inset-0 rounded-full bg-ink-950"
                transition={{ type: 'spring', damping: 30, stiffness: 380 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------- Accordion ----------

export function Accordion({ items, className }: { items: { q: ReactNode; a: ReactNode }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className={cn('divide-y divide-ink-100 rounded-3xl border border-ink-100 bg-white', className)}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-ink-950 hover:text-blood-700"
            >
              {item.q}
              <Plus className={cn('size-5 shrink-0 text-ink-400 transition-transform duration-300', isOpen && 'rotate-45 text-blood-600')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-ink-600">{item.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Stepper ----------

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                done && 'bg-blood-600 text-white',
                active && 'bg-ink-950 text-white ring-4 ring-ink-100',
                !done && !active && 'bg-ink-100 text-ink-500',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('hidden text-sm font-medium md:block', active ? 'text-ink-950' : 'text-ink-500')}>{label}</span>
            {i < steps.length - 1 && <span className={cn('h-0.5 flex-1 rounded-full', done ? 'bg-blood-600' : 'bg-ink-100')} />}
          </li>
        )
      })}
    </ol>
  )
}
