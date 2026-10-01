import { useState } from 'react'
import { Info } from 'lucide-react'
import type { Order } from '@/types'
import { cancelOrder } from '@/services/orders'
import { ApiError } from '@/services/api'
import { cn, formatINR } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'
import { paidRecord } from './helpers'

const REASONS = [
  'Patient no longer needs the transfusion',
  'Arranged from the hospital’s own blood centre',
  'Wrong blood group or component selected',
  'Duplicate order placed by mistake',
  'Other',
]

export function CancelOrderModal({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')
  const [busy, setBusy] = useState(false)
  const paid = paidRecord(order)

  const submit = async () => {
    const text = reason === 'Other' ? other.trim() : reason
    if (!text) {
      toast.error('Tell us briefly why you are cancelling.')
      return
    }
    setBusy(true)
    try {
      await cancelOrder(order.id, text)
      toast.success('Order cancelled', paid ? `A refund of ${formatINR(paid.amount)} has been initiated.` : 'No payment was taken.')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not cancel the order. Please call support.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cancel this order?" dismissible={!busy}>
      <p className="text-sm text-ink-600">
        Orders can be cancelled until the units are packed. The units go straight back to the centre&rsquo;s cold storage for the next patient.
      </p>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-ink-800">Reason</legend>
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => {
            const active = r === reason
            return (
              <label
                key={r}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors',
                  active ? 'border-ink-950 bg-ink-50 font-medium text-ink-950' : 'border-ink-200 text-ink-700 hover:border-ink-300',
                )}
              >
                <input type="radio" name="cancel-reason" value={r} checked={active} onChange={() => setReason(r)} className="peer sr-only" />
                <span
                  className={cn(
                    'grid size-4.5 shrink-0 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-blood-100',
                    active ? 'border-ink-950' : 'border-ink-300',
                  )}
                  aria-hidden
                >
                  {active && <span className="size-2 rounded-full bg-ink-950" />}
                </span>
                {r}
              </label>
            )
          })}
        </div>
        {reason === 'Other' && (
          <Textarea
            className="mt-3"
            placeholder="Tell us what happened"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            maxLength={200}
            aria-label="Other reason"
            autoFocus
          />
        )}
      </fieldset>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-ice-50 p-4 text-sm text-ice-700">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          {paid
            ? `Full refund of ${formatINR(paid.amount)} to ${paid.instrument}. Refunds usually reach you in 5–7 working days, depending on your bank.`
            : 'You have not been charged for this order, so there is nothing to refund.'}
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Keep order
        </Button>
        <Button variant="dark" onClick={submit} loading={busy}>
          Cancel order
        </Button>
      </div>
    </Modal>
  )
}
