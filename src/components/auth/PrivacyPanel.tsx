import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertTriangle, Download, FileJson, Mail, PencilLine, ShieldCheck, Trash2 } from 'lucide-react'
import type { User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { deleteMyAccount, downloadJson, exportMyData, previewDeletion, type DeletionSummary } from '@/services/account'
import { DEMO_ACCOUNTS } from '@/services/auth'
import { ApiError } from '@/services/api'
import { BRAND } from '@/config/brand'

const CONFIRM_WORD = 'DELETE'

/** "Your data & privacy": DPDP access, correction and erasure rights. */
export function PrivacyPanel({ user, onEditProfile }: { user: User; onEditProfile: () => void }) {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(false)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<DeletionSummary | null>(null)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const isDemo = DEMO_ACCOUNTS.some((d) => d.email === user.email)

  const download = async () => {
    setExporting(true)
    try {
      const data = await exportMyData()
      downloadJson(data, `raktflow-my-data-${new Date().toISOString().slice(0, 10)}.json`)
      toast.success(
        'Your data is downloading',
        `Profile, ${data.orders.length} order${data.orders.length === 1 ? '' : 's'} and ${data.donorBookings.length} donation booking${data.donorBookings.length === 1 ? '' : 's'}.`,
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not prepare your data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const openDelete = () => {
    setPreview(previewDeletion())
    setTyped('')
    setOpen(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const res = await deleteMyAccount()
      navigate('/', { replace: true })
      toast.success(
        'Your account has been deleted',
        res.keptActiveOrders ? `${res.keptActiveOrders} delivery in progress will complete, then its record is closed.` : 'We are sorry to see you go.',
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete the account. Please try again.')
      setDeleting(false)
    }
  }

  const rights = [
    {
      icon: FileJson,
      title: 'Access',
      body: 'Get a copy of your profile, orders and donation bookings as a JSON file.',
      action: (
        <Button size="sm" variant="outline" onClick={download} loading={exporting} icon={<Download className="size-4" />}>
          Download my data
        </Button>
      ),
    },
    {
      icon: PencilLine,
      title: 'Correction',
      body: 'Fix your name or phone number at any time. Email changes go through support.',
      action: (
        <Button size="sm" variant="ghost" onClick={onEditProfile}>
          Edit profile
        </Button>
      ),
    },
    {
      icon: Mail,
      title: 'Grievance',
      body: `${BRAND.grievanceOfficer}. We reply within the timelines the law sets.`,
      action: (
        <a href={`mailto:${BRAND.supportEmail}?subject=Data%20protection%20request`} className="text-sm font-semibold text-ink-800 underline underline-offset-4 hover:text-ink-950">
          {BRAND.supportEmail}
        </a>
      ),
    },
  ]

  return (
    <section aria-labelledby="privacy" className="rounded-4xl border border-ink-100 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink-950 text-white">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 id="privacy" className="font-sans text-lg font-semibold">
            Your data &amp; privacy
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Under India's Digital Personal Data Protection Act, 2023 you can access, correct and erase your personal data, and withdraw consent.
          </p>
        </div>
      </div>

      <ul className="mt-6 flex flex-col divide-y divide-ink-100">
        {rights.map((r) => (
          <li key={r.title} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <r.icon className="mt-0.5 size-4 shrink-0 text-ink-400" />
              <div>
                <p className="text-sm font-semibold text-ink-950">{r.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{r.body}</p>
              </div>
            </div>
            <div className="shrink-0 pl-7 sm:pl-0">{r.action}</div>
          </li>
        ))}
      </ul>

      <div className="mt-2 rounded-3xl border border-blood-100 bg-blood-50/50 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-blood-800">
          <Trash2 className="size-4" /> Erasure
        </p>
        <p className="mt-1 text-sm text-ink-700">
          Delete your account, your finished or unpaid orders and your donation bookings. This also withdraws your consent. It cannot be
          undone.
        </p>
        <button
          type="button"
          onClick={openDelete}
          className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-blood-200 bg-white px-4 text-sm font-semibold text-blood-700 transition hover:border-blood-300 hover:bg-blood-50 active:scale-[0.98]"
        >
          Delete my account
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} dismissible={!deleting} title="Delete your account?">
        <div className="flex flex-col gap-4 text-sm text-ink-700">
          <p>This permanently removes:</p>
          <ul className="flex flex-col gap-2 rounded-2xl bg-ink-50 p-4">
            <li className="flex justify-between gap-4">
              <span>Your profile and sign-in</span>
              <span className="font-semibold text-ink-950">1</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Past, cancelled and unpaid orders</span>
              <span className="font-semibold text-ink-950 tabular">{preview?.removedOrders ?? 0}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Donation bookings</span>
              <span className="font-semibold text-ink-950 tabular">{preview?.removedBookings ?? 0}</span>
            </li>
          </ul>
          {!!preview?.keptActiveOrders && (
            <p className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {preview.keptActiveOrders} order{preview.keptActiveOrders === 1 ? ' is' : 's are'} on the way right now and will be kept until
              handover, so the hospital can receive {preview.keptActiveOrders === 1 ? 'it' : 'them'} safely.
            </p>
          )}
          <p className="text-xs text-ink-500">
            Blood centres and hospitals keep their own transfusion records as the law requires; those are held by them, not by {BRAND.name}.
            {isDemo && ' This is a demo account, so it will be recreated the next time the app loads.'}
          </p>
          <Field label={`Type ${CONFIRM_WORD} to confirm`}>
            {(id) => (
              <Input
                id={id}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={CONFIRM_WORD}
                disabled={deleting}
              />
            )}
          </Field>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>
              Keep my account
            </Button>
            <Button
              onClick={confirmDelete}
              loading={deleting}
              disabled={typed.trim().toUpperCase() !== CONFIRM_WORD}
              icon={<Trash2 className="size-4" />}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
