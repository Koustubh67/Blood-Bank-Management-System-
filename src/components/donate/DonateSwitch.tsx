import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { Building2, Tent } from 'lucide-react'
import { cn } from '@/lib/utils'

const WAYS = [
  { to: '/donate', label: 'At a blood centre', short: 'Blood centre', icon: Building2 },
  { to: '/camps', label: 'At a camp near you', short: 'Camp near you', icon: Tent },
]

/**
 * One "Donate" area with two ways to give: book a slot at a licensed centre,
 * or join a live donation camp. Sits at the top of both pages.
 */
export function DonateSwitch() {
  return (
    <nav aria-label="Ways to donate" className="container-page pt-5 sm:pt-6">
      <div className="inline-flex max-w-full rounded-full border border-ink-100 bg-white p-1 shadow-soft">
        {WAYS.map(({ to, label, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4',
                isActive ? 'text-white' : 'text-ink-600 hover:text-ink-950',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="donate-switch" className="absolute inset-0 rounded-full bg-ink-950" transition={{ type: 'spring', damping: 30, stiffness: 380 }} />
                )}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative sm:hidden">{short}</span>
                <span className="relative hidden sm:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
