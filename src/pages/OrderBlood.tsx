import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Building, Headset, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, LiveDot } from '@/components/ui/primitives'
import { Stepper } from '@/components/ui/disclosure'
import { toast } from '@/components/ui/Toast'
import { BRAND } from '@/config/brand'
import { compatibleDonors } from '@/data/blood'
import { hospitalById } from '@/data/network'
import { useCity } from '@/services/location'
import { ApiError } from '@/services/api'
import { useCurrentUser } from '@/services/auth'
import { useCentres } from '@/services/inventory'
import { buildPlan, createOrder, quote, rankCentres } from '@/services/orders'
import { distanceMeters } from '@/lib/utils'
import {
  ORDER_STEPS,
  applyQuery,
  clearStoredDraft,
  draftItems,
  emptyDraft,
  lineAvailability,
  lineGroup,
  loadStoredDraft,
  storeDraft,
  toOrderDraft,
  validateStep,
  type Draft,
  type Errors,
  type LineAvailability,
} from '@/components/order/draft'
import { StepHeading } from '@/components/order/parts'
import { StepPatient } from '@/components/order/StepPatient'
import { StepBlood } from '@/components/order/StepBlood'
import { StepPrescription } from '@/components/order/StepPrescription'
import { StepReview } from '@/components/order/StepReview'
import { MobileOrderBar, OrderSummaryCard } from '@/components/order/OrderSummary'
import { playSound } from '@/lib/sound'

const STEP_COPY: { title: string; description: string }[] = [
  {
    title: 'Patient & hospital',
    description: 'Tell us where the patient is admitted and who the blood is for.',
  },
  {
    title: 'Blood & urgency',
    description: 'Pick the components on the requisition. We match the nearest licensed centre with stock in real time.',
  },
  {
    title: 'Prescription & consent',
    description: "Units are issued only against a doctor's signed blood requisition form.",
  },
  {
    title: 'Review & confirm',
    description: 'Check everything once. You can edit any section before paying.',
  },
]

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36 }),
}

