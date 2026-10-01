import { Building, CreditCard, FlaskConical, Landmark, Smartphone } from 'lucide-react'
import { BANKS, TEST_INSTRUMENTS } from '@/services/payments'
import { cn } from '@/lib/utils'

export type TestFill = 'cardSuccess' | 'cardDecline' | 'upiSuccess' | 'upiFail' | 'bankSuccess' | 'bankFail' | 'credit'

const TEST_BANK = BANKS.find((b) => b.code === 'TEST_FAIL')?.name ?? 'Test Bank'

export function TestModePanel({ onFill, showCredit }: { onFill: (kind: TestFill) => void; showCredit: boolean }) {
  const rows: { kind: TestFill; icon: typeof CreditCard; label: string; value: string; ok: boolean }[] = [
    { kind: 'cardSuccess', icon: CreditCard, label: 'Card', value: TEST_INSTRUMENTS.cardSuccess, ok: true },
    { kind: 'cardDecline', icon: CreditCard, label: 'Card', value: TEST_INSTRUMENTS.cardDecline, ok: false },
    { kind: 'upiSuccess', icon: Smartphone, label: 'UPI', value: TEST_INSTRUMENTS.upiSuccess, ok: true },
    { kind: 'upiFail', icon: Smartphone, label: 'UPI', value: TEST_INSTRUMENTS.upiFail, ok: false },
    { kind: 'bankSuccess', icon: Landmark, label: 'Net banking', value: 'Any listed bank', ok: true },
    { kind: 'bankFail', icon: Landmark, label: 'Net banking', value: TEST_BANK, ok: false },
  ]
  if (showCredit) rows.push({ kind: 'credit', icon: Building, label: 'Hospital credit', value: 'Any PO number', ok: true })

  return (
    <section
      aria-labelledby="test-mode-title"
      className="no-print rounded-3xl border border-dashed border-amber-300 bg-amber-50/60 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="test-mode-title" className="flex items-center gap-2 font-sans text-base font-semibold text-amber-950">
          <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-800">
            <FlaskConical className="size-4" aria-hidden />
          </span>
          Test mode
        </h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">No real money moves</span>
      </div>
      <p className="mt-3 text-sm text-amber-900/90">
        This checkout runs on a simulated payment gateway. Tap a test instrument to fill it in, then pay to see either outcome. Cards take
        any future expiry and any CVV.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map((r) => {
          const Icon = r.icon
          return (
            <li key={r.kind}>
              <button
                type="button"
                onClick={() => onFill(r.kind)}
                className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-amber-200/70 transition hover:shadow-soft hover:ring-amber-300"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-600 group-hover:bg-ink-100">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-ink-500">{r.label}</span>
                  <span className="block truncate font-mono text-[13px] font-medium text-ink-900">{r.value}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    r.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-blood-50 text-blood-700',
                  )}
                >
                  {r.ok ? 'Succeeds' : 'Fails'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
