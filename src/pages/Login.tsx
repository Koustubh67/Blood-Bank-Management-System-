import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, Building2, LayoutDashboard, LogOut, Sparkles, UserRound } from 'lucide-react'
import { AuthShell, safeNext } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { DEMO_ACCOUNTS, ensureDemoAccounts, login, logout, useCurrentUser } from '@/services/auth'
import { ApiError } from '@/services/api'
import type { Role, User } from '@/types'
import { cn } from '@/lib/utils'

type Demo = (typeof DEMO_ACCOUNTS)[number]

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const next = safeNext(params.get('next'))
  const demoParam = params.get('demo')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'form' | Role | null>(null)
  const [prefilled, setPrefilled] = useState<Demo | null>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  // ?demo=hospital | individual fills the matching demo credentials.
  useEffect(() => {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === demoParam)
    if (!demo) return
    setEmail(demo.email)
    setPassword(demo.password)
    setPrefilled(demo)
    setError(null)
    const raf = requestAnimationFrame(() => submitRef.current?.focus())
    return () => cancelAnimationFrame(raf)
  }, [demoParam])

  const destination = (u: User) => next ?? (u.role === 'hospital' ? '/hospital' : u.role === 'admin' ? '/admin' : '/')

  const signIn = async (mail: string, pass: string, source: 'form' | Role) => {
    setBusy(source)
    setError(null)
    try {
      if (DEMO_ACCOUNTS.some((d) => d.email === mail.trim().toLowerCase())) await ensureDemoAccounts()
      const u = await login(mail, pass)
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`)
      navigate(destination(u), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setBusy(null)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    void signIn(email, password, 'form')
  }

  const tryDemo = (d: Demo) => {
    setEmail(d.email)
    setPassword(d.password)
    setPrefilled(d)
    void signIn(d.email, d.password, d.role)
  }

  const signupHref = `/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      description="Order blood for a patient, follow a delivery live, or run your hospital's requests."
      panelTitle={
        <>
          Every minute counts. <span className="text-blood-400">We'll handle the rest.</span>
        </>
      }
    >
      {user && busy === null && (
        <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-ink-100 bg-ink-50 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blood-600 font-semibold text-white">
              {user.role === 'hospital' ? <Building2 className="size-4" /> : user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink-600">You're signed in as</p>
              <p className="truncate font-semibold text-ink-950">{user.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="dark" onClick={() => navigate(destination(user))} className="flex-1 sm:flex-none">
              Continue <ArrowRight className="size-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={logout} icon={<LogOut className="size-4" />}>
              Switch
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setPrefilled(null)
              }}
              aria-invalid={!!error || undefined}
              required
            />
          )}
        </Field>
        <Field label="Password">
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPrefilled(null)
              }}
              aria-invalid={!!error || undefined}
              required
            />
          )}
        </Field>

        <AnimatePresence initial={false} mode="popLayout">
          {error ? (
            <motion.p
              key="err"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-2xl bg-blood-50 px-4 py-3 text-sm font-medium text-blood-800"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
            </motion.p>
          ) : prefilled ? (
            <motion.p
              key="demo"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-2xl bg-ice-50 px-4 py-3 text-sm text-ice-700"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              Demo {prefilled.label.toLowerCase()} credentials filled in. Press Sign in.
            </motion.p>
          ) : null}
        </AnimatePresence>

        <Button ref={submitRef} type="submit" size="lg" loading={busy === 'form'} disabled={busy !== null} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-8 flex items-center gap-4 text-[11px] font-semibold tracking-[0.16em] text-ink-400 uppercase">
        <span className="h-px flex-1 bg-ink-100" /> Or try a demo account <span className="h-px flex-1 bg-ink-100" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {DEMO_ACCOUNTS.map((d) => {
          const Icon = d.role === 'hospital' ? Building2 : d.role === 'admin' ? LayoutDashboard : UserRound
          const highlighted = prefilled?.email === d.email
          return (
            <button
              key={d.email}
              type="button"
              onClick={() => tryDemo(d)}
              disabled={busy !== null}
              className={cn(
                'group flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-soft disabled:pointer-events-none disabled:opacity-60',
                highlighted ? 'border-blood-300 ring-4 ring-blood-50' : 'border-ink-200',
              )}
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-xl',
                  d.role === 'hospital' ? 'bg-ice-50 text-ice-700' : d.role === 'admin' ? 'bg-ink-100 text-ink-800' : 'bg-blood-50 text-blood-700',
                )}
              >
                {busy === d.role ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Signing in" />
                ) : (
                  <Icon className="size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-950">{d.label}</span>
                <span className="block truncate text-xs text-ink-500">
                  {d.role === 'hospital' ? 'Live dashboard' : d.role === 'admin' ? 'Stores, dispatch, staff' : 'Order and track'}
                </span>
              </span>
              <ArrowRight className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
            </button>
          )
        })}
      </div>

      <p className="mt-10 text-center text-sm text-ink-600">
        New to RaktFlow?{' '}
        <Link to={signupHref} className="font-semibold text-blood-700 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
