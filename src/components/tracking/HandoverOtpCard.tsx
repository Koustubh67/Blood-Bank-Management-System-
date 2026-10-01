import { useState } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/primitives'

/**
 * The 4-digit code the hospital reads out to the rider at handover. Only the
 * person who placed the order (or the receiving hospital) can see it.
 */
export function HandoverOtpCard({ otp, canView, delivered }: { otp: string; canView: boolean; delivered: boolean }) {
  const [hidden, setHidden] = useState(false)
  const digits = otp.split('')

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-blood-50 text-blood-700">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Handover OTP</h2>
            <p className="text-xs text-ink-500">{delivered ? 'Used at handover' : 'Share only at the transfusion desk'}</p>
          </div>
        </div>
        {canView && !delivered && (
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-950"
            aria-pressed={hidden}
          >
            {hidden ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
            {hidden ? 'Show' : 'Hide'}
          </button>
        )}
      </div>

      {canView ? (
        <>
          <div className="mt-5 flex gap-2 sm:gap-3" aria-label={hidden ? 'OTP hidden' : `OTP ${digits.join(' ')}`} role="group">
            {digits.map((d, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                aria-hidden
                className={cn(
                  'grid h-16 flex-1 place-items-center rounded-2xl border font-display text-4xl font-bold tabular sm:h-18 sm:text-[2.6rem]',
                  delivered ? 'border-ink-100 bg-ink-50 text-ink-300 line-through decoration-2' : 'border-ink-200 bg-white text-ink-950 shadow-soft',
                )}
              >
                {hidden ? '•' : d}
              </motion.span>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-600">
            {delivered
              ? 'This code was used to confirm the handover and is no longer valid.'
              : 'Read this out to the rider only when the sealed box is at the blood transfusion desk and the seal and temperature logger look intact. Never share it over the phone.'}
          </p>
        </>
      ) : (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-500" aria-hidden />
          <p>The code is visible only to the person who placed this order and to the receiving hospital&rsquo;s blood desk. Sign in with that account to see it.</p>
        </div>
      )}
    </Card>
  )
}
