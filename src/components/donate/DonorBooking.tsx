import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, Check, Clock, Droplet, ExternalLink, MapPin, Plus, Star, Utensils } from 'lucide-react'
import type { BloodGroup, DonorProfile } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge, Field, Input } from '@/components/ui/primitives'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { toast } from '@/components/ui/Toast'
import { useCityCentres } from '@/services/inventory'
import { registerDonor } from '@/services/donors'
import { useCurrentUser } from '@/services/auth'
import { ApiError } from '@/services/api'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { DonorCard } from './DonorCard'
import type { EligibilityPrefill } from './EligibilityChecker'
import { bookingRef, downloadIcs, googleCalendarUrl, isSlotPast, isoDay, makeSlot, nextDays, slotsFor } from './slots'

type Errors = Partial<Record<'centre' | 'day' | 'time' | 'name' | 'phone' | 'group' | 'age' | 'weight' | 'lastDonation', string>>

const MIN_GAP_DAYS = 90

const BEFORE_YOU_GO = [
  'Eat a proper meal 2–3 hours before. Do not come on an empty stomach.',
  'Drink an extra 500 ml of water. Skip alcohol for 24 hours before.',
  'Carry a government photo ID and a list of any medicines you take.',
  'Wear a shirt with sleeves that roll up above the elbow.',
]

function StepLabel({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
          done ? 'bg-blood-600 text-white' : 'bg-ink-950 text-white',
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
      </span>
      <h3 className="font-sans text-base font-semibold text-ink-950">{title}</h3>
    </div>
  )
}

