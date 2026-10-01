import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Crosshair, Loader2, MapPin, Search, X, Zap } from 'lucide-react'
import { BRAND } from '@/config/brand'
import { CITIES, citiesByState } from '@/data/cities'
import { ApiError } from '@/services/api'
import { chooseCity, dismissLocationPrompt, locateMe, useDeliveryLocation, useLocationStore } from '@/services/location'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const GROUPS = citiesByState()

const NUDGE_KEY = 'rf-location-nudge'

// Session storage can throw in private mode; the nudge simply shows again then.
function sessionStorageGet(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function sessionStorageSet(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

/** "Use my location" with its own busy state, shared by the sheet and the first-visit prompt. */
function useLocate(onDone?: () => void) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      const r = await locateMe()
      if (r.outOfArea) toast.info(`We don't deliver there yet`, `Showing ${r.city.name}, the nearest city we serve.`)
      else toast.success(`Delivering to ${r.area ? `${r.area}, ` : ''}${r.city.name}`)
      onDone?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not get your location.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const loc = useDeliveryLocation()
  const [query, setQuery] = useState('')
  const { busy, run } = useLocate(onClose)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    // Focus search on devices with a real keyboard only, so phones don't pop one up.
    if (window.matchMedia('(pointer: fine)').matches) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GROUPS
    return GROUPS.map((g) => ({
      state: g.state,
      cities: g.state.toLowerCase().includes(q) ? g.cities : g.cities.filter((c) => c.name.toLowerCase().includes(q)),
    })).filter((g) => g.cities.length)
  }, [query])

  const pick = (id: string) => {
    chooseCity(id)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Where should we deliver?" className="sm:max-w-xl">
      <p className="-mt-2 text-sm text-ink-600">
        We show the nearest {BRAND.name} stores, live stock and hospitals for your area. Blood is delivered to the hospital&rsquo;s blood desk.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-blood-200 bg-blood-50/60 p-4 text-left transition hover:bg-blood-50 disabled:opacity-70"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blood-600 text-white">
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Crosshair className="size-5" aria-hidden />}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-blood-800">{busy ? 'Finding you…' : 'Use my current location'}</span>
          <span className="block text-xs text-ink-500">Most accurate. We only use it to find stores near you.</span>
        </span>
      </button>

      <label className="relative mt-4 block">
        <span className="sr-only">Search city or state</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${CITIES.length} cities across India`}
          className="h-12 w-full rounded-2xl border border-ink-200 bg-white pr-10 pl-11 text-[15px] placeholder:text-ink-400 focus:border-blood-500 focus:ring-4 focus:ring-blood-100 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </label>

      <div className="mt-3 max-h-[46dvh] overflow-y-auto rounded-2xl border border-ink-100 sm:max-h-80">
        {groups.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-500">No city matches &ldquo;{query}&rdquo;.</p>
        ) : (
          groups.map((g) => (
            <div key={g.state}>
              <p className="sticky top-0 z-10 bg-ink-50/95 px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase backdrop-blur">
                {g.state}
              </p>
              <ul>
                {g.cities.map((c) => {
                  const active = c.id === loc.cityId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pick(c.id)}
                        aria-current={active || undefined}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition hover:bg-ink-50',
                          active ? 'font-semibold text-blood-700' : 'text-ink-800',
                        )}
                      >
                        <MapPin className={cn('size-4 shrink-0', active ? 'text-blood-600' : 'text-ink-300')} aria-hidden />
                        <span className="flex-1">{c.name}</span>
                        {active && <Check className="size-4 text-blood-600" aria-hidden />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}

/**
 * Header location control: promise + where we deliver, like quick-commerce
 * apps. Opens the location sheet; nudges first-time visitors once.
 */
export function LocationButton({ compact = false }: { compact?: boolean }) {
  const loc = useDeliveryLocation()
  const confirmed = useLocationStore((s) => s.confirmed)
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const { busy, run } = useLocate(() => setNudge(false))

  // First visit: a gentle nudge after the page settles, not a blocking dialog.
  // Shown once per visit, and it steps aside on its own when the visitor
  // scrolls or ignores it, so it never sits over the page.
  useEffect(() => {
    if (confirmed || sessionStorageGet(NUDGE_KEY)) return
    const show = setTimeout(() => {
      setNudge(true)
      sessionStorageSet(NUDGE_KEY)
    }, 1400)
    return () => clearTimeout(show)
  }, [confirmed])

  useEffect(() => {
    if (!nudge) return
    const hide = () => setNudge(false)
    const timer = setTimeout(hide, 12_000)
    const onScroll = () => window.scrollY > 160 && hide()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [nudge])

  const place = loc.area ? `${loc.area}, ${loc.city.name}` : loc.city.name

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setNudge(false)
        }}
        className="group flex min-w-0 items-center gap-2 rounded-2xl px-2 py-1.5 text-left transition hover:bg-ink-100/70"
        aria-label={`Delivery location: ${place}${loc.outOfArea ? ' (outside our delivery area)' : ''}. Change location`}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-[13px] leading-tight font-bold text-ink-950">
            <Zap className="size-3.5 shrink-0 fill-blood-600 text-blood-600" aria-hidden />
            {loc.outOfArea ? 'Not serving here yet' : `Blood in ${BRAND.promiseMinutes} min`}
          </span>
          <span className={cn('flex items-center gap-0.5 text-xs leading-tight text-ink-500', compact ? 'max-w-38' : 'max-w-52')}>
            <span className="truncate">{place}</span>
            <ChevronDown className="size-3.5 shrink-0 transition-transform group-hover:translate-y-0.5" aria-hidden />
          </span>
        </span>
      </button>

      <AnimatePresence>
        {nudge && !confirmed && (
          <motion.div
            role="dialog"
            aria-label="Set your location"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="fixed inset-x-3 top-16 z-520 rounded-3xl border border-ink-100 bg-white p-4 shadow-lift sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:mt-2 sm:w-80"
          >
            <button
              type="button"
              onClick={() => {
                setNudge(false)
                dismissLocationPrompt()
              }}
              className="absolute top-3 right-3 grid size-7 place-items-center rounded-full text-ink-400 hover:bg-ink-100"
              aria-label="Not now"
            >
              <X className="size-4" />
            </button>
            <p className="pr-8 font-display text-base font-semibold text-ink-950">See stores and hospitals near you</p>
            <p className="mt-1 text-sm text-ink-600">
              We&rsquo;re showing {loc.city.name}. Share your location for the nearest store and a live delivery estimate.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={run}
                disabled={busy}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-blood-600 px-4 text-sm font-semibold text-white hover:bg-blood-700 disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />}
                Use my location
              </button>
              <button
                type="button"
                onClick={() => {
                  setNudge(false)
                  setOpen(true)
                }}
                className="inline-flex h-10 items-center rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                Pick city
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LocationSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
