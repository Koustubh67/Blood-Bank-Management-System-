import { useMemo } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { ArrowLeft, Bike, IndianRupee, LayoutDashboard, LogOut, SquareKanban, Store, UsersRound, type LucideIcon } from 'lucide-react'
import { LogoMark } from '@/components/ui/Logo'
import { logout, useCurrentUser } from '@/services/auth'
import { useNow } from '@/hooks/useNow'
import { useBoardOrders, useLoad } from '@/services/admin/hooks'
import { isPreDispatch, sla } from '@/services/admin/priority'
import { cn } from '@/lib/utils'
import { Avatar } from '../ui'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: 'risk' | 'waiting'
}

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Priority board', icon: SquareKanban, badge: 'risk' },
  { to: '/admin/dispatch', label: 'Dispatch', icon: Bike, badge: 'waiting' },
  { to: '/admin/stores', label: 'Stores', icon: Store },
  { to: '/admin/staff', label: 'Staff & drivers', icon: UsersRound },
  { to: '/admin/collections', label: 'Collections', icon: IndianRupee },
]

function useBadges() {
  const now = useNow(5000)
  const orders = useBoardOrders(now)
  const load = useLoad(now)
  return useMemo(() => {
    const risk = orders.filter((o) => isPreDispatch(o) && (sla(o, now).state === 'risk' || sla(o, now).state === 'breached')).length
    return { risk, waiting: load.waiting }
  }, [orders, load.waiting, now])
}

/** Logo, navigation and the signed-in admin; used by the desktop sidebar and the phone drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const badges = useBadges()

  const signOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
        <LogoMark className="size-9" />
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-ink-950">
            Rakt<span className="text-blood-600">Flow</span>
          </p>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">Operations</p>
        </div>
      </div>

      <nav aria-label="Operations" className="flex-1 overflow-y-auto px-3">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const count = item.badge ? badges[item.badge] : 0
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive ? 'bg-ink-950 text-white' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-950',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('size-[18px] shrink-0', isActive ? 'text-blood-400' : 'text-ink-400 group-hover:text-ink-700')} aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <>
                          <span
                            className={cn(
                              'min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular',
                              item.badge === 'risk' ? 'bg-blood-600 text-white' : 'bg-amber-100 text-amber-900',
                            )}
                            aria-hidden
                          >
                            {count}
                          </span>
                          <span className="sr-only">
                            , {count} {item.badge === 'risk' ? 'orders near or past their dispatch target' : 'orders without a free rider'}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-ink-100 p-3">
        {user && (
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <Avatar name={user.name} tone="bg-blood-50 text-blood-700" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-950">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
          </div>
        )}
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <Link to="/" onClick={onNavigate} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-ink-700 hover:bg-ink-100">
            <ArrowLeft className="size-3.5" aria-hidden /> Back to site
          </Link>
          <button type="button" onClick={signOut} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-ink-700 hover:bg-ink-100">
            <LogOut className="size-3.5" aria-hidden /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
