import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Phone,
  User as UserIcon,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ButtonLink } from '@/components/ui/Button'
import { logout, useCurrentUser } from '@/services/auth'
import { setSoundEnabled, useSoundPrefs } from '@/lib/sound'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { LocationButton } from './LocationPicker'

/** Shown in the bar on desktop. Everything else lives under "More" and in the footer. */
const PRIMARY: { to: string; label: string; also?: string[] }[] = [
  { to: '/availability', label: 'Live stock' },
  { to: '/network', label: 'Near you' },
  // One entry for giving blood: centre slots and live camps share a switch on both pages.
  { to: '/donate', label: 'Donate', also: ['/camps'] },
  { to: '/hospital', label: 'For hospitals' },
]

const isOn = (pathname: string, l: { to: string; also?: string[] }) =>
  [l.to, ...(l.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))

const MORE = [
  { to: '/track', label: 'Track an order', hint: 'Live map and ETA' },
  { to: '/safety', label: 'Safety & cold chain', hint: 'How every unit stays safe' },
  { to: '/guide', label: 'How it works', hint: 'Step-by-step manual and FAQs' },
  { to: '/legal', label: 'Legal & compliance', hint: 'Terms, privacy, refunds' },
]

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLLIElement & HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

function SoundToggle({ className }: { className?: string }) {
  const enabled = useSoundPrefs((s) => s.enabled)
  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!enabled)}
      aria-pressed={enabled}
      className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50', className)}
    >
      {enabled ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
      Order sounds {enabled ? 'on' : 'off'}
    </button>
  )
}

export function Navbar() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [more, setMore] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useOutsideClose(menu, () => setMenu(false))
  const moreRef = useOutsideClose(more, () => setMore(false))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setMenu(false)
    setMore(false)
  }, [location.pathname])

  const signOut = () => {
    logout()
    navigate('/')
  }

  const moreActive = MORE.some((m) => location.pathname.startsWith(m.to))

  return (
    <header
      className={cn(
        'sticky top-0 z-500 border-b transition-[background-color,border-color] duration-300',
        scrolled ? 'border-ink-100 bg-paper/80 backdrop-blur-xl' : 'border-transparent bg-paper',
      )}
    >
      <nav className="container-page flex h-16 items-center gap-2 sm:gap-3 lg:h-18 xl:gap-5" aria-label="Main">
        <Logo className="shrink-0" />
        <span aria-hidden className="hidden h-8 w-px bg-ink-100 sm:block" />
        <div className="min-w-0 flex-1 xl:flex-none">
          <LocationButton compact />
        </div>

        <ul className="ml-auto hidden items-center gap-0.5 xl:flex">
          {PRIMARY.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={cn(
                  'relative block rounded-full px-3 py-2 text-[14px] font-medium whitespace-nowrap transition-colors',
                  isOn(location.pathname, l) ? 'text-ink-950' : 'text-ink-600 hover:text-ink-950',
                )}
              >
                <>
                  {l.label}
                  {isOn(location.pathname, l) && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-blood-600"
                      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                    />
                  )}
                </>
              </NavLink>
            </li>
          ))}
          <li className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMore((m) => !m)}
              aria-expanded={more}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-medium transition-colors',
                moreActive || more ? 'text-ink-950' : 'text-ink-600 hover:text-ink-950',
              )}
            >
              More <ChevronDown className={cn('size-4 transition-transform', more && 'rotate-180')} aria-hidden />
            </button>
            <AnimatePresence>
              {more && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift"
                >
                  {MORE.map((m) => (
                    <Link key={m.to} to={m.to} className="block rounded-xl px-3 py-2.5 hover:bg-ink-50">
                      <span className="block text-sm font-semibold text-ink-900">{m.label}</span>
                      <span className="block text-xs text-ink-500">{m.hint}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        </ul>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-1 rounded-full p-1 pr-1.5 text-sm font-medium text-ink-800 transition hover:bg-ink-100"
                aria-expanded={menu}
                aria-label={`Account menu for ${user.name}`}
              >
                <span className="grid size-8 place-items-center rounded-full bg-ink-950 text-[13px] font-semibold text-white">
                  {user.role === 'hospital' ? <Building2 className="size-4" /> : user.name.charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="size-4 text-ink-400" aria-hidden />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-ink-500">{user.email}</p>
                    </div>
                    {user.role === 'admin' && (
                      <MenuLink to="/admin" icon={<LayoutDashboard className="size-4" />}>
                        Operations console
                      </MenuLink>
                    )}
                    {user.role === 'hospital' && (
                      <MenuLink to="/hospital" icon={<Building2 className="size-4" />}>
                        Hospital dashboard
                      </MenuLink>
                    )}
                    <MenuLink to="/orders" icon={<Package className="size-4" />}>
                      My orders
                    </MenuLink>
                    <MenuLink to="/account" icon={<UserIcon className="size-4" />}>
                      Account
                    </MenuLink>
                    <SoundToggle />
                    <div className="my-1 h-px bg-ink-100" />
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:text-ink-950 sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          {/* Wrapped: the button's own display class would override `hidden`. */}
          <span className="hidden sm:block">
            <ButtonLink to="/order" size="sm" className="h-10 px-5 shadow-none">
              Order blood
            </ButtonLink>
          </span>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink-800 hover:bg-ink-100 xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-ink-100 bg-paper xl:hidden"
          >
            <div className="container-page flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto py-4">
              <ButtonLink to="/order" size="lg" className="mb-3 w-full sm:hidden">
                Order blood
              </ButtonLink>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {[...PRIMARY, ...MORE].map((l) => (
                  <li key={l.to}>
                    <NavLink
                      to={l.to}
                      className={cn(
                        'block rounded-2xl px-4 py-3 text-base font-medium',
                        isOn(location.pathname, l) ? 'bg-white text-blood-700 shadow-soft' : 'text-ink-800 hover:bg-white',
                      )}
                    >
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-ink-100 pt-3">
                {user ? (
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {user.role === 'admin' && (
                      <NavLink to="/admin" className="rounded-2xl px-4 py-3 font-medium hover:bg-white">
                        Operations console
                      </NavLink>
                    )}
                    <NavLink to="/orders" className="rounded-2xl px-4 py-3 font-medium hover:bg-white">
                      My orders
                    </NavLink>
                    <NavLink to="/account" className="rounded-2xl px-4 py-3 font-medium hover:bg-white">
                      Account
                    </NavLink>
                    <button type="button" onClick={signOut} className="rounded-2xl px-4 py-3 text-left font-medium hover:bg-white">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <NavLink to="/login" className="block rounded-2xl px-4 py-3 font-semibold hover:bg-white">
                    Sign in or create an account
                  </NavLink>
                )}
                <SoundToggle className="mt-1 px-4 py-3 text-base" />
                <a href={`tel:${BRAND.emergencyPhone}`} className="mt-1 flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold text-blood-700">
                  <Phone className="size-4" /> Medical emergency? Call {BRAND.emergencyPhone}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function MenuLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-700 hover:bg-ink-50">
      {icon}
      {children}
    </Link>
  )
}
