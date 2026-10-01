import { useId, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BedDouble, Building, Check, Hospital, Lock, MapPin, Search, Truck, UserRound, X } from 'lucide-react'
import type { BloodCentre, PartnerHospital } from '@/types'
import { hospitalById, hospitalsInCity } from '@/data/network'
import { useCity } from '@/services/location'
import { Field, Input, Textarea } from '@/components/ui/primitives'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { LiveMap, type MapMarker } from '@/components/map/LiveMap'
import { cn, distanceMeters, formatDistance } from '@/lib/utils'
import type { Draft, Errors, Gender } from './draft'
import { Note, SubHeading } from './parts'

export interface StepProps {
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  errors: Errors
  clearError: (...keys: string[]) => void
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
]

/** Label + error wrapper for controls that are not a single <input>. */
export function GroupField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  children: (labelId: string) => ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-invalid={error ? 'true' : undefined} tabIndex={error ? -1 : undefined}>
      <p id={id} className="text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-blood-600">*</span>}
      </p>
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

export function StepPatient({
  draft,
  setDraft,
  errors,
  clearError,
  fixedHospital,
  centres,
}: StepProps & { fixedHospital?: PartnerHospital; centres: BloodCentre[] }) {
  const city = useCity()
  const cityHospitals = useMemo(() => hospitalsInCity(city.id), [city.id])
  const selected = fixedHospital ?? hospitalById(draft.hospitalId)
  const [browsing, setBrowsing] = useState(!selected)
  const [query, setQuery] = useState('')

  const nearestCentreKm = useMemo(() => {
    const out: Record<string, number> = {}
    const pool = selected && !cityHospitals.includes(selected) ? [...cityHospitals, selected] : cityHospitals
    for (const h of pool) {
      const local = centres.filter((c) => c.cityId === h.cityId)
      out[h.id] = Math.min(...(local.length ? local : centres).map((c) => distanceMeters(c.location, h.location)))
    }
    return out
  }, [centres, cityHospitals, selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cityHospitals
    return cityHospitals.filter((h) => `${h.name} ${h.area}`.toLowerCase().includes(q))
  }, [query, cityHospitals])

  const setPatient = <K extends keyof Draft['patient']>(key: K, value: Draft['patient'][K]) => {
    setDraft((d) => ({ ...d, patient: { ...d.patient, [key]: value } }))
    clearError(`patient.${key}`)
  }

  const chooseHospital = (h: PartnerHospital) => {
    setDraft((d) => ({ ...d, hospitalId: h.id }))
    clearError('hospital')
    setBrowsing(false)
    setQuery('')
  }

  return (
    <div className="space-y-10">
      {/* ---------- Hospital ---------- */}
      <section aria-labelledby="hospital-heading">
        <div id="hospital-heading">
          <SubHeading
            icon={<Hospital className="size-4" />}
            title={fixedHospital ? 'Delivering to your hospital' : 'Where is the patient admitted?'}
            hint={
              fixedHospital
                ? 'Orders from your account always go to your own blood transfusion desk.'
                : `Choose the partner hospital or nursing home in ${city.name}. Units go straight to its blood transfusion desk. Change the city from the location bar at the top.`
            }
          />
        </div>

        <Note tone="ice" icon={<Truck />} className="mb-5">
          We deliver <strong className="font-semibold">only to registered partner hospitals</strong>, never to homes. The rider hands
          the sealed cold box to transfusion-desk staff against a one-time code. The hospital cross-matches before any transfusion.
        </Note>

        {fixedHospital ? (
          <SelectedHospital hospital={fixedHospital} nearestM={nearestCentreKm[fixedHospital.id]} locked />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {!browsing && selected ? (
              <motion.div key="picked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                <SelectedHospital hospital={selected} nearestM={nearestCentreKm[selected.id]} onChange={() => setBrowsing(true)} />
              </motion.div>
            ) : (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                data-invalid={errors.hospital ? 'true' : undefined}
                tabIndex={errors.hospital ? -1 : undefined}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-ink-400" aria-hidden />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by hospital name or area"
                    aria-label="Search partner hospitals"
                    className="pl-11"
                  />
                  {selected && (
                    <button
                      type="button"
                      onClick={() => setBrowsing(false)}
                      className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                      aria-label="Keep current hospital"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                {errors.hospital && (
                  <p className="mt-2 text-xs font-medium text-blood-700" role="alert">
                    {errors.hospital}
                  </p>
                )}
                <div role="radiogroup" aria-label="Partner hospitals" className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {filtered.map((h) => {
                    const on = h.id === draft.hospitalId
                    return (
                      <button
                        key={h.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => chooseHospital(h)}
                        className={cn(
                          'group flex items-start gap-3 rounded-2xl border bg-white p-3.5 text-left transition-all',
                          on ? 'border-blood-600 ring-4 ring-blood-100' : 'border-ink-200 hover:border-ink-300 hover:shadow-soft',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-xl transition-colors',
                            on ? 'bg-blood-600 text-white' : 'bg-ice-50 text-ice-700 group-hover:bg-ice-100',
                          )}
                        >
                          {on ? <Check className="size-5" /> : <Building className="size-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug font-semibold text-ink-950">{h.name}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden /> {h.area}
                            </span>
                            <span className="tabular">Centre {formatDistance(nearestCentreKm[h.id])} away</span>
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-ink-200 p-5 text-sm text-ink-600 sm:col-span-2">
                      No partner hospital matches “{query}”. We can only deliver to facilities on our network. Ask the hospital to{' '}
                      <Link to="/hospital" className="font-semibold text-blood-700 underline underline-offset-4">
                        join as a partner
                      </Link>
                      .
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {selected && !browsing && <NearbyMap hospital={selected} centres={centres} />}
      </section>

      {/* ---------- Patient ---------- */}
      <section aria-labelledby="patient-heading">
        <div id="patient-heading">
          <SubHeading icon={<UserRound className="size-4" />} title="Patient details" hint="Exactly as written on the doctor's requisition form." />
        </div>
        <div className="grid gap-5 sm:grid-cols-6">
          <Field label="Patient's full name" required error={errors['patient.name']} className="sm:col-span-6">
            {(id) => (
              <Input
                id={id}
                value={draft.patient.name}
                onChange={(e) => setPatient('name', e.target.value)}
                autoComplete="off"
                placeholder="e.g. Meera Iyer"
                aria-invalid={!!errors['patient.name'] || undefined}
              />
            )}
          </Field>
          <Field label="Age (years)" required error={errors['patient.age']} className="sm:col-span-2">
            {(id) => (
              <Input
                id={id}
                value={draft.patient.age}
                onChange={(e) => setPatient('age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                inputMode="numeric"
                placeholder="34"
                aria-invalid={!!errors['patient.age'] || undefined}
              />
            )}
          </Field>
          <GroupField label="Gender" required error={errors['patient.gender']} className="sm:col-span-4">
            {(labelId) => (
              <div role="radiogroup" aria-labelledby={labelId} className="grid h-12 grid-cols-3 rounded-2xl border border-ink-200 bg-ink-50 p-1">
                {GENDERS.map((g) => {
                  const on = draft.patient.gender === g.value
                  return (
                    <button
                      key={g.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPatient('gender', g.value)}
                      className={cn(
                        'relative rounded-xl text-sm font-semibold transition-colors',
                        on ? 'text-ink-950' : 'text-ink-500 hover:text-ink-800',
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId="gender-pill"
                          className="absolute inset-0 rounded-xl bg-white shadow-soft"
                          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        />
                      )}
                      <span className="relative">{g.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </GroupField>
          <GroupField
            label="Blood group"
            required
            error={errors['patient.bloodGroup']}
            hint="Use the group confirmed by the hospital lab. The blood centre re-checks it before issue."
            className="sm:col-span-6"
          >
            {() => (
              <BloodGroupPicker
                value={draft.patient.bloodGroup}
                onChange={(g) => setPatient('bloodGroup', g)}
                className="max-w-md"
              />
            )}
          </GroupField>
        </div>

        <div className="mt-8 rounded-3xl border border-ink-100 bg-ink-50/50 p-4 sm:p-5">
          <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-ink-800">
            <span className="inline-flex items-center gap-2">
              <BedDouble className="size-4 text-ink-500" aria-hidden /> Hospital reference
            </span>
            <span className="w-full pl-6 font-normal text-ink-500 sm:w-auto sm:pl-0">Optional · speeds up handover</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="UHID / IP number">
              {(id) => (
                <Input id={id} value={draft.patient.uhid} onChange={(e) => setPatient('uhid', e.target.value)} placeholder="e.g. IP-2024-00817" autoComplete="off" />
              )}
            </Field>
            <Field label="Ward / bed">
              {(id) => (
                <Input id={id} value={draft.patient.ward} onChange={(e) => setPatient('ward', e.target.value)} placeholder="e.g. ICU-2, Bed 14" autoComplete="off" />
              )}
            </Field>
            <Field label="Diagnosis / indication" className="sm:col-span-2">
              {(id) => (
                <Textarea
                  id={id}
                  value={draft.patient.diagnosis}
                  onChange={(e) => setPatient('diagnosis', e.target.value)}
                  placeholder="e.g. Post-partum haemorrhage, Hb 6.2 g/dL"
                  className="min-h-20 bg-white"
                />
              )}
            </Field>
          </div>
        </div>
      </section>
    </div>
  )
}

function SelectedHospital({
  hospital,
  nearestM,
  locked,
  onChange,
}: {
  hospital: PartnerHospital
  nearestM?: number
  locked?: boolean
  onChange?: () => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-ink-950 bg-ink-950 p-4 text-white sm:flex-row sm:items-center sm:p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-ice-400">
        <Hospital className="size-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight font-bold">{hospital.name}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-300">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden /> {hospital.area}
          </span>
          <span>Reg. {hospital.registrationNo}</span>
          {nearestM !== undefined && <span className="tabular">Nearest centre {formatDistance(nearestM)}</span>}
        </p>
      </div>
      {locked ? (
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink-200 sm:self-center">
          <Lock className="size-3.5" aria-hidden /> Linked to your account
        </span>
      ) : (
        <button
          type="button"
          onClick={onChange}
          className="self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-ink-100 sm:self-center"
        >
          Change
        </button>
      )}
    </div>
  )
}

function NearbyMap({ hospital, centres }: { hospital: PartnerHospital; centres: BloodCentre[] }) {
  const { markers, fit } = useMemo(() => {
    const ranked = [...centres].sort((a, b) => distanceMeters(a.location, hospital.location) - distanceMeters(b.location, hospital.location))
    const near = ranked.slice(0, 2)
    const m: MapMarker[] = [
      { id: hospital.id, kind: 'hospital', position: hospital.location, label: hospital.name },
      ...centres.map((c) => ({
        id: c.id,
        kind: 'centre' as const,
        position: c.location,
        label: `${c.name} · ${formatDistance(distanceMeters(c.location, hospital.location))}`,
        active: c.id === near[0]?.id,
      })),
    ]
    return { markers: m, fit: [hospital.location, ...near.map((c) => c.location)] }
  }, [hospital, centres])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
      <LiveMap markers={markers} fitTo={fit} className="h-52 border border-ink-100 sm:h-60" />
      <p className="mt-2 flex items-center gap-2 text-xs text-ink-500">
        <span className="inline-block size-2.5 rounded-sm bg-blood-600" aria-hidden /> Nearest licensed blood centre
        <span className="inline-block size-2.5 rounded-full bg-ice-600" aria-hidden /> Your hospital
      </p>
    </motion.div>
  )
}
