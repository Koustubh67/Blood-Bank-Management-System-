import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { CalendarPlus, Check, CircleCheck, Clock, ExternalLink, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react'
import type { BloodGroup, CampPledge, DonationCamp } from '@/types'
import { campRegistrationUrl, pledgeForCamp, useCampPledgeCounts } from '@/services/camps'
import { useCurrentUser } from '@/services/auth'
import { ApiError } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Button, buttonClass } from '@/components/ui/Button'
import { Badge, Field, Input } from '@/components/ui/primitives'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { toast } from '@/components/ui/Toast'
import { Person } from '@/components/characters/Person'
import { EASE_OUT } from '@/components/home/Reveal'
import { BRAND } from '@/config/brand'
import { DateTile } from './DateTile'
import { campCalendarUrl, campTimeRange, directionsUrl, phoneLink } from './format'
import { playSound } from '@/lib/sound'

type Errors = Partial<Record<'name' | 'phone', string>>

const ELIGIBILITY = [
  'Aged 18 to 65',
  'Weigh at least 45 kg',
  '90 days since your last donation (120 for women)',
  'Feeling well on the day',
]

/** Pledge to give blood at a camp; ends in a thank-you with next steps. */
export function PledgeModal({ camp, onClose }: { camp: DonationCamp | null; onClose: () => void }) {
  // Keep showing the last camp while the sheet animates out.
  const [shown, setShown] = useState(camp)
  if (camp && camp !== shown) setShown(camp)
  const [busy, setBusy] = useState(false)

  return (
    <Modal open={!!camp} onClose={onClose} dismissible={!busy} className="max-h-[92dvh] overflow-y-auto overscroll-contain sm:max-h-[90dvh]">
      {shown && <PledgeBody key={shown.id} camp={shown} onBusy={setBusy} onClose={onClose} />}
    </Modal>
  )
}

function CampSummary({ camp }: { camp: DonationCamp }) {
  return (
    <div className="flex gap-4 rounded-3xl bg-paper p-4 ring-1 ring-ink-100">
      <DateTile iso={camp.date} tone="white" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-ink-950 wrap-anywhere">{camp.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-ink-600 tabular">
          <Clock className="size-3.5 shrink-0 text-ink-400" aria-hidden /> {campTimeRange(camp)}
        </p>
        <p className="mt-0.5 flex gap-1.5 text-ink-600">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-400" aria-hidden />
          <span className="min-w-0 wrap-anywhere">
            {camp.venue}
            {camp.district && !camp.venue.toLowerCase().includes(camp.district.toLowerCase()) && `, ${camp.district}`}
          </span>
        </p>
      </div>
    </div>
  )
}

