import { useId, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Building2, ChevronDown, Fingerprint, Info, UserRound } from 'lucide-react'
import { AuthShell, safeNext } from '@/components/auth/AuthShell'
import { PasswordInput, PasswordStrengthMeter } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { signup } from '@/services/auth'
import { ApiError } from '@/services/api'
import { hospitalById, hospitalsInCity } from '@/data/network'
import { citiesByState, cityById } from '@/data/cities'
import { useCity } from '@/services/location'
import { BRAND, DEMO_MODE } from '@/config/brand'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'city' | 'hospital' | 'registrationNo' | 'consent', string>>

const CITY_GROUPS = citiesByState()

const ROLES: { value: Role; label: string; icon: typeof UserRound; hint: string }[] = [
  { value: 'individual', label: 'Patient / family', icon: UserRound, hint: 'Order for someone admitted at a partner hospital' },
  { value: 'hospital', label: 'Hospital', icon: Building2, hint: 'Blood bank desk, ICU or OT coordinator' },
]

export default function Signup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))

  const [role, setRole] = useState<Role>(params.get('role') === 'hospital' ? 'hospital' : 'individual')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  // Start from wherever the visitor is browsing; they can change it.
  const [cityId, setCityId] = useState(useCity().id)
  const [hospitalId, setHospitalId] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const noticeId = useId()
  const strengthId = useId()

  const hospital = hospitalId ? hospitalById(hospitalId) : undefined
  const cityHospitals = useMemo(() => hospitalsInCity(cityId), [cityId])
  const isHospital = role === 'hospital'

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = isHospital ? 'Enter the account name.' : 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.'
    const digits = phone.replace(/\D/g, '')
    if (!(isHospital ? /^\d{10,11}$/ : /^[6-9]\d{9}$/).test(digits)) e.phone = 'Enter a valid 10-digit number.'
    if (password.length < 8) e.password = 'Use at least 8 characters.'
    if (!cityId) e.city = 'Choose your city.'
    if (isHospital && !hospitalId) e.hospital = 'Select your facility.'
    if (isHospital && registrationNo.trim().length < 4) e.registrationNo = 'Enter the registration number on your certificate.'
    if (!consent) e.consent = 'Please accept the Terms and Privacy Policy to continue.'
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    setFormError(null)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const u = await signup({
        role,
        name,
        email,
        phone,
        password,
        cityId,
        hospitalId: isHospital ? hospitalId : undefined,
        registrationNo: isHospital ? registrationNo : undefined,
      })
      toast.success('Account created', isHospital ? 'Your hospital dashboard is ready.' : `Welcome to ${BRAND.name}, ${u.name.split(' ')[0]}.`)
      navigate(isHospital ? '/hospital' : (next ?? '/order'), { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))

  const onPickHospital = (id: string) => {
    const prev = hospitalById(hospitalId)
    setHospitalId(id)
    clear('hospital')
    // Pre-fill the account name with the facility name unless the user typed their own.
    if (!name.trim() || name === prev?.name) setName(hospitalById(id)?.name ?? '')
  }

  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ''}`

  const collected = useMemo(
    () =>
      isHospital
        ? [
            ['Facility, registration number, contact name', 'To verify you are a registered clinical establishment before orders are released.'],
            ['Email and phone', 'For order updates, rider handover calls and invoices.'],
            ['Patient and prescriber details you enter on orders', "So the blood centre can check the doctor's requisition. Kept as long as the law requires for transfusion records."],
          ]
        : [
            ['Name, email and phone', 'To create your account and send order and delivery updates.'],
            ['Patient and prescriber details you enter on orders', "So the blood centre can check the doctor's requisition. Kept as long as the law requires for transfusion records."],
            ['Payment references (never full card numbers)', 'To confirm payment and process refunds.'],
          ],
    [isHospital],
  )

  return (
    <AuthShell
      eyebrow="Create account"
      title={isHospital ? 'Register your hospital' : 'Create your account'}
      description={
        isHospital
          ? 'Get one-tap emergency ordering, a live delivery board and audit-ready cold-chain logs.'
          : 'Takes a minute. You will need it to place and track orders for a patient.'
      }
      panelTitle={
        <>
          Built for the <span className="text-blood-400">worst minute</span> of someone's day.
        </>
      }
    >
      <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-2 rounded-3xl bg-ink-50 p-1.5">
        {ROLES.map((r) => {
          const active = role === r.value
          return (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setRole(r.value)
                setErrors({})
                setFormError(null)
              }}
              className={cn(
                'relative flex flex-col items-start gap-1 rounded-[1.1rem] px-3 py-3 text-left transition-colors sm:px-4',
                active ? 'text-ink-950' : 'text-ink-500 hover:text-ink-800',
              )}
            >
              {active && (
                <motion.span
                  layoutId="signup-role"
                  className="absolute inset-0 rounded-[1.1rem] bg-white shadow-soft ring-1 ring-ink-100"
                  transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                />
              )}
              <span className="relative flex items-center gap-2 text-sm font-semibold">
                <r.icon className={cn('size-4', active && (r.value === 'hospital' ? 'text-ice-600' : 'text-blood-600'))} />
                {r.label}
              </span>
              <span className="relative hidden text-xs leading-snug sm:block">{r.hint}</span>
            </button>
          )
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <Field
          label="Your city"
          required
          error={errors.city}
          hint={`We show stores, stock and hospitals in ${cityById(cityId).name}. You can change it any time from the location bar.`}
        >
          {(id) => (
            <Select
              id={id}
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value)
                // A facility belongs to one city.
                if (hospitalById(hospitalId)?.cityId !== e.target.value) setHospitalId('')
                clear('city')
              }}
              aria-invalid={!!errors.city || undefined}
            >
              {CITY_GROUPS.map((g) => (
                <optgroup key={g.state} label={g.state}>
                  {g.cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          )}
        </Field>
        <AnimatePresence initial={false}>
          {isHospital && (
            <motion.div
              key="hospital-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="flex flex-col gap-5 pb-1">
                <Field label="Your facility" required error={errors.hospital} hint="Only registered partner hospitals and nursing homes can receive deliveries.">
                  {(id) => (
                    <Select id={id} value={hospitalId} onChange={(e) => onPickHospital(e.target.value)} aria-invalid={!!errors.hospital || undefined}>
                      <option value="">Select hospital or nursing home</option>
                      {cityHospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} · {h.area}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  label="Clinical Establishment registration no."
                  required
                  error={errors.registrationNo}
                  hint="As printed on your registration certificate."
                >
                  {(id) => (
                    <Input
                      id={id}
                      value={registrationNo}
                      onChange={(e) => {
                        setRegistrationNo(e.target.value)
                        clear('registrationNo')
                      }}
                      placeholder="e.g. DL-CE-1101"
                      autoComplete="off"
                      aria-invalid={!!errors.registrationNo || undefined}
                    />
                  )}
                </Field>
                {hospital && DEMO_MODE && registrationNo !== hospital.registrationNo && (
                  <button
                    type="button"
                    className="-mt-3 self-start rounded-full bg-ice-50 px-3 py-1.5 text-xs font-semibold text-ice-700 ring-1 ring-ice-100 transition hover:bg-ice-100"
                    onClick={() => {
                      setRegistrationNo(hospital.registrationNo)
                      clear('registrationNo')
                    }}
                  >
                    Use demo record {hospital.registrationNo}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          label={isHospital ? 'Account name' : 'Full name'}
          required
          error={errors.name}
          hint={isHospital ? 'Shown on orders and in the navigation. Usually the facility name.' : undefined}
        >
          {(id) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clear('name')
              }}
              autoComplete={isHospital ? 'organization' : 'name'}
              placeholder={isHospital ? 'CityCare Multispeciality Hospital' : 'Aarav Sharma'}
              aria-invalid={!!errors.name || undefined}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={isHospital ? 'Work email' : 'Email'} required error={errors.email}>
            {(id) => (
              <Input
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clear('email')
                }}
                placeholder={isHospital ? 'bloodbank@hospital.in' : 'you@example.com'}
                aria-invalid={!!errors.email || undefined}
              />
            )}
          </Field>
          <Field label={isHospital ? 'Desk phone' : 'Mobile number'} required error={errors.phone}>
            {(id) => (
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-ink-500">+91</span>
                <Input
                  id={id}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 13))
                    clear('phone')
                  }}
                  placeholder="98765 43210"
                  className="pl-13"
                  aria-invalid={!!errors.phone || undefined}
                />
              </div>
            )}
          </Field>
        </div>

        <Field label="Password" required error={errors.password}>
          {(id) => (
            <div className="flex flex-col gap-2.5">
              <PasswordInput
                id={id}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clear('password')
                }}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password || undefined}
                aria-describedby={strengthId}
              />
              <PasswordStrengthMeter password={password} id={strengthId} />
            </div>
          )}
        </Field>

        {/* DPDP-style notice */}
        <div className="rounded-3xl border border-ink-100 bg-paper">
          <button
            type="button"
            onClick={() => setShowNotice((s) => !s)}
            aria-expanded={showNotice}
            aria-controls={noticeId}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-ink-700 shadow-soft">
              <Fingerprint className="size-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-ink-950">What we collect and why</span>
              <span className="block text-xs text-ink-500">Notice under the Digital Personal Data Protection Act, 2023</span>
            </span>
            <ChevronDown className={cn('size-4 text-ink-400 transition-transform', showNotice && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {showNotice && (
              <motion.div
                id={noticeId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 px-4 pb-4 text-sm text-ink-600">
                  <ul className="space-y-2.5">
                    {collected.map(([what, why]) => (
                      <li key={what} className="rounded-2xl bg-white p-3">
                        <p className="font-medium text-ink-900">{what}</p>
                        <p className="mt-0.5 text-xs">{why}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs">
                    We do not sell your data or use it for advertising. You can download your data, correct it or delete your account at any
                    time from <span className="font-medium text-ink-800">Account › Your data &amp; privacy</span>, and withdraw consent the same
                    way. Questions or complaints: {BRAND.grievanceOfficer}, {BRAND.supportEmail}.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <Checkbox
            checked={consent}
            onChange={(v) => {
              setConsent(v)
              clear('consent')
            }}
          >
            I agree to the{' '}
            <Link to="/legal/terms" target="_blank" className="font-semibold text-ink-950 underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/legal/privacy" target="_blank" className="font-semibold text-ink-950 underline underline-offset-2">
              Privacy Policy
            </Link>
            , and consent to {BRAND.name} processing the data above for these purposes.
          </Checkbox>
          {errors.consent && (
            <p className="mt-2 pl-8 text-xs font-medium text-blood-700" role="alert">
              {errors.consent}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-blood-50 px-4 py-3 text-sm font-medium text-blood-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={busy} className="w-full">
          {isHospital ? 'Register hospital' : 'Create account'}
        </Button>

        {isHospital && DEMO_MODE && (
          <p className="flex items-start gap-2 text-xs text-ink-500">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            In this prototype hospitals are verified instantly. At launch, accounts stay in review until our team checks your registration
            certificate and signatory ID.
          </p>
        )}
      </form>

      <p className="mt-10 text-center text-sm text-ink-600">
        Already have an account?{' '}
        <Link to={loginHref} className="font-semibold text-blood-700 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
