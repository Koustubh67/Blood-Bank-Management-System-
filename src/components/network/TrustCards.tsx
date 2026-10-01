import { ArrowRight, ClipboardCheck, RotateCcw, ShieldCheck, Thermometer, Timer, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Prop } from '@/components/characters/Prop'
import { HomeHeading, RevealItem } from '@/components/home/Reveal'

const POINTS: { icon: LucideIcon; tone: 'blood' | 'ice' | 'amber' | 'emerald'; glow: string; title: string; body: string }[] = [
  {
    icon: ClipboardCheck,
    tone: 'blood',
    glow: 'bg-blood-100',
    title: 'A licensed storage centre',
    body: 'Each outlet is a licensed blood storage centre. It holds only units issued by its licensed mother blood centre, which has already tested, grouped and labelled every one.',
  },
  {
    icon: Thermometer,
    tone: 'ice',
    glow: 'bg-ice-100',
    title: 'A fridge that is never unwatched',
    body: 'Red cells wait at 2–6 °C in a dedicated blood fridge. A logger records the temperature every minute and raises an alarm the moment it drifts outside that band.',
  },
  {
    icon: Timer,
    tone: 'amber',
    glow: 'bg-amber-100',
    title: 'Minutes from the blood desk',
    body: 'Outlets sit a short ride from the busiest hospitals, so an emergency unit starts its journey minutes from the hospital instead of across town.',
  },
  {
    icon: RotateCcw,
    tone: 'emerald',
    glow: 'bg-emerald-100',
    title: 'Nothing waits to expire',
    body: 'Units rotate first-expiry-first-out. Anything not issued goes back to the mother centre well before its expiry, so it can still reach a patient elsewhere.',
  },
]

export function TrustCards() {
  return (
    <section id="how-outlets" aria-labelledby="trust-title" className="scroll-mt-20 border-t border-ink-100 py-16 sm:py-24">
      <div className="container-page">
        <HomeHeading
          id="trust-title"
          eyebrow={
            <>
              <ShieldCheck className="size-4" aria-hidden /> How outlets work
            </>
          }
          title="Why our outlets sit next to hospitals."
          description="Distance is the one delay a cold box can't make up. So we keep licensed stock close to where emergencies happen, under the same rules as any blood centre."
        />

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <RevealItem
              key={p.title}
              delay={i * 0.08}
              className="group relative isolate flex flex-col overflow-hidden rounded-4xl border border-ink-100 bg-white p-6 shadow-soft transition-shadow duration-300 hover:shadow-lift"
            >
              <span aria-hidden className={cn('absolute -top-10 -left-8 -z-10 size-40 rounded-full opacity-70 blur-2xl', p.glow)} />
              <Prop icon={p.icon} tone={p.tone} className="w-14 transition-transform duration-500 group-hover:scale-110 sm:w-16" />
              <h3 className="mt-5 text-xl font-bold tracking-tight">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{p.body}</p>
            </RevealItem>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/safety" variant="dark" size="lg" className="w-full sm:w-auto">
            How we keep every unit safe <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <ButtonLink to="/availability" variant="outline" size="lg" className="w-full sm:w-auto">
            See live stock
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
