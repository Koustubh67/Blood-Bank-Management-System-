import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarHeart,
  Droplet,
  LayoutDashboard,
  LogOut,
  MapPin,
  Navigation,
  Package,
  PencilLine,
} from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge, Field, Input } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { BookingList } from '@/components/donate/BookingList'
import { isUpcoming } from '@/components/donate/slots'
import { PrivacyPanel } from '@/components/auth/PrivacyPanel'
import { DarkPill } from '@/components/hospital/DarkPill'
import { logout, updateProfile, useCurrentUser } from '@/services/auth'
import { useMyOrders, ACTIVE_STATUSES, liveStatus } from '@/services/orders'
import { useMyDonations } from '@/services/donors'
import { ApiError } from '@/services/api'
import { hospitalById } from '@/data/network'
import { cityById } from '@/data/cities'
import { BRAND } from '@/config/brand'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (/^[6-9]\d{9}$/.test(d)) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
  // Landline with STD code, e.g. 11 4000 0000
  if (d.length === 10) return `+91 ${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`
  return d
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="min-w-0 truncate text-[15px] font-medium text-ink-950 sm:text-right">{children}</dd>
    </div>
  )
}

function ProfileCard({ user, editing, setEditing }: { user: User; editing: boolean; setEditing: (v: boolean) => void }) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [busy, setBusy] = useState(false)

  // Start every edit from the saved values, however editing was opened.
  useEffect(() => {
    if (!editing) return
    setName(user.name)
    setPhone(user.phone)
    setErrors({})
  }, [editing, user.name, user.phone])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (name.trim().length < 2) errs.name = 'Enter at least 2 characters.'
    const digits = phone.replace(/\D/g, '')
    if (!(user.role === 'hospital' ? /^\d{10,11}$/ : /^[6-9]\d{9}$/).test(digits)) errs.phone = 'Enter a valid 10-digit number.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      await updateProfile({ name: name.trim(), phone: digits })
      toast.success('Profile updated')
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save your changes.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="profile" aria-labelledby="profile-h" className="scroll-mt-28 rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 id="profile-h" className="font-sans text-lg font-semibold">
          Profile
        </h2>
        {!editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} icon={<PencilLine className="size-4" />}>
            Edit
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.form
            key="edit"
            onSubmit={save}
            noValidate
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-5 flex flex-col gap-4"
          >
            <Field label={user.role === 'hospital' ? 'Account name' : 'Full name'} error={errors.name}>
              {(id) => (
                <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name || undefined} autoFocus />
              )}
            </Field>
            <Field label="Phone" error={errors.phone}>
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 13))}
                  autoComplete="tel-national"
                  aria-invalid={!!errors.phone || undefined}
                />
              )}
            </Field>
            <Field label="Email" hint={`To change your email, write to ${BRAND.supportEmail}.`}>
              {(id) => <Input id={id} value={user.email} disabled readOnly />}
            </Field>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Save changes
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.dl key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 divide-y divide-ink-100">
            <Row label={user.role === 'hospital' ? 'Account name' : 'Name'}>{user.name}</Row>
            <Row label="Email">{user.email}</Row>
            <Row label="Phone">{formatPhone(user.phone)}</Row>
            <Row label="Account type">{user.role === 'hospital' ? 'Hospital' : 'Patient / family'}</Row>
            <Row label="Member since">{new Date(user.createdAt).toLocaleDateString(BRAND.locale, { day: 'numeric', month: 'long', year: 'numeric' })}</Row>
          </motion.dl>
        )}
      </AnimatePresence>
    </section>
  )
}

