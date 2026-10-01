import type { ReactNode } from 'react'
import {
  Building2,
  CalendarCheck,
  Check,
  CircleCheck,
  CreditCard,
  FileText,
  FlaskConical,
  Heart,
  House,
  IdCard,
  Landmark,
  Lock,
  LockKeyhole,
  Minus,
  Plus,
  Siren,
  Smartphone,
  Thermometer,
} from 'lucide-react'
import { BLOOD_GROUPS, COMPONENTS, PRIORITIES } from '@/data/blood'
import { PARTNER_HOSPITALS, SEED_CENTRES } from '@/data/network'
import { FEES } from '@/config/brand'
import { quote } from '@/services/orders'
import { TEST_INSTRUMENTS } from '@/services/payments'
import { cn, formatINR } from '@/lib/utils'

// ---------- building blocks ----------

/** Browser-style frame around a stylised UI illustration. */
export function MockFrame({ path, label, children, className }: { path: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative mx-auto w-full max-w-88 rounded-[1.75rem] border border-ink-100 bg-white p-2.5 shadow-lift select-none',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-2 pt-1 pb-2.5" aria-hidden>
        <span className="size-2 rounded-full bg-ink-200" />
        <span className="size-2 rounded-full bg-ink-200" />
        <span className="size-2 rounded-full bg-ink-200" />
        <span className="ml-2 flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-full bg-ink-50 px-2.5 text-[10px] text-ink-500">
          <Lock className="size-2.5 shrink-0" />
          <span className="truncate">raktflow{path}</span>
        </span>
      </div>
      <div className="rounded-[1.25rem] bg-paper p-4" aria-hidden>
        {children}
      </div>
    </div>
  )
}

function MTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="font-display text-[15px] leading-tight font-bold text-ink-950">{children}</p>
      {sub && <p className="mt-0.5 text-[10px] text-ink-500">{sub}</p>}
    </div>
  )
}

function MField({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-2', className)}>
      <p className="text-[9px] font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
      <div className="mt-1 flex h-8 items-center rounded-xl border border-ink-200 bg-white px-2.5 text-[11px] text-ink-900">{value}</div>
    </div>
  )
}

function MButton({ children, tone = 'red', className }: { children: ReactNode; tone?: 'red' | 'dark' | 'outline'; className?: string }) {
  return (
    <div
      className={cn(
        'mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full text-[11px] font-semibold',
        tone === 'red' && 'bg-blood-600 text-white shadow-glow',
        tone === 'dark' && 'bg-ink-950 text-white',
        tone === 'outline' && 'border border-blood-200 bg-white text-blood-700',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Tick({ on = true }: { on?: boolean }) {
  return (
    <span
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-md',
        on ? 'bg-blood-600 text-white' : 'border border-ink-300 bg-white',
      )}
    >
      {on && <Check className="size-2.5" strokeWidth={3.5} />}
    </span>
  )
}

function Segmented({ options, active }: { options: string[]; active: number }) {
  return (
    <div
      className="grid rounded-full bg-white p-0.5 text-[10px] font-semibold ring-1 ring-ink-100"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => (
        <span
          key={o}
          className={cn('truncate rounded-full px-1 py-1.5 text-center', i === active ? 'bg-ink-950 text-white' : 'text-ink-500')}
        >
          {o}
        </span>
      ))}
    </div>
  )
}

const SAMPLE_ITEMS = [{ component: 'PRBC' as const, group: 'B+' as const, units: 2 }]
const SAMPLE_PRICE = quote(SAMPLE_ITEMS)

// ---------- patients & families ----------

export function MockSignup({ hospital = false }: { hospital?: boolean }) {
  return (
    <MockFrame
      path="/signup"
      label={hospital ? 'Sign-up form with the hospital option selected' : 'Sign-up form with the patient or family option selected'}
    >
      <MTitle sub="Takes about a minute">Create your account</MTitle>
      <Segmented options={['Patient / family', 'Hospital']} active={hospital ? 1 : 0} />
      {hospital ? (
        <>
          <MField label="Facility" value={<span className="truncate">{PARTNER_HOSPITALS[0].name}</span>} />
          <MField label="Registration no." value={PARTNER_HOSPITALS[0].registrationNo.replace(' (demo)', '')} />
          <MField label="Work email" value="bloodbank@citycare.example" />
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-2.5 py-2 text-[10px] font-medium text-amber-800 ring-1 ring-amber-100">
            <Building2 className="size-3.5" /> Verification by our partnerships team
          </div>
        </>
      ) : (
        <>
          <MField label="Full name" value="Aarav Sharma" />
          <MField label="Mobile" value="98765 43210" />
          <MField label="Email" value="demo@raktflow.example" />
          <MButton>Create account</MButton>
        </>
      )}
    </MockFrame>
  )
}

