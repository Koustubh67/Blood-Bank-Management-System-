import { Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { FlaskConical, RotateCcw, X } from 'lucide-react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { Toaster } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/primitives'
import { DEMO_MODE } from '@/config/brand'
import { resetDatabase } from '@/store/db'
import { ensureDemoAccounts, useCurrentUser } from '@/services/auth'
import type { Role } from '@/types'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

/**
 * Prototype notice as a small corner chip instead of a full-width bar, so the
 * header stays light. Expands to the full explanation and the reset action.
 */
function PrototypeChip() {
  const [open, setOpen] = useState(false)
  if (!DEMO_MODE) return null
  const reset = async () => {
    if (!confirm('Reset all demo data (accounts, orders, stock)?')) return
    resetDatabase()
    await ensureDemoAccounts()
    location.assign('/')
  }
  return (
    // Only on very wide screens, where it sits in the empty margin; everywhere else the
    // same notice lives in the footer, so the chip never covers page content.
    <div className="no-print fixed bottom-4 left-4 z-600 hidden max-w-[calc(100vw-2rem)] 2xl:block">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="w-80 max-w-full rounded-2xl bg-ink-950 p-4 text-ink-200 shadow-lift"
            role="dialog"
            aria-label="About this prototype"
          >
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 size-4 shrink-0 text-blood-400" aria-hidden />
              <p className="text-[13px] leading-relaxed">
                <span className="font-semibold text-white">Prototype.</span> Payments, stock, stores and deliveries are simulated. No real blood
                is dispatched. Camps and hospitals on the map are real public data.
              </p>
              <button type="button" onClick={() => setOpen(false)} className="-mt-1 -mr-1 rounded-full p-1 hover:bg-white/10" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset demo data
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lift backdrop-blur hover:bg-ink-950"
          >
            <FlaskConical className="size-3.5 text-blood-400" aria-hidden /> Prototype
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="container-page flex flex-col gap-4 py-16">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-6 h-64 w-full" />
    </div>
  )
}

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <Toaster />
      <PrototypeChip />
    </div>
  )
}

/** Redirects to /login?next=… when signed out, or home when the role doesn't match. */
export function RequireAuth({ role, children }: { role?: Role; children: React.ReactNode }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