export default function OrderBlood() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const allCentres = useCentres()
  const city = useCity()

  const [initial] = useState(() => {
    const stored = loadStoredDraft() ?? { draft: emptyDraft(), step: 0 }
    const prefilled = applyQuery(stored.draft, params)
    return prefilled ? { draft: prefilled, step: 0 } : stored
  })
  const [draft, setDraft] = useState<Draft>(initial.draft)
  const [step, setStep] = useState(initial.step)
  const [dir, setDir] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  // Prefill from ?group=&component=&units=&priority=, then clean the URL so a reload keeps edits.
  const paramKey = params.toString()
  useEffect(() => {
    if (!paramKey) return
    const next = new URLSearchParams(paramKey)
    setDraft((d) => applyQuery(d, next) ?? d)
    setParams({}, { replace: true })
  }, [paramKey, setParams])

  useEffect(() => {
    if (!done.current) storeDraft(draft, step)
  }, [draft, step])

  // ---------- derived ----------

  const fixedHospital = user?.role === 'hospital' && user.hospitalId ? hospitalById(user.hospitalId) : undefined
  const hospital = fixedHospital ?? hospitalById(draft.hospitalId)
  // Stock, matching and ETAs only consider centres in the hospital's city (or the visitor's, before one is picked).
  const centreCity = hospital?.cityId ?? city.id
  const centres = useMemo(() => allCentres.filter((c) => c.cityId === centreCity), [allCentres, centreCity])
  const items = useMemo(() => draftItems(draft), [draft])
  const price = useMemo(() => quote(items), [items])
  const ranked = useMemo(
    () => (hospital && items.length ? rankCentres(items, hospital.location, centres) : []),
    [hospital, items, centres],
  )
  const best = ranked[0]
  const plan = useMemo(
    () => (hospital && best?.fulfillable ? buildPlan(draft.priority, best.centre.location, hospital.location) : null),
    [hospital, best, draft.priority],
  )
  const lineStock = useMemo(() => {
    const dest = hospital?.location ?? city.center
    const out: Record<string, LineAvailability | undefined> = {}
    for (const l of draft.lines) {
      const g = lineGroup(l, draft)
      if (!g) continue
      out[l.key] = lineAvailability(
        { component: l.component, group: g, units: l.units },
        draft.patient.bloodGroup ?? g,
        centres,
        (c) => distanceMeters(c.location, dest),
        compatibleDonors,
      )
    }
    return out
  }, [draft, centres, hospital])

  const ctx = { isHospitalUser: !!fixedHospital, ranked, lineStock }

  // ---------- helpers ----------

  const clearError = useCallback((...keys: string[]) => {
    setErrors((e) => {
      if (!keys.some((k) => k in e)) return e
      const n = { ...e }
      for (const k of keys) delete n[k]
      return n
    })
  }, [])
  const setError = useCallback((key: string, message: string) => setErrors((e) => ({ ...e, [key]: message })), [])

  const scrollToForm = () => {
    const el = topRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 88
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' })
  }

  const focusFirstError = () => {
    // Wait for the step transition and the error messages to render.
    window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
      if (!el) return
      const target = el.matches('input, select, textarea, button')
        ? el
        : (el.querySelector<HTMLElement>('input, select, textarea, button') ?? el)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.focus({ preventScroll: true })
    }, 340)
  }

  const goTo = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
    setErrors({})
    scrollToForm()
  }

  const submit = async () => {
    for (const s of [0, 1, 2]) {
      const e = validateStep(s, draft, ctx)
      if (Object.keys(e).length) {
        goTo(s)
        setErrors(e)
        focusFirstError()
        toast.error('A few details need another look', `Check "${ORDER_STEPS[s]}".`)
        return
      }
    }
    if (!hospital) return
    setSubmitting(true)
    try {
      const order = await createOrder(toOrderDraft(draft, hospital.id))
      done.current = true
      clearStoredDraft()
      playSound('order')
      navigate(`/checkout/${order.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create the order. Please try again.')
      setSubmitting(false)
    }
  }

  const next = () => {
    if (submitting) return
    if (step === ORDER_STEPS.length - 1) {
      void submit()
      return
    }
    const e = validateStep(step, draft, ctx)
    if (Object.keys(e).length) {
      setErrors(e)
      focusFirstError()
      return
    }
    goTo(step + 1)
  }

  const back = () => {
    if (step > 0) goTo(step - 1)
  }

  const errorCount = Object.keys(errors).length
  const isLast = step === ORDER_STEPS.length - 1
  const summary = { draft, hospital, items, price, best, plan }

  return (
    <div className="relative">
      {/* ---------- header ---------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div
          className="grain pointer-events-none absolute inset-0 opacity-60 mask-[linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-blood-100/60 blur-3xl" aria-hidden />
        <div className="container-page relative py-8 sm:py-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">
                <LiveDot className="size-2" /> Ordering open 24×7
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Request blood for a patient</h1>
              <p className="mt-3 max-w-2xl text-ink-600 sm:text-lg">
                Four short steps. Units come from licensed blood centres and are delivered only to the hospital's transfusion desk.
              </p>
            </div>
            {fixedHospital && (
              <p className="inline-flex max-w-full items-center gap-2 self-start rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white md:self-end">
                <Building className="size-4 shrink-0 text-ice-400" aria-hidden />
                <span className="truncate">Ordering as {fixedHospital.name}</span>
              </p>
            )}
          </div>
          <div ref={topRef} className="mt-8">
            <Stepper steps={[...ORDER_STEPS]} current={step} />
            <p className="mt-3 text-sm font-semibold text-ink-800 md:hidden" aria-hidden>
              {ORDER_STEPS[step]}
            </p>
          </div>
        </div>
      </section>

      {/* ---------- body ---------- */}
      <div className="container-page grid grid-cols-1 items-start gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-12">
        <Card className="min-w-0 overflow-x-clip p-5 sm:p-8">
          <div ref={formRef}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepHeading
                  step={step}
                  total={ORDER_STEPS.length}
                  title={STEP_COPY[step].title}
                  description={STEP_COPY[step].description}
                />
                {step === 0 && (
                  <StepPatient
                    draft={draft}
                    setDraft={setDraft}
                    errors={errors}
                    clearError={clearError}
                    fixedHospital={fixedHospital}
                    centres={centres}
                  />
                )}
                {step === 1 && (
                  <StepBlood
                    draft={draft}
                    setDraft={setDraft}
                    errors={errors}
                    clearError={clearError}
                    hospital={hospital}
                    centres={centres}
                    best={best}
                    plan={plan}
                    lineStock={lineStock}
                  />
                )}
                {step === 2 && (
                  <StepPrescription draft={draft} setDraft={setDraft} errors={errors} clearError={clearError} setError={setError} />
                )}
                {step === 3 && (
                  <StepReview draft={draft} hospital={hospital} items={items} price={price} best={best} plan={plan} onEdit={goTo} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="sr-only" aria-live="assertive">
            {errorCount ? `${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention.` : ''}
          </p>

          <div className={step === 0 ? 'hidden lg:block' : undefined}>
            <div className="mt-10 flex items-center justify-between gap-3 border-t border-ink-100 pt-6">
              {step > 0 ? (
                <Button variant="ghost" onClick={back} icon={<ArrowLeft className="size-4" />} disabled={submitting}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              <div className="hidden items-center gap-4 lg:flex">
                <AnimatePresence>
                  {errorCount > 0 && (
                    <motion.p
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-right text-sm font-medium text-blood-700"
                    >
                      Fix the highlighted {errorCount === 1 ? 'field' : 'fields'}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button size="lg" onClick={next} loading={submitting}>
                  {isLast ? 'Continue to payment' : 'Continue'}
                  {!submitting && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </div>
            </div>
            {isLast && (
              <p className="mt-4 flex items-center gap-2 text-xs text-ink-500 lg:justify-end">
                <LockKeyhole className="size-3.5 shrink-0" aria-hidden /> Nothing is charged until you confirm on the payment screen.
              </p>
            )}
          </div>
        </Card>

        <aside className="hidden lg:block" aria-label="Order summary">
          <div className="sticky top-24 space-y-4">
            <OrderSummaryCard {...summary} />
            <a
              href={`tel:${BRAND.supportPhone}`}
              className="flex items-center gap-3 rounded-3xl border border-ink-100 bg-white p-4 text-sm transition hover:border-ink-200 hover:shadow-soft"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blood-50 text-blood-700">
                <Headset className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-ink-950">Need help ordering?</span>
                <span className="text-ink-500">24×7 desk · {BRAND.supportPhone}</span>
              </span>
            </a>
          </div>
        </aside>
      </div>

      <MobileOrderBar
        {...summary}
        cta={
          <Button onClick={next} loading={submitting} className="h-12 shrink-0 px-5">
            {isLast ? 'Proceed to pay' : 'Continue'}
            {!submitting && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        }
      />
    </div>
  )
}
