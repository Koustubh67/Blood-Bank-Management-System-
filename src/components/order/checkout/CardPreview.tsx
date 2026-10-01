import { AnimatePresence, motion } from 'motion/react'
import { Nfc } from 'lucide-react'
import { cardBrand, digitsOnly, type CardBrand } from '@/services/payments'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  rupay: 'RuPay',
  amex: 'AMEX',
  unknown: '',
}

/** Background glow per network, kept within the product palette. */
const BRAND_GLOW: Record<CardBrand, string> = {
  visa: 'radial-gradient(120% 90% at 100% 0%, rgb(8 145 178 / 0.55), transparent 55%)',
  mastercard: 'radial-gradient(120% 90% at 100% 0%, rgb(217 119 6 / 0.55), transparent 55%)',
  rupay: 'radial-gradient(120% 90% at 100% 0%, rgb(34 211 238 / 0.45), transparent 55%)',
  amex: 'radial-gradient(120% 90% at 100% 0%, rgb(6 182 212 / 0.5), transparent 55%)',
  unknown: 'radial-gradient(120% 90% at 100% 0%, rgb(200 16 46 / 0.55), transparent 55%)',
}

export function BrandMark({ brand, className }: { brand: CardBrand; className?: string }) {
  if (brand === 'unknown') return null
  return (
    <span
      className={cn(
        'font-display font-extrabold tracking-tight',
        brand === 'visa' && 'italic',
        brand === 'amex' && 'tracking-[0.12em]',
        className,
      )}
    >
      {BRAND_LABEL[brand]}
    </span>
  )
}

function maskedNumber(number: string, brand: CardBrand) {
  const d = digitsOnly(number)
  const len = brand === 'amex' ? 15 : 16
  const groups = brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4]
  const padded = (d + '•'.repeat(Math.max(0, len - d.length))).slice(0, Math.max(len, d.length))
  const out: string[] = []
  let i = 0
  for (const g of groups) {
    out.push(padded.slice(i, i + g))
    i += g
  }
  if (padded.length > i) out.push(padded.slice(i))
  return out
}

export function CardPreview({
  number,
  expiry,
  cvv,
  name,
  flipped,
  className,
}: {
  number: string
  expiry: string
  cvv: string
  name: string
  flipped: boolean
  className?: string
}) {
  const brand = cardBrand(number)
  const groups = maskedNumber(number, brand)

  return (
    <div className={cn('w-full max-w-88 perspective-[1400px]', className)} aria-hidden>
      <motion.div
        className="relative aspect-[1.586/1] w-full transform-3d"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        {/* ---------- front ---------- */}
        <div
          className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl bg-ink-950 p-5 text-white shadow-lift backface-hidden sm:p-6"
          style={{ backgroundImage: BRAND_GLOW[brand] }}
        >
          <div className="grain pointer-events-none absolute inset-0 opacity-20" />
          <svg className="pointer-events-none absolute -right-10 -bottom-16 size-56 text-white/4" viewBox="0 0 64 64">
            <path d="M32 6c-10 13.5-17 22.5-17 32a17 17 0 0 0 34 0C49 28.5 42 19.5 32 6z" fill="currentColor" />
          </svg>
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="relative h-8 w-11 overflow-hidden rounded-md bg-linear-to-br from-amber-200 via-amber-300 to-amber-500">
                <span className="absolute inset-x-0 top-1/2 h-px bg-amber-700/40" />
                <span className="absolute inset-y-0 left-1/3 w-px bg-amber-700/40" />
                <span className="absolute inset-y-0 left-2/3 w-px bg-amber-700/40" />
              </span>
              <Nfc className="size-5 text-white/70" />
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={brand}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="text-lg"
              >
                <BrandMark brand={brand} />
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="relative flex gap-3 font-mono text-[1.05rem] tracking-[0.14em] tabular sm:text-xl">
            {groups.map((g, i) => (
              <span key={i} className={cn(!/\d/.test(g) && 'text-white/35')}>
                {g}
              </span>
            ))}
          </div>
          <div className="relative flex items-end justify-between gap-4 text-xs">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Card holder</p>
              <p className="mt-0.5 truncate font-semibold tracking-wider uppercase">{name.trim() || 'Your name'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase">Expires</p>
              <p className="mt-0.5 font-semibold tabular">{expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>

        {/* ---------- back ---------- */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl bg-ink-900 text-white shadow-lift backface-hidden transform-[rotateY(180deg)]">
          <div className="mt-6 h-10 w-full bg-ink-950" />
          <div className="mx-5 mt-5 flex items-center gap-3 sm:mx-6">
            <div className="h-9 flex-1 rounded-md bg-[repeating-linear-gradient(-45deg,#f4f1ef_0_6px,#e7e2df_6px_12px)]" />
            <div className="grid h-9 min-w-14 place-items-center rounded-md bg-white px-2 font-mono text-sm font-bold tracking-widest text-ink-950 tabular">
              {cvv ? '•'.repeat(cvv.length) : 'CVV'}
            </div>
          </div>
          <p className="mx-5 mt-4 text-[10px] leading-relaxed text-white/50 sm:mx-6">
            Card preview. {BRAND.name} never stores card numbers or CVV. Details go straight to the payment gateway.
          </p>
          <div className="absolute right-5 bottom-4 text-base sm:right-6">
            <BrandMark brand={brand} className="text-white/80" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
