import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

/** Password field with a show/hide toggle. */
export function PasswordInput({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={rest.id}
      >
        {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
      </button>
    </div>
  )
}

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  tip: string
}

export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: 'Enter a password', tip: 'At least 8 characters.' }
  let points = 0
  if (pw.length >= 8) points++
  if (pw.length >= 12) points++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++
  if (/\d/.test(pw)) points++
  if (/[^A-Za-z0-9]/.test(pw)) points++
  if (/^(.)\1+$/.test(pw) || /^(password|12345678|qwerty)/i.test(pw)) points = Math.min(points, 1)
  const score = (pw.length < 8 ? Math.min(points, 1) : Math.min(4, Math.max(1, points))) as Strength['score']
  const tip =
    pw.length < 8
      ? `${8 - pw.length} more character${8 - pw.length === 1 ? '' : 's'} needed.`
      : score < 3
        ? 'Add length, a number, a symbol or mixed case.'
        : score === 3
          ? 'Good. A longer passphrase is even better.'
          : 'Strong password.'
  const label = pw.length < 8 ? 'Too short' : (['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const)[score]
  return { score, label, tip }
}

const BAR = ['bg-blood-500', 'bg-blood-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600']

export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  const s = passwordStrength(password)
  return (
    <div id={id} className="flex flex-col gap-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 rounded-full transition-colors duration-300', password && s.score >= i ? BAR[s.score] : 'bg-ink-100')}
          />
        ))}
      </div>
      <p className="text-xs text-ink-500">
        {password ? (
          <>
            <span className="font-semibold text-ink-800">{s.label}.</span> {s.tip}
          </>
        ) : (
          s.tip
        )}
      </p>
    </div>
  )
}
