import { useEffect, useRef, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowRight, ArrowUp, CalendarDays, ChevronDown, ListOrdered, Printer } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/disclosure'
import { DraftNotice } from '@/components/content/common'
import { useScrollSpy } from '@/components/content/useScrollSpy'
import { LEGAL_DOCS, LEGAL_LAST_UPDATED, LEGAL_VERSION, isDocKey, legalDoc, type DocKey, type LegalDoc } from '@/components/content/legal'
import { cn } from '@/lib/utils'

function formatLegalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(BRAND.locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

const sectionId = (key: DocKey, i: number) => `${key}-${i + 1}`

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Legal() {
  const { doc } = useParams()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const key: DocKey = isDocKey(doc) ? doc : 'terms'
  const current = legalDoc(key)
  const ids = current.sections.map((_, i) => sectionId(key, i))
  const active = useScrollSpy(ids)
  const tocRef = useRef<HTMLDetailsElement>(null)
  const updated = formatLegalDate(LEGAL_LAST_UPDATED)

  // Unknown documents fall back to the terms, with a clean URL.
  useEffect(() => {
    if (doc && !isDocKey(doc)) navigate('/legal/terms', { replace: true })
  }, [doc, navigate])

  // Deep links such as /legal/privacy#privacy-10 (page is lazy-loaded, so wait a tick).
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => scrollToId(hash.slice(1)), 120)
    return () => clearTimeout(t)
  }, [hash, key])

  const onTocClick = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    scrollToId(id)
    if (tocRef.current) tocRef.current.open = false
  }

  const Icon = current.icon

  return (
    <MotionConfig reducedMotion="user">
      {/* ---------- Header ---------- */}
      <header className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div
          className="grain pointer-events-none absolute inset-0 opacity-50 mask-[linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />
        <div className="container-page relative pt-10 pb-6 sm:pt-14">
          <p className="eyebrow">Legal centre</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-4 flex items-start gap-4"
            >
              <span
                className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-ink-950 text-white shadow-lift sm:grid"
                aria-hidden
              >
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <h1 className="text-4xl font-bold sm:text-5xl">{current.title}</h1>
                <p className="mt-3 max-w-[62ch] text-lg text-ink-600">{current.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-ink-400" aria-hidden />
              Last updated{' '}
              <time dateTime={LEGAL_LAST_UPDATED} className="font-semibold text-ink-900">
                {updated}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
              {LEGAL_VERSION} · pending legal review
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="no-print -ml-1"
              icon={<Printer className="size-4" aria-hidden />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>

          <div className="relative no-print -mx-4 mt-8 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
            <Tabs<DocKey>
              value={key}
              onChange={(k) => navigate(`/legal/${k}`)}
              tabs={LEGAL_DOCS.map((d) => ({
                value: d.key,
                label: (
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    <d.icon className="hidden size-4 sm:block" aria-hidden />
                    {d.tabLabel}
                  </span>
                ),
              }))}
            />
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <aside className="no-print hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-ink-500 uppercase">
              <ListOrdered className="size-4" aria-hidden /> On this page
            </p>
            <ol className="mt-4 space-y-0.5 border-l border-ink-100">
              {current.sections.map((s, i) => {
                const id = sectionId(key, i)
                const on = active === id
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={onTocClick(id)}
                      aria-current={on ? 'location' : undefined}
                      className={cn(
                        '-ml-px flex gap-2 border-l-2 py-1.5 pr-2 pl-4 text-sm transition-colors',
                        on
                          ? 'border-blood-600 font-semibold text-ink-950'
                          : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-900',
                      )}
                    >
                      <span className="w-5 shrink-0 tabular">{i + 1}.</span>
                      <span>{s.title}</span>
                    </a>
                  </li>
                )
              })}
            </ol>
            <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-4 text-sm shadow-soft">
              <p className="font-semibold text-ink-950">Questions about a policy?</p>
              <a href={`mailto:${BRAND.supportEmail}`} className="mt-1 block wrap-break-word text-blood-700 hover:underline">
                {BRAND.supportEmail}
              </a>
            </div>
          </nav>
        </aside>

        {/* Keyed remount (no exit wait) so section ids exist when the scroll spy re-binds. */}
        <motion.article
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.65, 0.3, 1] }}
          className="min-w-0 max-w-3xl"
          aria-label={current.title}
        >
          <DraftNotice />

          {/* Mobile table of contents */}
          <details ref={tocRef} className="no-print group mt-6 rounded-2xl border border-ink-100 bg-white shadow-soft lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-ink-950 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <ListOrdered className="size-4 text-ink-400" aria-hidden /> On this page
              </span>
              <span className="text-sm font-medium text-ink-500">
                {current.sections.length} sections
                <ChevronDown className="ml-1.5 inline-block size-4 align-[-3px] transition-transform group-open:rotate-180" aria-hidden />
              </span>
            </summary>
            <ol className="border-t border-ink-100 px-3 py-2">
              {current.sections.map((s, i) => {
                const id = sectionId(key, i)
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      onClick={onTocClick(id)}
                      className="flex gap-2 rounded-xl px-2 py-2 text-[15px] text-ink-700 hover:bg-ink-50"
                    >
                      <span className="w-6 shrink-0 text-ink-400 tabular">{i + 1}.</span>
                      {s.title}
                    </a>
                  </li>
                )
              })}
            </ol>
          </details>

          <InShort doc={current} />

          {current.intro && <div className="mt-10">{current.intro}</div>}

          <div className="mt-4">
            {current.sections.map((s, i) => {
              const id = sectionId(key, i)
              return (
                <section
                  key={id}
                  id={id}
                  aria-labelledby={`${id}-h`}
                  className="mt-10 scroll-mt-28 border-t border-ink-100 pt-10 first:mt-6"
                >
                  <h2 id={`${id}-h`} className="flex gap-3 text-2xl font-bold sm:text-[1.75rem]">
                    <span className="text-blood-600 tabular">{i + 1}.</span>
                    <span>{s.title}</span>
                  </h2>
                  <div className="mt-4 max-w-[68ch] space-y-4 text-[17px] leading-[1.75] text-ink-700 [&_strong]:font-semibold [&_strong]:text-ink-900">
                    {s.content}
                  </div>
                </section>
              )
            })}
          </div>

          <div className="no-print mt-14 flex items-center justify-between gap-4 border-t border-ink-100 pt-8">
            <p className="text-sm text-ink-500">
              {BRAND.company} · {LEGAL_VERSION} · Last updated {updated}
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100"
            >
              <ArrowUp className="size-4" aria-hidden /> Top
            </button>
          </div>

          <RelatedDocs current={key} />
        </motion.article>
      </div>
    </MotionConfig>
  )
}

