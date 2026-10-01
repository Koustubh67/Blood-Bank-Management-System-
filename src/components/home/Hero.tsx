import { Fragment, lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, BadgeCheck, Building2, IndianRupee, Snowflake } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { BLOOD_GROUPS } from '@/data/blood'
import { useCity } from '@/services/location'
import { useCityCentres, useCityStock } from '@/services/inventory'
import { BloodGroupPicker } from '@/components/ui/BloodGroupPicker'
import { ButtonLink } from '@/components/ui/Button'
import { LiveDot, Skeleton } from '@/components/ui/primitives'
import type { BloodGroup } from '@/types'
import { cn } from '@/lib/utils'
import { EcgLine, PulseDrop } from './graphics'
import { EASE_OUT } from './Reveal'

// Leaflet is heavy: load the map preview after the headline has painted.
const DeliveryPreview = lazy(() => import('./DeliveryPreview').then((m) => ({ default: m.DeliveryPreview })))

// The headline is built from the brand tagline so it stays in sync with config.
const TAGLINE = BRAND.tagline.split(' ')
const HEAD = TAGLINE[0]
const MIDDLE = TAGLINE.slice(1, -1)
const TAIL = TAGLINE.length > 1 ? TAGLINE[TAGLINE.length - 1] : ''

const TRUST = [
  { icon: BadgeCheck, label: 'Licensed blood centres', tone: 'text-blood-600' },
  { icon: IndianRupee, label: 'NBTC-capped charges', tone: 'text-blood-600' },
  { icon: Snowflake, label: 'Live cold-chain tracking', tone: 'text-ice-600' },
]

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
})

function Word({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={{ opacity: 0, y: '0.3em', filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.12 + index * 0.09 }}
    >
      {children}
    </motion.span>
  )
}