function FacilityCard({ user }: { user: User }) {
  const h = user.hospitalId ? hospitalById(user.hospitalId) : undefined
  return (
    <section aria-labelledby="facility-h" className="relative isolate overflow-hidden rounded-4xl bg-ink-950 p-5 text-white shadow-soft sm:p-7">
      <div className="absolute -top-24 -right-16 -z-10 size-64 rounded-full bg-ice-600/30 blur-3xl" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="facility-h" className="font-sans text-lg font-semibold text-white">
          Facility
        </h2>
        {user.verified ? (
          <DarkPill className="bg-emerald-400/15 text-emerald-300 ring-emerald-400/30">
            <BadgeCheck className="size-3.5" /> Verified partner
          </DarkPill>
        ) : (
          <DarkPill className="bg-amber-400/15 text-amber-200 ring-amber-400/30">Verification pending</DarkPill>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold sm:text-3xl">{h?.name ?? user.name}</p>
      {h && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-300">
          <MapPin className="size-4" /> {h.area}, {cityById(h.cityId).name}
        </p>
      )}
      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <dt className="text-xs text-ink-400">Registration no.</dt>
          <dd className="mt-1 text-sm font-semibold wrap-break-word">{user.registrationNo ?? h?.registrationNo ?? '—'}</dd>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <dt className="text-xs text-ink-400">Beds</dt>
          <dd className="mt-1 text-sm font-semibold">{h?.beds ?? '—'}</dd>
        </div>
      </dl>
      <ButtonLink to="/hospital" variant="white" size="sm" className="mt-6" icon={<LayoutDashboard className="size-4" />}>
        Open dashboard
      </ButtonLink>
    </section>
  )
}

export default function Account() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const orders = useMyOrders()
  const donations = useMyDonations()
  const [editing, setEditing] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const activeCount = useMemo(() => {
    const now = Date.now()
    return orders.filter((o) => ACTIVE_STATUSES.includes(liveStatus(o, now))).length
  }, [orders])
  const upcomingDonations = useMemo(() => donations.filter((d) => isUpcoming(d)).length, [donations])

  if (!user) return null
  const isHospital = user.role === 'hospital'

  const signOut = () => {
    logout()
    toast.info('Signed out')
    navigate('/', { replace: true })
  }

  const editProfile = () => {
    setEditing(true)
    profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const links = [
    ...(isHospital ? [{ to: '/hospital', icon: LayoutDashboard, title: 'Hospital dashboard', sub: 'Live board, one-tap orders' }] : []),
    { to: '/orders', icon: Package, title: isHospital ? 'Orders to your facility' : 'My orders', sub: `${orders.length} total${activeCount ? ` · ${activeCount} active` : ''}` },
    { to: '/track', icon: Navigation, title: 'Track a delivery', sub: activeCount ? `${activeCount} on the way now` : 'Live map and ETA' },
    { to: '/donate', icon: Droplet, title: 'Donate blood', sub: upcomingDonations ? `${upcomingDonations} upcoming booking${upcomingDonations === 1 ? '' : 's'}` : 'Book a slot near you' },
  ]

  return (
    <>
      <div className="border-b border-ink-100 bg-white">
        <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            <span
              className={cn(
                'grid size-16 shrink-0 place-items-center rounded-3xl font-display text-2xl font-bold text-white sm:size-20 sm:text-3xl',
                isHospital ? 'bg-ink-950 shadow-soft' : 'bg-blood-600 shadow-glow',
              )}
              aria-hidden
            >
              {isHospital ? <Building2 className="size-8" /> : user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="eyebrow">Your account</p>
              <h1 className="mt-1.5 text-3xl leading-[1.05] font-bold wrap-break-word sm:text-5xl">{user.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                <Badge tone={isHospital ? 'blue' : 'red'}>{isHospital ? 'Hospital' : 'Patient / family'}</Badge>
                <span>
                  Member since {new Date(user.createdAt).toLocaleDateString(BRAND.locale, { month: 'long', year: 'numeric' })}
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} icon={<LogOut className="size-4" />} className="self-start sm:self-auto">
            Sign out
          </Button>
        </div>
      </div>

      <div className="container-page grid grid-cols-1 gap-4 py-8 sm:gap-6 sm:py-12 lg:grid-cols-12">
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-7">
          <div ref={profileRef} className="scroll-mt-28">
            <ProfileCard key={user.id} user={user} editing={editing} setEditing={setEditing} />
          </div>
          {isHospital && <FacilityCard user={user} />}

          <section aria-labelledby="donations-h" className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="donations-h" className="flex items-center gap-2 font-sans text-lg font-semibold">
                <CalendarHeart className="size-5 text-blood-600" /> Donation bookings
              </h2>
              <Link to="/donate#book" className="text-sm font-semibold text-ink-700 underline-offset-4 hover:text-ink-950 hover:underline">
                Book a slot
              </Link>
            </div>
            {donations.length ? (
              <BookingList bookings={donations} compact />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 px-5 py-8 text-center">
                <Droplet className="size-6 text-blood-500" />
                <p className="max-w-xs text-sm text-ink-600">No bookings yet. One donation can go on to help up to three patients.</p>
                <ButtonLink to="/donate" size="sm" variant="secondary">
                  Become a donor
                </ButtonLink>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-5">
          <nav aria-label="Quick links" className="rounded-4xl border border-ink-100 bg-white p-2 shadow-soft">
            <ul>
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="group flex items-center gap-4 rounded-3xl p-3 transition hover:bg-paper sm:p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink-50 text-ink-700 transition-colors group-hover:bg-blood-600 group-hover:text-white">
                      <l.icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink-950">{l.title}</span>
                      <span className="block truncate text-sm text-ink-500">{l.sub}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-900" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <PrivacyPanel user={user} onEditProfile={editProfile} />
        </div>
      </div>
    </>
  )
}