export function DonorBooking({ prefill }: { prefill: (EligibilityPrefill & { nonce: number }) | null }) {
  // Donors book at centres in their own city.
  const centres = useCityCentres()
  const user = useCurrentUser()
  const rootRef = useRef<HTMLDivElement>(null)

  const [centreId, setCentreId] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState(user?.role === 'individual' ? user.name : '')
  const [phone, setPhone] = useState(user?.role === 'individual' ? user.phone : '')
  const [group, setGroup] = useState<BloodGroup | null>(null)
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [lastDonation, setLastDonation] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [booked, setBooked] = useState<DonorProfile | null>(null)

  // Carry answers over from the eligibility checker.
  useEffect(() => {
    if (!prefill) return
    setAge(String(prefill.age))
    setWeight(String(prefill.weightKg))
    setLastDonation(prefill.lastDonation ?? '')
    setBooked(null)
  }, [prefill])

  const centre = centres.find((c) => c.id === centreId)
  const days = useMemo(() => nextDays(7), [])
  const open24x7 = centre?.open24x7
  const times = useMemo(() => slotsFor(open24x7 === undefined ? undefined : { open24x7 }), [open24x7])
  const now = Date.now()

  // Drop a chosen time that the newly selected centre/day doesn't offer.
  useEffect(() => {
    if (time && (!times.includes(time) || (day && isSlotPast(day, time)))) setTime('')
  }, [times, time, day])

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))

  const validate = (): Errors => {
    const e: Errors = {}
    if (!centreId) e.centre = 'Choose a blood centre.'
    if (!day) e.day = 'Choose a date.'
    if (!time) e.time = 'Choose a time.'
    if (name.trim().length < 2) e.name = 'Enter your full name.'
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Enter a valid 10-digit mobile number.'
    if (!group) e.group = 'Choose your blood group.'
    const a = Number(age)
    if (!age || a < 18 || a > 65) e.age = 'Donors must be 18 to 65 years old.'
    const w = Number(weight)
    if (!weight || w < 45 || w > 250) e.weight = 'Minimum weight is 45 kg.'
    if (lastDonation) {
      if (lastDonation > isoDay(new Date())) e.lastDonation = 'This date is in the future.'
      else if (day) {
        const next = new Date(`${lastDonation}T00:00:00`)
        next.setDate(next.getDate() + MIN_GAP_DAYS)
        if (isoDay(next) > day)
          e.lastDonation = `At least ${MIN_GAP_DAYS} days are needed between donations. Pick a date from ${next.toLocaleDateString(BRAND.locale, { day: 'numeric', month: 'short' })}.`
      }
    }
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      toast.error('Please check the highlighted fields')
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const donor = await registerDonor({
        name,
        phone,
        bloodGroup: group!,
        age: Number(age),
        weightKg: Number(weight),
        lastDonation: lastDonation || undefined,
        centreId,
        slot: makeSlot(day, time),
      })
      setBooked(donor)
      toast.success('Slot booked', `${centre?.name ?? 'Your centre'} is expecting you.`)
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not book the slot. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const bookAnother = () => {
    setBooked(null)
    setDay('')
    setTime('')
    setErrors({})
  }

  return (
    <div ref={rootRef} className="scroll-mt-28">
      <AnimatePresence mode="wait" initial={false}>
        {booked ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <DonorCard donor={booked} centre={centre} className="mx-auto w-full max-w-md" />
            <div>
              <Badge tone="green">
                <Check className="size-3.5" strokeWidth={3} /> Booking confirmed · {bookingRef(booked)}
              </Badge>
              <h3 className="mt-4 text-3xl font-bold sm:text-4xl">Thank you, {booked.name.split(' ')[0]}.</h3>
              <p className="mt-3 text-lg text-ink-600">
                {centre ? `${centre.name}${centre.name.includes(centre.area) ? '' : ` in ${centre.area}`}` : 'The centre'} is expecting you.
                Plan for about 45 minutes. Show this pass or quote the booking ID at the registration desk.
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => downloadIcs(booked, centre)} icon={<CalendarPlus className="size-4" />} variant="dark">
                  Add to calendar (.ics)
                </Button>
                <a
                  href={googleCalendarUrl(booked, centre)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-5 text-sm font-semibold text-ink-900 transition hover:border-ink-300 hover:bg-ink-50"
                >
                  Google Calendar <ExternalLink className="size-3.5" />
                </a>
              </div>

              <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <Utensils className="size-4 text-blood-600" /> Before you go
                </p>
                <ul className="mt-3 space-y-2">
                  {BEFORE_YOU_GO.map((t) => (
                    <li key={t} className="flex gap-2.5 text-sm text-ink-600">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="ghost" className="mt-4" onClick={bookAnother} icon={<Plus className="size-4" />}>
                Book another slot
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8"
          >
            {/* Where & when */}
            <div className="flex flex-col gap-8 rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8">
              <section className="flex flex-col gap-4" aria-labelledby="pick-centre">
                <div id="pick-centre">
                  <StepLabel n={1} title="Choose a blood centre" done={!!centreId} />
                </div>
                <div role="radiogroup" aria-labelledby="pick-centre" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {centres.map((c) => {
                    const active = c.id === centreId
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-invalid={(!!errors.centre && !centreId) || undefined}
                        onClick={() => {
                          setCentreId(c.id)
                          clear('centre')
                        }}
                        className={cn(
                          'group relative flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition',
                          active ? 'border-blood-600 bg-blood-50/60 ring-4 ring-blood-100' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50',
                        )}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm leading-snug font-semibold text-ink-950">{c.name}</span>
                          <span
                            className={cn(
                              'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition',
                              active ? 'border-blood-600 bg-blood-600 text-white' : 'border-ink-300',
                            )}
                            aria-hidden
                          >
                            {active && <Check className="size-3" strokeWidth={3} />}
                          </span>
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" /> {c.area}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {c.rating.toFixed(1)}
                          </span>
                          {c.open24x7 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <Clock className="size-3.5" /> 24×7
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" /> Day hours
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.centre && (
                  <p className="text-xs font-medium text-blood-700" role="alert">
                    {errors.centre}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-4" aria-labelledby="pick-day">
                <div id="pick-day">
                  <StepLabel n={2} title="Pick a day" done={!!day} />
                </div>
                <div role="radiogroup" aria-labelledby="pick-day" className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {days.map((d) => {
                    const active = d.iso === day
                    const full = times.every((t) => isSlotPast(d.iso, t, now))
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={full}
                        aria-label={`${d.date.toLocaleDateString(BRAND.locale, { weekday: 'long', day: 'numeric', month: 'long' })}${full ? ', no slots left' : ''}`}
                        aria-invalid={(!!errors.day && !day) || undefined}
                        onClick={() => {
                          setDay(d.iso)
                          clear('day')
                        }}
                        className={cn(
                          'flex flex-col items-center rounded-2xl border py-2.5 transition disabled:cursor-not-allowed disabled:opacity-40',
                          active ? 'border-ink-950 bg-ink-950 text-white shadow-soft' : 'border-ink-200 bg-white text-ink-900 hover:border-ink-300',
                        )}
                      >
                        <span className={cn('text-[10px] font-semibold uppercase sm:text-[11px] sm:tracking-wide', active ? 'text-white/70' : 'text-ink-500')}>
                          {d.index === 0 ? 'Today' : d.date.toLocaleDateString(BRAND.locale, { weekday: 'short' })}
                        </span>
                        <span className="font-display text-lg leading-tight font-bold sm:text-xl">{d.date.getDate()}</span>
                        <span className={cn('text-[10px] sm:text-[11px]', active ? 'text-white/70' : 'text-ink-400')}>
                          {d.date.toLocaleDateString(BRAND.locale, { month: 'short' })}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.day && (
                  <p className="text-xs font-medium text-blood-700" role="alert">
                    {errors.day}
                  </p>
                )}
              </section>

              <section className="flex flex-col gap-4" aria-labelledby="pick-time">
                <div id="pick-time" className="flex items-center justify-between gap-3">
                  <StepLabel n={3} title="Pick a time" done={!!time} />
                  {centre?.open24x7 && <span className="text-xs text-ink-500">Evening slots at 24×7 centres</span>}
                </div>
                <div role="radiogroup" aria-labelledby="pick-time" className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {times.map((t) => {
                    const past = !!day && isSlotPast(day, t, now)
                    const active = t === time
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={past || !day}
                        aria-invalid={(!!errors.time && !time) || undefined}
                        onClick={() => {
                          setTime(t)
                          clear('time')
                        }}
                        className={cn(
                          'h-11 rounded-xl border text-sm font-semibold tabular transition disabled:cursor-not-allowed disabled:opacity-35',
                          active ? 'border-blood-600 bg-blood-600 text-white shadow-glow' : 'border-ink-200 bg-white text-ink-900 hover:border-blood-300 hover:bg-blood-50',
                        )}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
                {!day ? (
                  <p className="text-xs text-ink-500">Choose a day to see open times.</p>
                ) : errors.time ? (
                  <p className="text-xs font-medium text-blood-700" role="alert">
                    {errors.time}
                  </p>
                ) : null}
              </section>
            </div>

            {/* About you */}
            <div className="flex flex-col gap-5 rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-8 lg:self-start">
              <StepLabel n={4} title="About you" done={false} />
              <Field label="Full name" required error={errors.name}>
                {(id) => (
                  <Input
                    id={id}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      clear('name')
                    }}
                    placeholder="As on your photo ID"
                    aria-invalid={!!errors.name || undefined}
                  />
                )}
              </Field>
              <Field label="Mobile number" required error={errors.phone} hint="The centre sends a reminder and may call to reschedule.">
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
                        setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))
                        clear('phone')
                      }}
                      placeholder="98765 43210"
                      className="pl-13"
                      aria-invalid={!!errors.phone || undefined}
                    />
                  </div>
                )}
              </Field>

              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-ink-800">
                  Blood group <span className="text-blood-600">*</span>
                </p>
                <BloodGroupPicker
                  value={group}
                  onChange={(g) => {
                    setGroup(g)
                    clear('group')
                  }}
                />
                {errors.group ? (
                  <p className="text-xs font-medium text-blood-700" role="alert">
                    {errors.group}
                  </p>
                ) : (
                  <p className="text-xs text-ink-500">Every donation is tested again at the centre.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" required error={errors.age}>
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={65}
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value)
                        clear('age')
                      }}
                      placeholder="Years"
                      aria-invalid={!!errors.age || undefined}
                    />
                  )}
                </Field>
                <Field label="Weight (kg)" required error={errors.weight}>
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      min={45}
                      value={weight}
                      onChange={(e) => {
                        setWeight(e.target.value)
                        clear('weight')
                      }}
                      placeholder="kg"
                      aria-invalid={!!errors.weight || undefined}
                    />
                  )}
                </Field>
              </div>
              <Field label="Last donation (if any)" error={errors.lastDonation}>
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    max={isoDay(new Date())}
                    value={lastDonation}
                    onChange={(e) => {
                      setLastDonation(e.target.value)
                      clear('lastDonation')
                    }}
                    aria-invalid={!!errors.lastDonation || undefined}
                  />
                )}
              </Field>

              <div className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">
                {centre && day && time ? (
                  <p className="flex items-start gap-2">
                    <Droplet className="mt-0.5 size-4 shrink-0 text-blood-600" />
                    <span>
                      <span className="font-semibold text-ink-950">{centre.name}</span> ·{' '}
                      {new Date(`${day}T00:00:00`).toLocaleDateString(BRAND.locale, { weekday: 'short', day: 'numeric', month: 'short' })} at{' '}
                      {time}
                    </span>
                  </p>
                ) : (
                  <p>Pick a centre, day and time to see your booking summary.</p>
                )}
              </div>

              <Button type="submit" size="lg" loading={busy} className="w-full">
                Confirm booking
              </Button>
              <p className="text-xs text-ink-500">
                Free, always. Your details go only to the centre you chose. Final eligibility is decided by the centre's medical officer on the
                day.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
