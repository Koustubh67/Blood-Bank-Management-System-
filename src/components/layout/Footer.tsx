import { Link } from 'react-router'
import { BadgeCheck, FlaskConical, Mail, Phone, RotateCcw, ShieldCheck, Snowflake } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { BRAND, DEMO_MODE } from '@/config/brand'
import { resetDatabase } from '@/store/db'
import { ensureDemoAccounts } from '@/services/auth'

const COLUMNS = [
  {
    title: 'Service',
    links: [
      { to: '/order', label: 'Order blood' },
      { to: '/track', label: 'Track an order' },
      { to: '/availability', label: 'Live blood stock' },
      { to: '/network', label: 'Hospitals & outlets near you' },
      { to: '/donate', label: 'Become a donor' },
      { to: '/camps', label: 'Donation camps' },
      { to: '/hospital', label: 'For hospitals' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { to: '/guide', label: 'User manual' },
      { to: '/safety', label: 'Safety & cold chain' },
      { to: '/guide#faq', label: 'FAQs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/legal/terms', label: 'Terms of service' },
      { to: '/legal/privacy', label: 'Privacy policy' },
      { to: '/legal/refunds', label: 'Cancellation & refunds' },
      { to: '/legal/compliance', label: 'Regulatory compliance' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto bg-ink-950 text-ink-300">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-ink-400">
              Verified blood units from licensed blood centres, delivered to hospitals in minutes with an unbroken cold chain.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <a href={`tel:${BRAND.supportPhone}`} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-4" /> {BRAND.supportPhone} · 24×7 toll-free
              </a>
              <a href={`mailto:${BRAND.supportEmail}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4" /> {BRAND.supportEmail}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-sans text-sm font-semibold tracking-wide text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <ShieldCheck className="size-5" />, t: 'Blood is never sold', d: 'Only NBTC-capped processing charges are billed.' },
            { icon: <BadgeCheck className="size-5" />, t: 'Licensed partners only', d: 'Every centre holds a valid licence under the Drugs & Cosmetics Rules.' },
            { icon: <Snowflake className="size-5" />, t: 'Monitored cold chain', d: 'Validated boxes with live temperature logging.' },
          ].map((b) => (
            <div key={b.t} className="flex gap-3 rounded-2xl border border-white/10 p-4">
              <span className="text-blood-400">{b.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{b.t}</p>
                <p className="text-xs text-ink-400">{b.d}</p>
              </div>
            </div>
          ))}
        </div>

        {DEMO_MODE && (
          <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-white/10 p-4 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-blood-400" aria-hidden />
              <span>
                <span className="font-semibold text-white">Prototype.</span> Payments, stock, stores and deliveries are simulated; no real
                blood is dispatched. Camps and hospitals on the map are real public data.
              </span>
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Reset all demo data (accounts, orders, stock)?')) return
                resetDatabase()
                await ensureDemoAccounts()
                location.assign('/')
              }}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white hover:bg-white/15 sm:self-auto"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset demo data
            </button>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-ink-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.company} {BRAND.name} is a logistics and coordination platform; it is not a blood bank
            and does not provide medical advice.
          </p>
          <p>In a medical emergency, call {BRAND.emergencyPhone}.</p>
        </div>
      </div>
    </footer>
  )
}