function InShort({ doc }: { doc: LegalDoc }) {
  return (
    <div className="mt-8 rounded-3xl bg-ink-950 p-6 text-ink-300 sm:p-8">
      <p className="text-xs font-semibold tracking-[0.18em] text-blood-400 uppercase">In short</p>
      <ul className="mt-4 space-y-3">
        {doc.summary.map((s) => (
          <li key={s} className="flex gap-3 text-[16px] leading-relaxed">
            <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-blood-500" aria-hidden />
            <span className="text-ink-200">{s}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-white/10 pt-4 text-sm text-ink-400">
        This summary helps you find your way. The numbered sections below are the full text.
      </p>
    </div>
  )
}

function RelatedDocs({ current }: { current: DocKey }) {
  return (
    <nav aria-label="Other policies" className="no-print mt-10">
      <p className="text-xs font-semibold tracking-[0.18em] text-ink-500 uppercase">Other policies</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {LEGAL_DOCS.filter((d) => d.key !== current).map((d) => (
          <li key={d.key}>
            <Link
              to={`/legal/${d.key}`}
              className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <d.icon className="size-5 text-blood-600" aria-hidden />
              <span className="mt-4 font-display text-lg leading-snug font-bold text-ink-950">{d.title}</span>
              <span className="mt-1 flex-1 text-sm text-ink-600">{d.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blood-700">
                Read <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
