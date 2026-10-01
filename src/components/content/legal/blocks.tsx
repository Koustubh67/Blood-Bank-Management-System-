import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import { Info, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

export type DocKey = 'terms' | 'privacy' | 'refunds' | 'compliance'

export interface LegalSection {
  title: string
  content: ReactNode
}

export interface LegalDoc {
  key: DocKey
  title: string
  tabLabel: string
  description: string
  icon: LucideIcon
  /** Plain-language key points shown above the full text */
  summary: string[]
  /** Optional rich block rendered before the numbered sections */
  intro?: ReactNode
  sections: LegalSection[]
}

/** Bulleted list with brand-coloured markers. */
export function List({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          {ordered ? (
            <span className="mt-0.5 w-5 shrink-0 font-semibold text-blood-600 tabular">{String.fromCharCode(97 + i)})</span>
          ) : (
            <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-blood-500" aria-hidden />
          )}
          <span>{item}</span>
        </li>
      ))}
    </Tag>
  )
}

export function Callout({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'ice' | 'red'; title?: string }) {
  const tones = {
    neutral: 'bg-ink-50 ring-ink-100',
    ice: 'bg-ice-50 ring-ice-100',
    red: 'bg-blood-50 ring-blood-100',
  }
  return (
    <div className={cn('flex gap-3 rounded-2xl p-4 text-[15px] ring-1 sm:p-5', tones[tone])}>
      <Info
        className={cn('mt-0.5 size-5 shrink-0', tone === 'ice' ? 'text-ice-700' : tone === 'red' ? 'text-blood-600' : 'text-ink-500')}
        aria-hidden
      />
      <div>
        {title && <p className="font-semibold text-ink-950">{title}</p>}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
    </div>
  )
}

export function DocLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-blood-700 underline decoration-blood-200 underline-offset-4 hover:decoration-blood-600">
      {children}
    </Link>
  )
}

export function Mailto() {
  return (
    <a
      href={`mailto:${BRAND.supportEmail}`}
      className="font-medium text-blood-700 underline decoration-blood-200 underline-offset-4 hover:decoration-blood-600"
    >
      {BRAND.supportEmail}
    </a>
  )
}

/** Grievance officer details required on the site by the E-Commerce Rules and the DPDP Act. */
export function GrievanceCard({ className }: { className?: string }) {
  const rows = [
    { icon: UserRound, label: 'Designation', value: BRAND.grievanceOfficer, note: 'Name to be published on appointment' },
    { icon: Mail, label: 'Email', value: <Mailto /> },
    {
      icon: Phone,
      label: 'Phone',
      value: (
        <a href={`tel:${BRAND.supportPhone}`} className="font-medium text-ink-900 tabular hover:text-blood-700">
          {BRAND.supportPhone}
        </a>
      ),
    },
    { icon: MapPin, label: 'Post', value: `${BRAND.company}, ${BRAND.address}` },
  ]
  return (
    <div className={cn('rounded-3xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6', className)}>
      <p className="font-display text-lg font-bold text-ink-950">Grievance Officer</p>
      <dl className="mt-4 space-y-3 text-[15px]">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-3">
            <r.icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{r.label}</dt>
              <dd className="wrap-break-word text-ink-900">
                {r.value}
                {r.note && <span className="block text-xs text-ink-500">{r.note}</span>}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-600">
        We acknowledge complaints within 48 hours and aim to resolve them within one month of receipt, as the Consumer Protection
        (E-Commerce) Rules, 2020 require.
      </p>
    </div>
  )
}