function PledgeBody({ camp, onBusy, onClose }: { camp: DonationCamp; onBusy: (b: boolean) => void; onClose: () => void }) {
  const user = useCurrentUser()
  const counts = useCampPledgeCounts()
  const rootRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)

  const [name, setName] = useState(user?.role === 'individual' ? user.name : '')
  const [phone, setPhone] = useState(user?.role === 'individual' ? user.phone : '')
  const [group, setGroup] = useState<BloodGroup | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<CampPledge | null>(null)

  // Move focus into the sheet. Skip the input on touch screens so the keyboard doesn't cover the summary.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches && !name) nameRef.current?.focus()
    else rootRef.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (done) doneRef.current?.focus()
  }, [done])

  const clear = (k: keyof Errors) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }))

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = 'Enter your full name.'
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) e.phone = 'Enter a valid 10-digit mobile number.'
    return e
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    onBusy(true)
    try {
      setDone(await pledgeForCamp(camp, { name, phone, bloodGroup: group ?? undefined }))
      playSound('order')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save your pledge. Please try again.')
    } finally {
      setBusy(false)
      onBusy(false)
    }
  }

  if (done) {
    const count = counts[camp.id] ?? 1
    const contact = camp.contact ? phoneLink(camp.contact) : null
    return (
      <div ref={rootRef} tabIndex={-1} className="outline-none">
        <div className="relative isolate -mx-6 -mt-6 overflow-hidden rounded-t-4xl px-6 pt-8 pb-2 text-center sm:-mx-8 sm:-mt-8 sm:px-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(60% 70% at 50% 0%, var(--color-blood-50), transparent 75%)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 170 }}
            className="mx-auto w-fit"
          >
            <Person who="priya" mood="happy" badge="heart" backdrop="var(--color-blood-50)" className="w-24 sm:w-28" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}>
            <Badge tone="green" className="mt-3">
              <Check className="size-3.5" strokeWidth={3} aria-hidden /> Pledge counted
            </Badge>
            <h2 ref={doneRef} tabIndex={-1} className="mt-3 text-3xl font-bold outline-none">
              Thank you, {done.name.split(' ')[0]}.
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-ink-600">
              {count > 1
                ? `You and ${count - 1} other${count === 2 ? '' : 's'} have pledged for this camp via ${BRAND.name}.`
                : `You're the first to pledge for this camp via ${BRAND.name}.`}{' '}
              It now counts towards our community totals.
            </p>
          </motion.div>
        </div>

        <div className="mt-5">
          <CampSummary camp={camp} />
        </div>

        {/* The camp only sees registrations made on the official portal */}
        <div className="mt-4 rounded-3xl bg-blood-50 p-5 ring-1 ring-blood-100">
          {camp.portalRegistration ? (
            <>
              <p className="flex items-center gap-2 font-semibold text-blood-800">
                <ShieldCheck className="size-4.5 shrink-0" aria-hidden /> One more step: let the camp know
              </p>
              <p className="mt-1.5 text-sm text-blood-950/75">
                Your pledge is counted here, but organisers only see registrations made on e-RaktKosh. Pre-registering takes a minute and
                tells them to expect you.
              </p>
              <a
                href={campRegistrationUrl(camp.id)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ className: 'mt-4 w-full' })}
              >
                Pre-register on e-RaktKosh <ExternalLink className="size-4" aria-hidden />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-semibold text-blood-800">
                <ShieldCheck className="size-4.5 shrink-0" aria-hidden /> Before you go
              </p>
              <p className="mt-1.5 text-sm text-blood-950/75">
                This camp does not take pre-registration on e-RaktKosh, so just walk in on the day.
                {contact ? ' Call the organiser first to confirm the timing.' : ' Timings can change, so check before you set out.'}
              </p>
              {contact && (
                <a href={contact.href} className={buttonClass({ variant: 'dark', className: 'mt-4 w-full' })}>
                  <Phone className="size-4" aria-hidden /> Call {contact.label}
                </a>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a href={campCalendarUrl(camp)} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'outline', className: 'sm:flex-auto' })}>
            <CalendarPlus className="size-4" aria-hidden /> Add to Google Calendar
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={directionsUrl(camp)} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'outline', className: 'sm:flex-auto' })}>
            <Navigation className="size-4" aria-hidden /> Directions
            <span className="sr-only"> (opens Google Maps)</span>
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-ink-500">
          After the camp, come back and tap <span className="font-semibold text-ink-700">I donated</span> so it counts towards lives helped.
        </p>
        <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    )
  }

  return (
    <div ref={rootRef} tabIndex={-1} className="outline-none">
      <h2 className="pr-10 text-2xl font-bold">Pledge to donate</h2>
      <p className="mt-1 text-sm text-ink-600">Tell us you&rsquo;ll be there and we&rsquo;ll count you in.</p>

      <div className="mt-5">
        <CampSummary camp={camp} />
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <Field label="Full name" required error={errors.name}>
          {(id) => (
            <Input
              id={id}
              ref={nameRef}
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
        <Field label="Mobile number" required error={errors.phone} hint="Only used to stop duplicate pledges. We never share it.">
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
            Blood group <span className="font-normal text-ink-500">(optional)</span>
          </p>
          <BloodGroupPicker value={group} onChange={(g) => setGroup((cur) => (cur === g ? null : g))} />
          <p className="text-xs text-ink-500">Not sure? Leave it blank. The camp tests every donation.</p>
        </div>

        <div className="rounded-2xl bg-ice-50/70 p-4 ring-1 ring-ice-100">
          <p className="text-sm font-semibold text-ink-950">You can usually donate if you are</p>
          <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-ink-700 sm:grid-cols-2">
            {ELIGIBILITY.map((t) => (
              <li key={t} className="flex gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-ice-600" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <Link
            to="/donate#eligibility"
            className="mt-3 inline-flex text-sm font-semibold text-ice-700 underline underline-offset-4 hover:text-ink-950"
          >
            Check your eligibility
          </Link>
        </div>

        <Button type="submit" size="lg" loading={busy} className="w-full">
          Count me in
        </Button>
        <p className="text-center text-xs text-ink-500">
          Free and voluntary. The camp&rsquo;s medical officer decides on the day. In this prototype, pledges are stored on this device.
        </p>
      </form>
    </div>
  )
}
