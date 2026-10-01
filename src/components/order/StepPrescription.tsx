import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { FileText, LockKeyhole, ShieldCheck, Stethoscope } from 'lucide-react'
import type { Order } from '@/types'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/primitives'
import { DEMO_MODE } from '@/config/brand'
import { cn } from '@/lib/utils'
import { validateRequisitionFile } from './draft'
import { FileDrop } from './FileDrop'
import { Note, SubHeading } from './parts'
import type { StepProps } from './StepPatient'

type ConsentKey = keyof Order['consent']

export function StepPrescription({
  draft,
  setDraft,
  errors,
  clearError,
  setError,
}: StepProps & { setError: (key: string, message: string) => void }) {
  const setPrescriber = (key: 'doctorName' | 'registrationNo', value: string) => {
    setDraft((d) => ({ ...d, prescriber: { ...d.prescriber, [key]: value } }))
    clearError(key)
  }

  const setConsent = (key: ConsentKey, value: boolean) => {
    setDraft((d) => ({ ...d, consent: { ...d.consent, [key]: value } }))
    clearError(`consent.${key}`)
  }

  const onFile = (file: File) => {
    const problem = validateRequisitionFile(file)
    if (problem) {
      setError('file', problem)
      return
    }
    setDraft((d) => ({ ...d, prescriber: { ...d.prescriber, fileName: file.name, fileSize: file.size } }))
    clearError('file')
  }

  const declarations: { key: ConsentKey; content: ReactNode }[] = [
    {
      key: 'prescription',
      content: (
        <>
          <span className="font-semibold text-ink-950">The requisition is genuine and signed.</span> It was issued for this patient by the
          treating doctor named above, and the details I entered match it.
        </>
      ),
    },
    {
      key: 'transfusionAtFacility',
      content: (
        <>
          <span className="font-semibold text-ink-950">Transfusion happens only at the hospital.</span> Units will be used only at the
          licensed facility above, under medical supervision, after the hospital's own cross-match and bedside checks.
        </>
      ),
    },
    {
      key: 'terms',
      content: (
        <>
          <span className="font-semibold text-ink-950">I accept the terms.</span> I agree to the{' '}
          <Link to="/legal/terms" target="_blank" rel="noreferrer" className="font-semibold text-blood-700 underline underline-offset-2">
            Terms of service
          </Link>{' '}
          and{' '}
          <Link to="/legal/privacy" target="_blank" rel="noreferrer" className="font-semibold text-blood-700 underline underline-offset-2">
            Privacy policy
          </Link>
          , including sharing these details with the blood centre and hospital.
        </>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      <section aria-labelledby="doctor-heading">
        <div id="doctor-heading">
          <SubHeading icon={<Stethoscope className="size-4" />} title="Treating doctor" hint="As printed on the requisition form." />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Doctor's full name" required error={errors.doctorName}>
            {(id) => (
              <Input
                id={id}
                value={draft.prescriber.doctorName}
                onChange={(e) => setPrescriber('doctorName', e.target.value)}
                placeholder="Dr. Kavita Rao"
                autoComplete="off"
                aria-invalid={!!errors.doctorName || undefined}
              />
            )}
          </Field>
          <Field
            label="Medical council registration no."
            required
            error={errors.registrationNo}
            hint="State Medical Council or NMC number."
          >
            {(id) => (
              <Input
                id={id}
                value={draft.prescriber.registrationNo}
                onChange={(e) => setPrescriber('registrationNo', e.target.value.toUpperCase())}
                placeholder="DMC/R/12345"
                autoComplete="off"
                autoCapitalize="characters"
                aria-invalid={!!errors.registrationNo || undefined}
              />
            )}
          </Field>
        </div>
      </section>

      <section aria-labelledby="requisition-heading">
        <div id="requisition-heading">
          <SubHeading
            icon={<FileText className="size-4" />}
            title="Signed blood requisition form"
            hint="The hospital's form, signed and stamped by the treating doctor. The blood centre's medical officer checks it before issuing units."
          />
        </div>
        <Field label="Requisition form" required error={errors.file}>
          {(id) => (
            <div data-invalid={errors.file ? 'true' : undefined}>
              <FileDrop
                id={id}
                fileName={draft.prescriber.fileName}
                fileSize={draft.prescriber.fileSize}
                invalid={!!errors.file}
                onFile={onFile}
                onClear={() => setDraft((d) => ({ ...d, prescriber: { ...d.prescriber, fileName: '', fileSize: 0 } }))}
              />
            </div>
          )}
        </Field>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="flex items-start gap-2 text-xs text-ink-500">
            <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden />
            Prototype: only the file name is kept. In production the scan goes straight to the blood centre over an encrypted connection.
          </p>
          {DEMO_MODE && !draft.prescriber.fileName && (
            <button
              type="button"
              onClick={() => {
                setDraft((d) => ({ ...d, prescriber: { ...d.prescriber, fileName: 'sample-requisition-form.pdf', fileSize: 248_000 } }))
                clearError('file')
              }}
              className="shrink-0 self-start rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100"
            >
              No scan handy? Attach a demo sample
            </button>
          )}
        </div>

        <Field label="Notes for the blood centre" hint="Optional. Special requirements or who to call on arrival." className="mt-6">
          {(id) => (
            <Textarea
              id={id}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value.slice(0, 500) }))}
              placeholder="e.g. Irradiated units requested. Call Dr. Rao at the ICU desk on arrival."
              maxLength={500}
            />
          )}
        </Field>
      </section>

      <section aria-labelledby="declarations-heading">
        <div id="declarations-heading">
          <SubHeading icon={<ShieldCheck className="size-4" />} title="Declarations" hint="All three are required by our partner blood centres." />
        </div>
        <div className="space-y-3">
          {declarations.map((d) => {
            const err = errors[`consent.${d.key}`]
            const on = draft.consent[d.key]
            return (
              <div key={d.key} data-invalid={err ? 'true' : undefined}>
                <Checkbox
                  checked={on}
                  onChange={(v) => setConsent(d.key, v)}
                  className={cn(
                    'rounded-2xl border p-4 leading-relaxed transition-colors',
                    on ? 'border-emerald-200 bg-emerald-50/50' : err ? 'border-blood-300 bg-blood-50/40' : 'border-ink-200 bg-white hover:border-ink-300',
                  )}
                >
                  {d.content}
                </Checkbox>
                {err && (
                  <p className="mt-1.5 pl-4 text-xs font-medium text-blood-700" role="alert">
                    {err}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <Note tone="neutral" className="mt-5" icon={<ShieldCheck />}>
          Using a forged or false requisition can be a criminal offence. Every order is logged against your account, the doctor's
          registration number and the handover code.
        </Note>
      </section>
    </div>
  )
}
