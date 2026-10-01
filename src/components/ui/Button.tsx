import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'white'
type Size = 'sm' | 'md' | 'lg' | 'xl'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

const variants: Record<Variant, string> = {
  primary: 'bg-blood-600 text-white shadow-glow hover:bg-blood-700 hover:shadow-[0_14px_44px_-10px_rgb(200_16_46/0.7)]',
  secondary: 'bg-blood-50 text-blood-700 hover:bg-blood-100',
  outline: 'border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
  dark: 'bg-ink-950 text-white hover:bg-ink-800',
  white: 'bg-white text-ink-950 shadow-soft hover:bg-ink-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
  xl: 'h-15 px-8 text-lg',
}

export interface ButtonStyleProps {
  variant?: Variant
  size?: Size
  className?: string
}

export function buttonClass({ variant = 'primary', size = 'md', className }: ButtonStyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, className, loading, icon, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass({ variant, size, className })}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps, ButtonStyleProps {
  icon?: ReactNode
}

export function ButtonLink({ variant, size, className, icon, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
