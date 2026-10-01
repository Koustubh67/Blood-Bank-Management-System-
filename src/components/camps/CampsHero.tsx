import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ArrowDown, CalendarHeart, Droplet, Heart, ShieldCheck, Tent } from 'lucide-react'
import { buttonClass } from '@/components/ui/Button'
import { LiveDot } from '@/components/ui/primitives'
import { Person } from '@/components/characters/Person'
import { Prop } from '@/components/characters/Prop'
import { SpeechBubble } from '@/components/characters/SpeechBubble'
import { EASE_OUT } from '@/components/home/Reveal'
import { CampCounters } from './CampCounters'
import { DonateSwitch } from '@/components/donate/DonateSwitch'

// Real observances, mentioned only on the day itself.
const AWARENESS_DAYS: Record<string, string> = {
  '10-01': 'National Voluntary Blood Donation Day',
  '06-14': 'World Blood Donor Day',
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
})

export function CampsHero({
  campCount,
  days,
  stateName,
  myPledgeCount,
}: {
  campCount: number | 'loading' | 'error'
  days: number
  stateName: string
  myPledgeCount: number
}) {
  const now = new Date()
  const awareness = AWARENESS_DAYS[`${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`]

  return (
    <section aria-labelledby="camps-hero-title" className="relative isolate overflow-hidden">
      {/* Warm glow behind the scene, a cool tint low down and a faint dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(50% 50% at 85% 20%, var(--color-blood-100) 0%, transparent 70%), radial-gradient(40% 40% at 95% 85%, var(--color-ice-50) 0%, transparent 70%), radial-gradient(35% 30% at 0% 20%, var(--color-ink-100) 0%, transparent 70%)',
        }}
      />
      <div aria-hidden className="grain absolute inset-0 -z-10 mask-[radial-gradient(60%_60%_at_25%_25%,black,transparent)]" />
      <DonateSwitch />

      <div className="container-page pt-6 pb-10 sm:pt-8 sm:pb-14 lg:pt-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div className="min-w-0">
            <motion.p {...rise(0)} className="eyebrow">
              <LiveDot className="size-2" /> Live from e-RaktKosh
            </motion.p>
            <motion.h1
              {...rise(0.06)}
              id="camps-hero-title"
              className="mt-4 text-[2.6rem] leading-[0.98] font-extrabold tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem] xl:text-7xl"
            >
              Find a blood donation camp <span className="text-blood-600">near you.</span>
            </motion.h1>
            <motion.p {...rise(0.12)} className="mt-5 max-w-xl text-lg text-ink-600 sm:text-xl">
              These are real camps from e-RaktKosh, the national blood-centre schedule run by the Ministry of Health. Pick one, tell us you&rsquo;ll
              go, and we count your pledge.
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#camps" className={buttonClass({ size: 'lg' })}>
                See camps <ArrowDown className="size-4" aria-hidden />
              </a>
              <Link to="/donate#eligibility" className={buttonClass({ size: 'lg', variant: 'outline' })}>
                <ShieldCheck className="size-4 text-blood-600" aria-hidden /> Can I donate?
              </Link>
            </motion.div>
            {awareness && (
              <motion.p
                {...rise(0.24)}
                className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-blood-100 bg-white/80 py-1.5 pr-4 pl-1.5 text-[13px] font-medium text-ink-700 shadow-soft"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blood-600 text-white" aria-hidden>
                  <Heart className="size-3 fill-current" />
                </span>
                <span className="min-w-0">
                  Today is <span className="font-semibold text-ink-950">{awareness}</span>
                </span>
              </motion.p>
            )}
          </div>

          {/* Donors heading to a camp */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.12 }}
            className="relative mx-auto aspect-6/5 w-full max-w-[24rem] sm:max-w-md lg:max-w-136"
          >
            <div
              aria-hidden
              className="absolute inset-[3%] rounded-full"
              style={{ background: 'radial-gradient(closest-side, var(--color-blood-50) 60%, transparent)' }}
            />
            <div aria-hidden className="absolute right-0 bottom-[8%] size-[46%] rounded-full bg-ice-50 blur-2xl" />
            <div aria-hidden className="absolute inset-x-[12%] bottom-[2%] h-[7%] rounded-[50%] bg-ink-950/[0.07] blur-md" />

            <Prop icon={Tent} tone="emerald" className="absolute top-[7%] left-1/2 w-[18%] -translate-x-1/2" />
            <Prop icon={CalendarHeart} tone="ink" float delay={0.8} className="absolute top-[6%] right-[8%] w-[14%] rotate-[8deg]" />
            <Prop icon={Droplet} tone="blood" float delay={1.6} className="absolute top-[12%] left-[10%] w-[11%] -rotate-12" />
            <Person who="priya" mood="happy" badge="heart" className="absolute bottom-[3%] left-[4%] w-[40%]" />
            <Person who="rohan" mood="happy" className="absolute right-[4%] bottom-[3%] w-[40%]" />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.7 }}
              className="absolute top-[32%] left-[27%] max-w-[50%]"
            >
              <SpeechBubble tail="bottom" className="text-[13px] sm:text-[15px]">
                Count me in for Sunday!
              </SpeechBubble>
            </motion.div>
          </motion.div>
        </div>

        <motion.div {...rise(0.28)} className="mt-10 lg:mt-12">
          <CampCounters campCount={campCount} days={days} stateName={stateName} myPledgeCount={myPledgeCount} />
        </motion.div>
      </div>
    </section>
  )
}
