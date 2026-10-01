import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { MotionConfig, motion } from 'motion/react'
import { ArrowRight, BookOpenText, Check, ClipboardList, KeyRound, Printer, Thermometer } from 'lucide-react'
import { BRAND, DEMO_MODE } from '@/config/brand'
import { COMPONENTS, COMPONENT_CODES } from '@/data/blood'
import { DEMO_ACCOUNTS } from '@/services/auth'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Checkbox, SectionHeading } from '@/components/ui/primitives'
import { Accordion, Tabs } from '@/components/ui/disclosure'
import { ContactCard, Reveal } from '@/components/content/common'
import { MANUALS, type Audience, type Manual } from '@/components/content/guide/manuals'
import { EXTRA_TERMS, FAQS } from '@/components/content/guide/faq'
import { cn, formatINR } from '@/lib/utils'

const READY: { t: string; d: string }[] = [
  { t: "Doctor's signed requisition", d: 'A clear photo or PDF of the blood requisition form signed by the treating doctor.' },
  { t: "Patient's details", d: 'Full name, age, gender and blood group exactly as on the hospital record.' },
  { t: 'Hospital, ward and UHID', d: 'The partner hospital where the patient is admitted, and their hospital ID if you have it.' },
  { t: "Doctor's name and registration number", d: 'Usually printed beside the signature or on the stamp.' },
  { t: 'Component and number of units', d: 'For example "2 units packed red cells", exactly as written on the requisition.' },
  { t: 'A way to pay', d: 'UPI, card or netbanking. Verified hospitals can use a purchase-order number.' },
  { t: 'Your phone, charged', d: 'The handover OTP and live tracking arrive on it.' },
]

const isAudience = (v: string | null): v is Audience => MANUALS.some((m) => m.key === v)

