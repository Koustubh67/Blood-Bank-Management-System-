import { useId, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, CalendarClock, CircleCheck, CircleX, RotateCcw, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/primitives'
import { checkEligibility, type EligibilityAnswers } from '@/services/donors'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { isoDay } from './slots'

type Gender = EligibilityAnswers['gender']
type QuestionKey = 'feelingWell' | 'tattooOrPiercingLast12Months' | 'pregnantOrBreastfeeding' | 'onAntibiotics' | 'majorSurgeryLast6Months'

const QUESTIONS: { key: QuestionKey; q: string; femaleOnly?: boolean }[] = [
  { key: 'feelingWell', q: 'Are you feeling fit and well today?' },
  { key: 'tattooOrPiercingLast12Months', q: 'Tattoo, piercing or acupuncture in the last 12 months?' },
  { key: 'onAntibiotics', q: 'Taking antibiotics, or recovering from an infection?' },
  { key: 'majorSurgeryLast6Months', q: 'Major surgery in the last 12 months?' },
  { key: 'pregnantOrBreastfeeding', q: 'Pregnant, or breastfeeding?', femaleOnly: true },
]

export interface EligibilityPrefill {
  age: number
  weightKg: number
  lastDonation?: string
}

type Result = ReturnType<typeof checkEligibility>

function YesNo({ label, value, onChange, invalid }: { label: string; value: boolean | null; onChange: (v: boolean) => void; invalid?: boolean }) {
  const id = useId()
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        invalid ? 'border-blood-300 bg-blood-50/40' : 'border-ink-100',
      )}
    >
      <p id={id} className="text-sm font-medium text-ink-900">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="grid shrink-0 grid-cols-2 gap-1 rounded-full bg-ink-50 p-1">
        {[true, false].map((v) => {
          const active = value === v
          return (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className={cn(
                'h-9 min-w-18 rounded-full px-4 text-sm font-semibold transition',
                active ? 'bg-ink-950 text-white shadow-soft' : 'text-ink-600 hover:text-ink-950',
              )}
            >
              {v ? 'Yes' : 'No'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function EligibilityChecker({ onBook }: { onBook: (prefill: EligibilityPrefill) => void }) {
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [lastDonation, setLastDonation] = useState('')
  const [answers, setAnswers] = useState<Record<QuestionKey, boolean | null>>({
    feelingWell: null,
    tattooOrPiercingLast12Months: null,
    pregnantOrBreastfeeding: null,
    onAntibiotics: null,
    majorSurgeryLast6Months: null,
  })
  const [showErrors, setShowErrors] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const visible = QUESTIONS.filter((q) => !q.femaleOnly || gender === 'female')
  const ageN = Number(age)
  const weightN = Number(weight)
  const errors = {
    age: !age || !Number.isFinite(ageN) || ageN < 1 || ageN > 120 ? 'Enter your age in years.' : null,
    weight: !weight || !Number.isFinite(weightN) || weightN < 20 || weightN > 250 ? 'Enter your weight in kg.' : null,
    gender: gender ? null : 'Choose one.',
    lastDonation: lastDonation && lastDonation > isoDay(new Date()) ? 'This date is in the future.' : null,
  }
  const unanswered = visible.filter((q) => answers[q.key] === null).length
  const valid = !errors.age && !errors.weight && !errors.gender && !errors.lastDonation && unanswered === 0

  const touch = () => setResult(null)
  const setAnswer = (k: QuestionKey, v: boolean) => {
    setAnswers((a) => ({ ...a, [k]: v }))
    touch()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (!valid || !gender) return
    const r = checkEligibility({
      age: ageN,
      weightKg: weightN,
      gender,
      lastDonation: lastDonation || undefined,
      feelingWell: !!answers.feelingWell,
      tattooOrPiercingLast12Months: !!answers.tattooOrPiercingLast12Months,
      pregnantOrBreastfeeding: gender === 'female' && !!answers.pregnantOrBreastfeeding,
      onAntibiotics: !!answers.onAntibiotics,
      majorSurgeryLast6Months: !!answers.majorSurgeryLast6Months,
    })
    setResult(r)
  }

  const reset = () => {
    setAge('')
    setWeight('')
    setGender(null)
    setLastDonation('')
    setAnswers({ feelingWell: null, tattooOrPiercingLast12Months: null, pregnantOrBreastfeeding: null, onAntibiotics: null, majorSurgeryLast6Months: null })
    setShowErrors(false)
    setResult(null)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Age" required error={showErrors ? errors.age : null}>
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                placeholder="Years"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value)
                  touch()
                }}
                aria-invalid={(showErrors && !!errors.age) || undefined}
              />
            )}
          </Field>
          <Field label="Weight" required error={showErrors ? errors.weight : null}>
            {(id) => (
              <div className="relative">
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={20}
                  max={250}
                  placeholder="kg"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value)
                    touch()
                  }}
                  className="pr-12"
                  aria-invalid={(showErrors && !!errors.weight) || undefined}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-ink-400">kg</span>
              </div>
            )}
          </Field>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-ink-800">
            Sex <span className="text-blood-600">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(['female', 'male', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={gender === g}
                onClick={() => {
                  setGender(g)
                  touch()
                }}
                className={cn(
                  'h-12 rounded-2xl border text-sm font-semibold capitalize transition',
                  gender === g ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 bg-white text-ink-800 hover:border-ink-300',
                )}
              >
                {g}
              </button>
            ))}
          </div>
          {showErrors && errors.gender ? (
            <p className="text-xs font-medium text-blood-700" role="alert">
              {errors.gender}
            </p>
          ) : (
            <p className="text-xs text-ink-500">Used only to apply the right gap between donations (90 or 120 days).</p>
          )}
        </fieldset>

        <Field label="Last whole-blood donation" hint="Leave empty if you have never donated." error={errors.lastDonation}>
          {(id) => (
            <Input
              id={id}
              type="date"
              max={isoDay(new Date())}
              value={lastDonation}
              onChange={(e) => {
                setLastDonation(e.target.value)
                touch()
              }}
              aria-invalid={!!errors.lastDonation || undefined}
            />
          )}
        </Field>

        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium text-ink-800">A few quick questions</p>
          <AnimatePresence initial={false}>
            {visible.map((q) => (
              <motion.div
                key={q.key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <YesNo label={q.q} value={answers[q.key]} onChange={(v) => setAnswer(q.key, v)} invalid={showErrors && answers[q.key] === null} />
              </motion.div>
            ))}
          </AnimatePresence>
          {showErrors && unanswered > 0 && (
            <p className="text-xs font-medium text-blood-700" role="alert">
              Answer {unanswered === 1 ? 'the remaining question' : `the remaining ${unanswered} questions`} to see your result.
            </p>
          )}
        </div>
      </div>

      {/* Result column */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <AnimatePresence mode="wait" initial={false}>
          {!result ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 rounded-4xl border border-dashed border-ink-200 bg-white p-6 sm:p-8"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-blood-50 text-blood-600">
                <Stethoscope className="size-6" />
              </span>
              <div>
                <h3 className="text-2xl font-bold">Takes 30 seconds</h3>
                <p className="mt-2 text-ink-600">
                  Based on the donor selection criteria published by India's National Blood Transfusion Council. Nothing you enter here is
                  saved.
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full" icon={<CircleCheck className="size-5" />}>
                Check my eligibility
              </Button>
            </motion.div>
          ) : result.eligible ? (
            <motion.div
              key="pass"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 rounded-4xl bg-emerald-50 p-6 ring-1 ring-emerald-100 sm:p-8"
              role="status"
            >
              <motion.span
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                className="grid size-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_30px_-10px_rgb(5_150_105/0.7)]"
              >
                <CircleCheck className="size-7" />
              </motion.span>
              <div>
                <h3 className="text-2xl font-bold text-emerald-950">You look eligible to donate</h3>
                <p className="mt-2 text-emerald-900/80">
                  Nothing in your answers rules you out. The centre's medical officer confirms eligibility after a haemoglobin test (at least
                  12.5 g/dL) and a short check-up.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => onBook({ age: ageN, weightKg: weightN, lastDonation: lastDonation || undefined })}
                >
                  Book a slot <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="ghost" onClick={reset} icon={<RotateCcw className="size-4" />}>
                  Start over
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="fail"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 rounded-4xl bg-amber-50 p-6 ring-1 ring-amber-100 sm:p-8"
              role="status"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-amber-500 text-white">
                <CircleX className="size-7" />
              </span>
              <div>
                <h3 className="text-2xl font-bold text-amber-950">Not just yet</h3>
                <p className="mt-2 text-amber-900/80">Thank you for wanting to help. Based on your answers:</p>
              </div>
              <ul className="flex flex-col gap-2">
                {result.reasons.map((r) => (
                  <li key={r} className="flex gap-2.5 rounded-2xl bg-white/70 p-3 text-sm text-ink-800">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    {r}
                  </li>
                ))}
              </ul>
              {result.nextEligibleDate && (
                <p className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm text-ink-800 shadow-soft">
                  <CalendarClock className="size-5 shrink-0 text-amber-600" />
                  <span>
                    Earliest next donation:{' '}
                    <strong className="font-semibold text-ink-950">
                      {new Date(`${result.nextEligibleDate}T00:00:00`).toLocaleDateString(BRAND.locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                </p>
              )}
              <p className="text-sm text-amber-900/80">
                You can still help: share a donation drive, or come back when you are eligible. If unsure, ask the medical officer at any
                blood centre.
              </p>
              <Button variant="outline" onClick={reset} icon={<RotateCcw className="size-4" />}>
                Check again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  )
}
