import { useId, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react'
import { Check, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------- Card ----------

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-ink-100 bg-white shadow-soft', className)} {...rest} />
}

// ---------- Badge ----------

type Tone = 'neutral' | 'red' | 'green' | 'amber' | 'blue' | 'dark'
const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  red: 'bg-blood-50 text-blood-700 ring-1 ring-blood-100',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
  blue: 'bg-ice-50 text-ice-700 ring-1 ring-ice-100',
  dark: 'bg-ink-950 text-white',
}

export function Badge({ tone = 'neutral', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}
      {...rest}
    />
  )
}

// ---------- Live dot ----------

export function LiveDot({ className, color = 'bg-blood-600' }: { className?: string; color?: string }) {
  return (
    <span className={cn('relative inline-flex size-2.5', className)} aria-hidden>
      <span className={cn('absolute inset-0 animate-pulse-ring rounded-full', color)} />
      <span className={cn('relative inline-flex size-2.5 rounded-full', color)} />
    </span>
  )
}

// ---------- Form fields ----------

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
  required?: boolean
  className?: string
  children: (id: string) => ReactNode
}

/** Label + control + hint/error, with ids wired for accessibility. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-blood-600">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs font-medium text-blood-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}

const control =
  'w-full rounded-2xl border border-ink-200 bg-white px-4 text-[15px] text-ink-950 placeholder:text-ink-400 transition focus:border-blood-500 focus:ring-4 focus:ring-blood-100 focus:outline-none disabled:bg-ink-50 aria-invalid:border-blood-500'

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-12', className)} {...rest} />
}

export function Select({ className, children, ...rest }: ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%237c706a%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-size-[18px] bg-position-[right_14px_center] bg-no-repeat pr-10', className)} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'min-h-24 py-3', className)} {...rest} />
}

export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-sm text-ink-700', className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cn(
          'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition peer-focus-visible:ring-4 peer-focus-visible:ring-blood-100',
          checked ? 'border-blood-600 bg-blood-600 text-white' : 'border-ink-300 bg-white',
        )}
        aria-hidden
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  )
}

// ---------- Section heading ----------

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-ink-600">{description}</p>}
    </div>
  )
}

// ---------- Page header ----------

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="container-page py-10 sm:py-14">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg text-ink-600">{description}</p>}
        {children}
      </div>
    </div>
  )
}

// ---------- Empty state ----------

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-ink-50 text-ink-400">{icon ?? <Inbox className="size-6" />}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-ink-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-ink-100', className)} />
}