export function MockOrderBasics() {
  const pr = Object.entries(PRIORITIES) as [keyof typeof PRIORITIES, (typeof PRIORITIES)[keyof typeof PRIORITIES]][]
  return (
    <MockFrame path="/order" label="Order form showing urgency, blood group and component selection">
      <MTitle sub="Step 1 of 4 · What do you need?">New blood order</MTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {pr.map(([key, p]) => (
          <div
            key={key}
            className={cn(
              'rounded-xl px-2 py-1.5 text-center ring-1',
              key === 'emergency' ? 'bg-blood-600 text-white ring-blood-600' : 'bg-white text-ink-700 ring-ink-100',
            )}
          >
            <p className="text-[10px] font-semibold">{p.label}</p>
            <p className={cn('text-[9px]', key === 'emergency' ? 'text-white/80' : 'text-ink-400')}>~{p.targetMinutes} min</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {BLOOD_GROUPS.map((g) => (
          <span
            key={g}
            className={cn(
              'grid h-8 place-items-center rounded-lg font-display text-[12px] font-bold',
              g === 'B+' ? 'bg-blood-600 text-white shadow-glow' : 'bg-white text-ink-800 ring-1 ring-ink-100',
            )}
          >
            {g}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-ink-100">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-ink-900">
          <span className="size-2 rounded-full" style={{ background: COMPONENTS.PRBC.tone }} />
          {COMPONENTS.PRBC.short}
        </span>
        <span className="flex items-center gap-2 text-[11px] font-bold text-ink-950">
          <span className="grid size-5 place-items-center rounded-full bg-ink-100">
            <Minus className="size-3" />
          </span>
          2
          <span className="grid size-5 place-items-center rounded-full bg-ink-950 text-white">
            <Plus className="size-3" />
          </span>
        </span>
      </div>
    </MockFrame>
  )
}

export function MockHospitalPick() {
  return (
    <MockFrame path="/order" label="List of partner hospitals with one selected, and a note that home delivery is not available">
      <MTitle sub="Step 2 of 4 · Patient & hospital">Where is the patient admitted?</MTitle>
      <div className="space-y-1.5">
        {PARTNER_HOSPITALS.slice(0, 3).map((h, i) => (
          <div
            key={h.id}
            className={cn('flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 ring-1', i === 0 ? 'ring-blood-300' : 'ring-ink-100')}
          >
            <span
              className={cn(
                'grid size-3.5 shrink-0 place-items-center rounded-full border',
                i === 0 ? 'border-blood-600' : 'border-ink-300',
              )}
            >
              {i === 0 && <span className="size-1.5 rounded-full bg-blood-600" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-ink-900">{h.name}</span>
              <span className="block text-[9px] text-ink-500">{h.area}</span>
            </span>
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-700">Partner</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-ink-100/70 px-2.5 py-2 text-[10px] text-ink-600">
        <span className="relative grid size-4 place-items-center">
          <House className="size-3.5" />
          <span className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-blood-600" />
        </span>
        Home delivery is not available
      </div>
    </MockFrame>
  )
}

export function MockRequisition() {
  return (
    <MockFrame path="/order" label="Requisition upload with doctor details and three ticked declarations">
      <MTitle sub="Step 3 of 4 · Prescription">Doctor's requisition</MTitle>
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink-300 bg-white px-3 py-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-blood-50 text-blood-600">
          <FileText className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold text-ink-900">requisition-form.jpg</span>
          <span className="block text-[9px] text-ink-500">1.2 MB · uploaded</span>
        </span>
        <CircleCheck className="size-4 text-emerald-600" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MField label="Doctor" value="Dr. R. Menon" />
        <MField label="Reg. no." value="DMC/12345" />
      </div>
      <div className="mt-3 space-y-1.5 text-[10px] text-ink-700">
        <p className="flex gap-2">
          <Tick /> Requisition signed by a registered doctor
        </p>
        <p className="flex gap-2">
          <Tick /> Transfusion only at the hospital
        </p>
        <p className="flex gap-2">
          <Tick /> I accept the terms
        </p>
      </div>
    </MockFrame>
  )
}

export function MockReview() {
  const p = SAMPLE_PRICE
  const rows = [
    { l: `Processing · 2 × ${COMPONENTS.PRBC.short.toLowerCase()}`, v: formatINR(p.processing) },
    { l: 'Cold-chain logistics', v: formatINR(p.logistics) },
    { l: `GST ${Math.round(FEES.logisticsGstRate * 100)}% on logistics`, v: formatINR(p.logisticsGst) },
  ]
  return (
    <MockFrame path="/order" label={`Order review showing a price breakdown totalling ${formatINR(p.total)}`}>
      <MTitle sub="Step 4 of 4 · Review">Check and confirm</MTitle>
      <div className="rounded-xl bg-white p-3 ring-1 ring-ink-100">
        <div className="flex items-center justify-between border-b border-dashed border-ink-200 pb-2 text-[10px]">
          <span className="text-ink-500">Blood itself</span>
          <span className="font-semibold text-emerald-700">₹0 · never sold</span>
        </div>
        {rows.map((r) => (
          <div key={r.l} className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-ink-600">{r.l}</span>
            <span className="font-medium text-ink-900 tabular">{r.v}</span>
          </div>
        ))}
        <div className="mt-2.5 flex items-center justify-between border-t border-ink-100 pt-2.5">
          <span className="text-[11px] font-semibold text-ink-950">Total</span>
          <span className="font-display text-base font-bold text-ink-950 tabular">{formatINR(p.total)}</span>
        </div>
      </div>
      <MButton>Continue to payment</MButton>
    </MockFrame>
  )
}

export function MockPayment({ credit = false }: { credit?: boolean }) {
  return (
    <MockFrame
      path="/checkout"
      label={
        credit ? 'Checkout with hospital credit selected and a purchase-order field' : 'Checkout with card selected and a test-mode notice'
      }
    >
      <MTitle sub={`Pay ${formatINR(SAMPLE_PRICE.total)} securely`}>Payment</MTitle>
      <div className={cn('grid gap-1.5', credit ? 'grid-cols-4' : 'grid-cols-3')}>
        {[
          { i: <Smartphone className="size-3.5" />, l: 'UPI' },
          { i: <CreditCard className="size-3.5" />, l: 'Card' },
          { i: <Landmark className="size-3.5" />, l: 'Bank' },
          ...(credit ? [{ i: <Building2 className="size-3.5" />, l: 'Credit' }] : []),
        ].map((m) => {
          const on = credit ? m.l === 'Credit' : m.l === 'Card'
          return (
            <span
              key={m.l}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] font-semibold ring-1',
                on ? 'bg-ink-950 text-white ring-ink-950' : 'bg-white text-ink-600 ring-ink-100',
              )}
            >
              {m.i}
              {m.l}
            </span>
          )
        })}
      </div>
      {credit ? (
        <>
          <MField label="Purchase-order number" value="PO-2026-0917" />
          <p className="mt-2 text-[9px] text-ink-500">Available to verified hospitals only</p>
        </>
      ) : (
        <>
          <div className="mt-2.5 rounded-xl bg-amber-50 px-2.5 py-2 text-[9px] text-amber-800 ring-1 ring-amber-100">
            <span className="font-semibold">Test mode:</span> use {TEST_INSTRUMENTS.cardSuccess}
          </div>
          <MField label="Card number" value={<span className="tabular">{TEST_INSTRUMENTS.cardSuccess}</span>} />
        </>
      )}
      <MButton>Pay {formatINR(SAMPLE_PRICE.total)}</MButton>
    </MockFrame>
  )
}

export function MockSuccess() {
  return (
    <MockFrame path="/order/RF-7K2M9Q/success" label="Order confirmation with order ID and a four-digit handover OTP">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/60">
          <CircleCheck className="size-6" />
        </span>
        <p className="mt-2 font-display text-[15px] font-bold text-ink-950">Order placed</p>
        <p className="text-[10px] text-ink-500 tabular">RF-7K2M9Q</p>
      </div>
      <div className="mt-3 rounded-xl bg-ink-950 p-3 text-center">
        <p className="text-[9px] font-semibold tracking-[0.18em] text-ink-400 uppercase">Handover OTP</p>
        <div className="mt-2 flex justify-center gap-1.5">
          {['4', '8', '2', '6'].map((d, i) => (
            <span key={i} className="grid h-9 w-8 place-items-center rounded-lg bg-white/10 font-display text-lg font-bold text-white">
              {d}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-ink-400">Share only at the blood transfusion desk</p>
      </div>
      <MButton tone="dark">Track live</MButton>
    </MockFrame>
  )
}

export function MockTracking() {
  return (
    <MockFrame path="/track/RF-7K2M9Q" label="Live tracking map with route, rider position, ETA and cold-box temperature">
      <div className="relative h-36 overflow-hidden rounded-xl bg-ink-100">
        <svg viewBox="0 0 300 150" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
          <g stroke="white" strokeWidth="6" opacity="0.9">
            <path d="M0 40h300M0 100h300M60 0v150M170 0v150M240 0v150" />
          </g>
          <g stroke="white" strokeWidth="2.5" opacity="0.7">
            <path d="M0 70h300M0 125h300M20 0v150M110 0v150M205 0v150M275 0v150" />
          </g>
          <path
            d="M40 118 H110 V70 H205 V40 H262"
            fill="none"
            stroke="var(--color-ink-300)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 118 H110 V70 H165"
            fill="none"
            stroke="var(--color-blood-600)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="118" r="6" fill="white" stroke="var(--color-ink-950)" strokeWidth="3" />
          <circle cx="262" cy="40" r="7" fill="var(--color-ink-950)" />
          <circle cx="165" cy="70" r="12" fill="var(--color-blood-600)" opacity="0.2" />
          <circle cx="165" cy="70" r="6" fill="var(--color-blood-600)" stroke="white" strokeWidth="2.5" />
        </svg>
        <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-1 text-[9px] font-semibold text-blood-700 shadow-soft">
          Out for delivery
        </span>
        <span className="absolute top-2 right-2 rounded-lg bg-ink-950 px-2 py-1 text-center text-white shadow-soft">
          <span className="block text-[8px] text-ink-400">ETA</span>
          <span className="block font-display text-[13px] leading-none font-bold tabular">06:42</span>
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        <span className="flex items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 text-[10px] ring-1 ring-ink-100">
          <Thermometer className="size-3 text-ice-600" />
          <span className="text-ink-600">Red cells</span>
          <span className="ml-auto font-semibold text-ink-950 tabular">4.1 °C</span>
        </span>
        <span className="flex items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 text-[10px] ring-1 ring-ink-100">
          <LockKeyhole className="size-3 text-emerald-600" />
          <span className="text-ink-600">Seal</span>
          <span className="ml-auto font-semibold text-emerald-700">Intact</span>
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-1">
        {[1, 1, 1, 1, 0, 0].map((d, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full', d ? 'bg-blood-600' : 'bg-ink-200')} />
        ))}
      </div>
    </MockFrame>
  )
}

export function MockCancel() {
  const steps = [
    { l: 'Placed', done: true },
    { l: 'Verified', done: true },
    { l: 'Packed', done: false },
    { l: 'On the way', done: false },
  ]
  return (
    <MockFrame path="/orders" label="Order card with a cancellation window that closes once the order is packed">
      <div className="rounded-xl bg-white p-3 ring-1 ring-ink-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink-900 tabular">RF-7K2M9Q</span>
          <span className="rounded-full bg-ice-50 px-2 py-0.5 text-[9px] font-semibold text-ice-700">Requisition verified</span>
        </div>
        <div className="relative mt-3 grid grid-cols-4">
          <span className="absolute top-[5px] right-[12.5%] left-[12.5%] h-0.5 bg-ink-100" />
          <span className="absolute top-[5px] left-[12.5%] h-0.5 w-1/4 bg-blood-600" />
          {steps.map((s) => (
            <span key={s.l} className="relative flex flex-col items-center gap-1">
              <span className={cn('size-3 rounded-full ring-2 ring-white', s.done ? 'bg-blood-600' : 'bg-ink-200')} />
              <span className="text-[8px] text-ink-500">{s.l}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-center text-[9px] font-medium text-emerald-800">
          Free cancellation until the order is packed
        </div>
      </div>
      <MButton tone="outline">Cancel order</MButton>
      <p className="mt-2 text-center text-[9px] text-ink-500">Refund to source in 5–7 working days</p>
    </MockFrame>
  )
}

// ---------- hospitals ----------

export function MockDashboard() {
  const tiles = [
    { l: 'Active orders', v: '2' },
    { l: 'Arriving now', v: '1' },
    { l: 'O− nearby', v: '12' },
  ]
  return (
    <MockFrame path="/hospital" label="Hospital dashboard with order tiles and a list of recent orders">
      <MTitle sub="Blood transfusion desk">CityCare dashboard</MTitle>
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-xl bg-white px-2 py-2 ring-1 ring-ink-100">
            <p className="font-display text-lg leading-none font-bold text-ink-950 tabular">{t.v}</p>
            <p className="mt-1 text-[8.5px] leading-tight text-ink-500">{t.l}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5 space-y-1.5">
        {[
          { id: 'RF-Q8P2LM', s: 'Arriving now', c: 'bg-blood-50 text-blood-700', d: 'O− · 2 × red cells · ICU' },
          { id: 'RF-4HX7TD', s: 'Packed', c: 'bg-ice-50 text-ice-700', d: 'A+ · 4 × platelets · Ward 3' },
        ].map((o) => (
          <div key={o.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-ink-100">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-ink-900 tabular">{o.id}</span>
              <span className="block truncate text-[9px] text-ink-500">{o.d}</span>
            </span>
            <span className={cn('rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold', o.c)}>{o.s}</span>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

export function MockEmergency() {
  return (
    <MockFrame path="/hospital" label="One-tap emergency order button with pre-filled hospital and priority">
      <MTitle sub="Facility and priority are pre-filled">Emergency order</MTitle>
      <div className="relative mx-auto my-2 grid size-28 place-items-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-blood-500/40 motion-reduce:hidden" />
        <span className="absolute inset-2 rounded-full bg-blood-100" />
        <span className="relative grid size-20 place-items-center rounded-full bg-blood-600 text-white shadow-glow">
          <span className="flex flex-col items-center gap-0.5 text-[9px] font-bold tracking-wide uppercase">
            <Siren className="size-6" />
            Tap
          </span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-ink-700 ring-1 ring-ink-100">Priority: Emergency</span>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-ink-700 ring-1 ring-ink-100">To: CityCare desk</span>
        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-medium text-ink-700 ring-1 ring-ink-100">
          Requisition required
        </span>
      </div>
    </MockFrame>
  )
}

export function MockHandover() {
  return (
    <MockFrame path="/track/RF-Q8P2LM" label="Handover checklist: seal intact, logger in range, labels match, then OTP">
      <MTitle sub="At the blood transfusion desk">Receive the cold box</MTitle>
      <div className="space-y-1.5 text-[10px]">
        {[
          { l: 'Tamper-evident seal intact', i: <LockKeyhole className="size-3" /> },
          { l: 'Logger 4.2 °C · in range', i: <Thermometer className="size-3" /> },
          { l: 'Labels match the requisition', i: <FileText className="size-3" /> },
        ].map((r) => (
          <div key={r.l} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-ink-100">
            <span className="text-ink-400">{r.i}</span>
            <span className="flex-1 text-ink-800">{r.l}</span>
            <CircleCheck className="size-3.5 text-emerald-600" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[9px] font-semibold tracking-wide text-ink-500 uppercase">Read OTP to rider</p>
      <div className="mt-1.5 flex gap-1.5">
        {['4', '8', '2', '6'].map((d, i) => (
          <span
            key={i}
            className="grid h-9 flex-1 place-items-center rounded-lg bg-white font-display text-base font-bold text-ink-950 ring-1 ring-ink-200"
          >
            {d}
          </span>
        ))}
      </div>
      <MButton tone="dark">Handover complete</MButton>
    </MockFrame>
  )
}

export function MockCrossmatch() {
  return (
    <MockFrame path="/orders" label="Delivered order reminding staff to cross-match and do a bedside identity check">
      <div className="flex items-center justify-between">
        <MTitle sub="Handed over at 14:32">Delivered</MTitle>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">OTP verified</span>
      </div>
      <div className="space-y-1.5">
        {[
          { l: 'Cross-match with patient sample', i: <FlaskConical className="size-3.5" /> },
          { l: 'Bedside identity check', i: <CircleCheck className="size-3.5" /> },
          { l: 'Transfuse under supervision', i: <Building2 className="size-3.5" /> },
        ].map((r, i) => (
          <div key={r.l} className="flex items-center gap-2.5 rounded-xl bg-white px-2.5 py-2 text-[10px] ring-1 ring-ink-100">
            <span className="grid size-6 place-items-center rounded-lg bg-ink-950 text-white">{r.i}</span>
            <span className="flex-1 text-ink-800">{r.l}</span>
            <span className="text-[9px] font-semibold text-ink-400 tabular">0{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[9px] text-ink-500">Done by hospital staff, never by the rider</p>
    </MockFrame>
  )
}

// ---------- donors ----------

export function MockEligibility() {
  const rows = [
    'Age 18–65 years',
    'Weight 45 kg or more',
    'Feeling fit and well today',
    'No tattoo or piercing in 12 months',
    'Last donation 90 / 120+ days ago',
  ]
  return (
    <MockFrame path="/donate" label="Donor eligibility self-check with all criteria ticked and an eligible result">
      <MTitle sub="Takes 30 seconds">Can I donate?</MTitle>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <p key={r} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-[10px] text-ink-800 ring-1 ring-ink-100">
            <Tick /> {r}
          </p>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-50 px-2.5 py-2 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
        <CircleCheck className="size-3.5" /> You look eligible to donate
      </div>
    </MockFrame>
  )
}

export function MockSlots() {
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
  const centre = SEED_CENTRES[1]
  return (
    <MockFrame path="/donate" label="Slot picker with a blood centre selected and a morning time slot chosen">
      <MTitle sub="Pick a centre and a time">Book a donation slot</MTitle>
      <MField
        label="Blood centre"
        value={
          <span className="truncate">
            {centre.name} · {centre.area}
          </span>
        }
        className="mt-0"
      />
      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-ink-700">
        <CalendarCheck className="size-3.5 text-blood-600" /> Tomorrow
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {slots.map((s, i) => (
          <span
            key={s}
            className={cn(
              'grid h-8 place-items-center rounded-lg text-[10px] font-semibold tabular',
              i === 1 && 'bg-blood-600 text-white shadow-glow',
              i === 4 && 'bg-ink-100 text-ink-300 line-through',
              i !== 1 && i !== 4 && 'bg-white text-ink-800 ring-1 ring-ink-100',
            )}
          >
            {s}
          </span>
        ))}
      </div>
      <MButton>Confirm slot</MButton>
    </MockFrame>
  )
}

export function MockDonationDay() {
  const steps = [
    { t: 'Registration & ID', d: 'Form and health questionnaire' },
    { t: 'Mini health check', d: 'Haemoglobin, BP, weight' },
    { t: 'Donation', d: 'About 10 min' },
    { t: 'Rest & refreshments', d: '10–15 min' },
  ]
  return (
    <MockFrame path="/donate" label="Timeline of a donation visit: registration, health check, donation, rest">
      <MTitle sub="Plan for about an hour">Your donation visit</MTitle>
      <ol className="relative space-y-2.5 pl-5">
        <span className="absolute top-1.5 bottom-1.5 left-[5px] w-0.5 rounded-full bg-blood-100" />
        {steps.map((s, i) => (
          <li key={s.t} className="relative">
            <span
              className={cn('absolute top-1 -left-5 size-3 rounded-full ring-2 ring-paper', i === 2 ? 'bg-blood-600' : 'bg-blood-300')}
            />
            <p className="text-[11px] font-semibold text-ink-900">{s.t}</p>
            <p className="text-[9px] text-ink-500">{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[10px] text-ink-700 ring-1 ring-ink-100">
        <IdCard className="size-3.5 text-blood-600" /> Carry a photo ID and eat a light meal
      </div>
    </MockFrame>
  )
}

export function MockDonorThanks() {
  return (
    <MockFrame path="/donate" label="Thank-you card with the donor's next eligible donation date">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-full bg-blood-600 text-white shadow-glow">
          <Heart className="size-6" fill="currentColor" />
        </span>
        <p className="mt-3 font-display text-[15px] font-bold text-ink-950">Thank you for donating</p>
        <p className="mt-1 text-[10px] text-ink-500">Your unit is being tested and processed</p>
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink-100">
        <CalendarCheck className="size-4 text-blood-600" />
        <span className="flex-1 text-[10px] text-ink-600">Next eligible date</span>
        <span className="text-[11px] font-semibold text-ink-950 tabular">in 90 days</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
        {[COMPONENTS.PRBC.short, COMPONENTS.FFP.short, COMPONENTS.PLT.short].map((c) => (
          <span key={c} className="rounded-lg bg-blood-50 px-1 py-1.5 text-[9px] font-semibold text-blood-700">
            {c}
          </span>
        ))}
      </div>
    </MockFrame>
  )
}