export default function Guide() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('for')
  const [audience, setAudience] = useState<Audience>(isAudience(initial) ? initial : 'patients')
  const [ready, setReady] = useState<boolean[]>(() => READY.map(() => false))
  const { hash } = useLocation()

  // The page is lazy-loaded, so the layout's hash scroll can fire before we mount.
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => clearTimeout(t)
  }, [hash])

  const choose = (a: Audience, scroll = false) => {
    setAudience(a)
    setParams({ for: a }, { replace: true, preventScrollReset: true })
    if (scroll) document.getElementById('manual')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const readyCount = ready.filter(Boolean).length
  const allReady = readyCount === READY.length

  const contents = [
    { href: '#before', label: 'Before you order' },
    ...MANUALS.map((m) => ({ href: '#manual', label: m.label, audience: m.key })),
    { href: '#glossary', label: 'Glossary' },
    { href: '#faq', label: 'Frequently asked questions' },
  ]

  return (
    <MotionConfig reducedMotion="user">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div
          className="grain pointer-events-none absolute inset-0 opacity-50 mask-[linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />
        <div className="container-page relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
          <div>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
              <BookOpenText className="size-4" aria-hidden /> User manual
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.6 }}
              className="mt-4 text-4xl leading-[1.05] font-bold sm:text-6xl"
            >
              Everything you need, <span className="text-blood-600">step by step.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mt-5 max-w-[58ch] text-lg text-ink-600"
            >
              A plain-language guide to ordering, paying, tracking and receiving blood with {BRAND.name}, for patients' families, hospital
              teams and donors. Read it on screen or print it for the transfusion desk.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="no-print mt-8 flex flex-wrap gap-3"
            >
              <Button variant="dark" size="lg" icon={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
                Print manual
              </Button>
              <a href="#faq" className="inline-flex h-13 items-center gap-2 rounded-full px-5 font-semibold text-ink-800 hover:bg-ink-100">
                Jump to FAQs <ArrowRight className="size-4" aria-hidden />
              </a>
            </motion.div>
          </div>

          <motion.nav
            aria-label="Manual contents"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="rounded-4xl border border-ink-100 bg-paper p-5 shadow-soft sm:p-6"
          >
            <p className="text-xs font-semibold tracking-[0.18em] text-ink-500 uppercase">Contents</p>
            <ol className="mt-3 divide-y divide-ink-100">
              {contents.map((c, i) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    onClick={(e) => {
                      if (!('audience' in c) || !c.audience) return
                      e.preventDefault()
                      choose(c.audience, true)
                    }}
                    className="group flex items-center gap-4 py-2.5 text-ink-800 hover:text-blood-700"
                  >
                    <span className="w-6 font-display text-sm font-bold text-ink-300 tabular group-hover:text-blood-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 font-medium">{c.label}</span>
                    <ArrowRight
                      className="size-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-blood-600"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ol>
          </motion.nav>
        </div>
      </section>

      {/* ---------- Before you order ---------- */}
      <section id="before" className="container-page scroll-mt-24 py-16 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <Reveal>
            <div className="rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-10 print:break-inside-avoid">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    <ClipboardList className="size-4" aria-hidden /> Checklist
                  </p>
                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Before you order, keep ready</h2>
                  <p className="mt-2 max-w-[56ch] text-ink-600">Having these to hand turns a ten-minute order into a two-minute one.</p>
                </div>
                <div className="no-print text-right" aria-live="polite">
                  <p className="font-display text-3xl font-bold text-ink-950 tabular">
                    {readyCount}
                    <span className="text-ink-300">/{READY.length}</span>
                  </p>
                  <p className="text-xs text-ink-500">ready</p>
                </div>
              </div>
              <div className="no-print mt-5 h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                <motion.div
                  className="h-full rounded-full bg-blood-600"
                  animate={{ width: `${(readyCount / READY.length) * 100}%` }}
                  transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                />
              </div>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {READY.map((r, i) => (
                  <li key={r.t}>
                    <Checkbox
                      checked={ready[i]}
                      onChange={(v) => setReady((prev) => prev.map((p, j) => (j === i ? v : p)))}
                      className={cn(
                        'h-full rounded-2xl border p-4 transition-colors',
                        ready[i] ? 'border-blood-200 bg-blood-50/50' : 'border-ink-100 bg-paper hover:border-ink-200',
                      )}
                    >
                      <span className="block font-semibold text-ink-950">{r.t}</span>
                      <span className="mt-0.5 block text-ink-600">{r.d}</span>
                    </Checkbox>
                  </li>
                ))}
              </ul>
              <div className="no-print mt-6 flex flex-wrap items-center gap-3">
                <ButtonLink to="/order" variant={allReady ? 'primary' : 'outline'} size="md">
                  {allReady ? "You're ready. Order blood" : 'Order blood'} <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <p className="text-sm text-ink-500">Emergency? You can start the order and add details as you go.</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col gap-6">
            {DEMO_MODE && (
              <div className="rounded-4xl border border-dashed border-ink-200 bg-white p-6 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                  <KeyRound className="size-4 text-blood-600" aria-hidden /> Try it with a demo account
                </p>
                <p className="mt-1 text-sm text-ink-500">Prototype only. Nothing you do here dispatches real blood.</p>
                <ul className="mt-4 space-y-3">
                  {DEMO_ACCOUNTS.map((d) => (
                    <li key={d.email} className="rounded-2xl bg-paper p-4 ring-1 ring-ink-100">
                      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{d.label}</p>
                      <p className="mt-1 truncate font-mono text-sm text-ink-900">{d.email}</p>
                      <p className="font-mono text-sm text-ink-600">{d.password}</p>
                    </li>
                  ))}
                </ul>
                <ButtonLink to="/login" variant="ghost" size="sm" className="mt-3 -ml-2">
                  Sign in <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              </div>
            )}
            <div className="rounded-4xl bg-ice-50 p-6 ring-1 ring-ice-100 sm:p-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-ice-700">
                <Thermometer className="size-4" aria-hidden /> Good to know
              </p>
              <p className="mt-2 text-ink-700">
                We deliver only to registered partner hospitals, against a doctor's requisition. The hospital cross-matches every unit
                before transfusion.{' '}
                <Link to="/safety" className="font-semibold text-ice-700 underline underline-offset-4">
                  How we keep blood safe
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Manuals ---------- */}
      <section id="manual" className="scroll-mt-20 border-y border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Step by step"
              title="Choose your manual"
              description="Each manual walks through the screens you will see, in the order you will see them."
            />
          </Reveal>
          <div className="no-print sticky top-16 z-20 -mx-4 mt-8 bg-white/85 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:px-0 lg:top-18">
            <div className="relative max-w-full overflow-x-auto no-scrollbar">
              <Tabs<Audience>
                value={audience}
                onChange={(v) => choose(v)}
                tabs={MANUALS.map((m) => ({
                  value: m.key,
                  label: (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="hidden sm:inline-flex">{m.icon}</span>
                      <span className="sm:hidden">{m.short}</span>
                      <span className="hidden sm:inline">{m.label}</span>
                    </span>
                  ),
                }))}
              />
            </div>
          </div>

          {MANUALS.map((m) => (
            <ManualPanel key={m.key} manual={m} active={m.key === audience} />
          ))}
        </div>
      </section>

      {/* ---------- Glossary ---------- */}
      <section id="glossary" className="container-page scroll-mt-24 py-16 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Glossary"
            title="The words you'll see on a requisition"
            description="Blood is separated into components so each patient gets exactly what they need. Charges shown are indicative NBTC-guided caps per unit; confirm current rates at checkout."
          />
        </Reveal>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COMPONENT_CODES.map((code, i) => {
            const c = COMPONENTS[code]
            return (
              <li key={code}>
                <Reveal
                  delay={i * 0.04}
                  className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-soft print:break-inside-avoid"
                >
                  <span className="h-1.5 w-10 rounded-full" style={{ background: c.tone }} aria-hidden />
                  <p className="mt-4 text-xs font-semibold tracking-wide text-ink-400">{c.code}</p>
                  <h3 className="mt-0.5 text-lg leading-snug font-bold">{c.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-600">{c.usedFor}</p>
                  <dl className="mt-4 space-y-1.5 border-t border-ink-100 pt-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Kept at</dt>
                      <dd className="text-right font-medium text-ink-900">{c.tempRange.replace(' with agitation', ', agitated')}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Shelf life</dt>
                      <dd className="text-right font-medium text-ink-900">{c.shelfLife.replace('Up to ', '≤ ')}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-500">Charge cap</dt>
                      <dd className="text-right font-semibold text-ink-950 tabular">{formatINR(c.processingCharge)}</dd>
                    </div>
                  </dl>
                </Reveal>
              </li>
            )
          })}
        </ul>

        <Reveal className="mt-10">
          <div className="rounded-4xl border border-ink-100 bg-white p-6 shadow-soft sm:p-10">
            <h3 className="text-2xl font-bold">Other terms</h3>
            <dl className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
              {EXTRA_TERMS.map((t) => (
                <div key={t.term} className="border-l-2 border-blood-100 pl-4">
                  <dt className="font-semibold text-ink-950">{t.term}</dt>
                  <dd className="mt-0.5 text-ink-600">{t.def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-24 border-t border-ink-100 bg-white py-16 sm:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <Reveal>
              <SectionHeading
                eyebrow="FAQ"
                title="Frequently asked questions"
                description="Straight answers to the questions families and hospitals ask us most."
              />
            </Reveal>
            <Reveal className="mt-10 print:hidden" delay={0.05}>
              <Accordion items={FAQS} className="bg-paper" />
            </Reveal>
            <dl className="mt-8 hidden space-y-6 print:block">
              {FAQS.map((f) => (
                <div key={f.q} className="break-inside-avoid">
                  <dt className="font-semibold text-ink-950">{f.q}</dt>
                  <dd className="mt-1 text-ink-700">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Reveal delay={0.1} className="lg:sticky lg:top-28 lg:self-start">
            <ContactCard title="Still stuck? Talk to us." />
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  )
}

function ManualPanel({ manual, active }: { manual: Manual; active: boolean }) {
  return (
    <motion.div
      role="tabpanel"
      aria-label={manual.label}
      initial={false}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.35, ease: [0.2, 0.65, 0.3, 1] }}
      className={cn('mt-10', active ? 'block' : 'hidden print:mt-16 print:block', 'print:transform-none! print:opacity-100!')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold sm:text-3xl">{manual.title}</h3>
          <p className="mt-2 max-w-[65ch] text-ink-600">{manual.intro}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-ink-400 tabular">{manual.steps.length} steps</p>
      </div>

      <ol className="mt-10 space-y-6">
        {manual.steps.map((s, i) => (
          <li key={s.title} className="print:break-inside-avoid">
            <Reveal>
              <article className="grid overflow-hidden rounded-4xl border border-ink-100 bg-white shadow-soft lg:grid-cols-2">
                <div className={cn('p-6 sm:p-10', i % 2 === 1 && 'lg:order-2')}>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-5xl leading-none font-bold text-blood-600 tabular">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="h-px flex-1 bg-ink-100" aria-hidden />
                  </div>
                  <h4 className="mt-5 font-display text-2xl font-bold text-ink-950">{s.title}</h4>
                  <div className="mt-3 max-w-[60ch] leading-relaxed text-ink-600 [&_strong]:font-semibold [&_strong]:text-ink-900">
                    {s.body}
                  </div>
                  {s.points && (
                    <ul className="mt-5 space-y-2.5">
                      {s.points.map((p, j) => (
                        <li key={j} className="flex gap-3 text-sm text-ink-700 [&_strong]:font-semibold [&_strong]:text-ink-900">
                          <span
                            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-blood-50 text-blood-600"
                            aria-hidden
                          >
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.link && (
                    <Link
                      to={s.link.to}
                      className="no-print group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blood-700 hover:text-blood-800"
                    >
                      {s.link.label}
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  )}
                </div>
                <div className="relative flex items-center justify-center overflow-hidden bg-paper px-5 py-10 sm:px-10">
                  <div className="grain pointer-events-none absolute inset-0 opacity-70" aria-hidden />
                  <div
                    className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blood-100/40 blur-3xl"
                    aria-hidden
                  />
                  <div className="relative w-full">{s.mock}</div>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </motion.div>
  )
}
