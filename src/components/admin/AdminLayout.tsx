import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { MotionConfig } from 'motion/react'
import { Toaster } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/primitives'
import { SidebarContent } from './shell/Sidebar'
import { TopBar } from './shell/TopBar'
import { MobileNav } from './shell/MobileNav'
import { OpsEngine } from './OpsEngine'
import { OrderDrawer } from './orders/OrderDrawer'
import { ActionDialogs } from './orders/ActionDialogs'

function PageFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-2 h-72 w-full" />
    </div>
  )
}

/**
 * The operations panel's own shell, outside the marketing layout: sidebar on
 * large screens, a drawer on phones, and a top bar with the city switcher,
 * clock and sound toggle. Mounts the simulator, so it only runs while an
 * admin page is open.
 */
export default function AdminLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <MotionConfig reducedMotion="user">
      <a href="#admin-main" className="sr-only z-1200 rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh border-r border-ink-100 bg-white lg:block">
          <SidebarContent />
        </aside>
        <div className="flex min-w-0 flex-col">
          <TopBar onMenu={() => setNavOpen(true)} />
          <main id="admin-main" tabIndex={-1} className="flex-1 focus:outline-none">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <MobileNav open={navOpen} onClose={closeNav} />
      <OrderDrawer />
      <ActionDialogs />
      <OpsEngine />
      <Toaster />
    </MotionConfig>
  )
}