function PreviewSkeleton() {
  return (
    <div className="rounded-4xl border border-ink-100 bg-white p-2 shadow-lift" aria-hidden>
      <div className="h-11" />
      <Skeleton className="h-56 rounded-[1.6rem] sm:h-72 xl:h-76" />
      <div className="space-y-4 px-3 pt-5 pb-3 sm:px-4">
        <Skeleton className="h-12 w-44" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function Hero() {
  const city = useCity()
  const stock = useCityStock()
  const centres = useCityCentres()
  const [group, setGroup] = useState<BloodGroup | null>(null)

  const redCells = useMemo(() => {
    const byGroup = {} as Record<BloodGroup, number>
    let total = 0
    for (const g of BLOOD_GROUPS) {
      byGroup[g] = stock[g].PRBC
      total += stock[g].PRBC
    }
    return { byGroup, total }
  }, [stock])

  const centresWithGroup = useMemo(
    () => (group ? centres.filter((c) => c.inventory[group].PRBC > 0).length : 0),
    [centres, group],
  )

  const orderHref = group ? `/order?group=${encodeURIComponent(group)}&component=PRBC` : '/order?component=PRBC'
  const groupUnits = group ? redCells.byGroup[group] : 0

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Backdrop: warm glow, cold-chain tint and a faint dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(55% 45% at 88% 8%, var(--color-blood-100) 0%, transparent 70%), radial-gradient(40% 35% at 70% 95%, var(--color-ice-50) 0%, transparent 70%), radial-gradient(35% 30% at 0% 30%, var(--color-ink-100) 0%, transparent 70%)',
        }}
      />
      <div aria-hidden className="grain absolute inset-0 -z-10 mask-[radial-gradient(70%_60%_at_30%_20%,black,transparent)]" />

      <div className="container-page grid grid-cols-1 items-center gap-10 pt-8 pb-12 sm:pt-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 lg:pt-12 lg:pb-16 xl:gap-20">
        {/* Left: message + quick order */}
        <div className="min-w-0">
          <motion.p
            {...rise(0)}
            className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-ink-100 bg-white/80 py-1.5 pr-4 pl-2 text-[13px] font-medium text-ink-700 shadow-soft backdrop-blur"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blood-50">
              <LiveDot />
            </span>
            <span className="truncate">
              <span className="font-semibold text-ink-950 tabular">{redCells.total.toLocaleString(BRAND.locale)}</span> red-cell units live in{' '}
              {city.name}
              <span className="hidden sm:inline">
                <span className="text-ink-400"> · </span>
                {centres.length} licensed {centres.length === 1 ? 'centre' : 'centres'}
              </span>
            </span>
          </motion.p>

          <h1
            id="hero-title"
            className="mt-5 pb-[0.42em] text-[3.2rem] leading-[0.9] font-extrabold tracking-tighter sm:text-7xl lg:text-[5.2rem] xl:text-[6rem]"
          >
            <span className="flex items-center gap-[0.16em]">
              <Word index={0}>{HEAD}</Word>
              <motion.span
                className="inline-flex"
                initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 160, delay: 0.5 }}
              >
                <PulseDrop className="h-[0.74em]" />
              </motion.span>
            </span>
            {MIDDLE.map((w, i) => (
              <Fragment key={`${w}-${i}`}>
                {i > 0 && ' '}
                <Word index={i + 1}>{w}</Word>
              </Fragment>
            ))}{' '}
            {TAIL && (
              <Word index={TAGLINE.length - 1} className="relative text-blood-600">
                {TAIL}
                <EcgLine className="absolute top-full left-0 mt-[0.04em] w-full text-blood-600" strokeWidth={3.2} />
              </Word>
            )}
          </h1>

          <motion.p {...rise(0.5)} className="max-w-xl text-lg leading-relaxed text-ink-600">
            Verified units from licensed blood centres, rushed to the patient&rsquo;s hospital in {city.name} in a sealed, temperature-logged cold
            box. Emergency orders go first, with a <strong className="font-semibold text-ink-900">{BRAND.promiseMinutes}-minute dispatch target</strong>.
          </motion.p>

          {/* Quick order */}
          <motion.div {...rise(0.62)} className="mt-7 rounded-4xl border border-ink-100 bg-white p-4 shadow-lift sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-lg font-semibold tracking-tight text-ink-950">Patient&rsquo;s blood group</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <LiveDot color="bg-ice-500" /> Red-cell units in {city.name}
              </p>
            </div>
            <BloodGroupPicker value={group} onChange={setGroup} availability={redCells.byGroup} />
            <p aria-live="polite" className="mt-3 min-h-10 text-sm leading-snug text-ink-600 sm:min-h-5">
              {!group ? (
                'Pick a group to check live stock. You can add plasma, platelets and more on the next step.'
              ) : groupUnits > 0 ? (
                <>
                  <span className="font-semibold text-ink-900 tabular">{groupUnits}</span> units of {group} red cells ready across {centresWithGroup}{' '}
                  {centresWithGroup === 1 ? 'centre' : 'centres'} in {city.name}. Issued only after the centre checks the requisition.
                </>
              ) : (
                <>
                  No {group} red cells on the shelf in {city.name} right now. Start a request and our team will call you with options.
                </>
              )}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={orderHref} size="lg" className="w-full sm:w-auto">
                {group ? `Order ${group} red cells` : 'Start an order'}
                <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/hospital" variant="outline" size="lg" icon={<Building2 className="size-5" aria-hidden />} className="w-full sm:w-auto">
                I&rsquo;m a hospital
              </ButtonLink>
            </div>
          </motion.div>

          <motion.ul {...rise(0.75)} className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 px-1 sm:flex" aria-label={`Why ${BRAND.name} is safe`}>
            {TRUST.map(({ icon: Icon, label, tone }) => (
              <li key={label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-600">
                <Icon className={cn('size-4', tone)} aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right: live delivery preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.3 }}
          className="relative min-w-0"
        >
          <Suspense fallback={<PreviewSkeleton />}>
            <DeliveryPreview />
          </Suspense>
        </motion.div>
      </div>
    </section>
  )
}
