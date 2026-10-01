import type { PointerEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { CalendarDays, MapPin } from 'lucide-react'
import type { BloodCentre, DonorProfile } from '@/types'
import { LogoMark } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import { bookingRef, formatSlotParts } from './slots'

/** Wallet-style digital donor pass with a gentle 3D tilt on hover. */
export function DonorCard({ donor, centre, className }: { donor: DonorProfile; centre?: BloodCentre; className?: string }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(px, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 })
  const glareX = useTransform(px, [0, 1], ['0%', '100%'])
  const glareY = useTransform(py, [0, 1], ['0%', '100%'])
  const glare = useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgb(255 255 255 / 0.22), transparent 55%)`)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const slot = formatSlotParts(donor.slot)

  return (
    <div className={cn('perspective-distant', className)}>
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={reduce ? undefined : { rotateX: rx, rotateY: ry }}
        initial={reduce ? false : { opacity: 0, y: 30, rotateX: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 140 }}
        className="relative isolate aspect-[1.58/1] w-full overflow-hidden rounded-4xl bg-linear-to-br from-blood-600 via-blood-800 to-blood-950 p-5 text-white shadow-[0_30px_60px_-20px_rgb(120_10_30/0.6)] sm:p-7"
        role="group"
        aria-label={`Donor pass for ${donor.name}, blood group ${donor.bloodGroup}, ${slot.weekday} ${slot.day} ${slot.month} at ${slot.time}, ${centre?.name ?? ''}, booking ${bookingRef(donor)}`}
      >
        {/* texture + glare */}
        <div className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)] bg-size-[14px_14px]" />
        <div className="absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-blood-400/40 blur-3xl" />
        {!reduce && <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} />}
        <svg viewBox="0 0 400 40" className="absolute top-[24%] right-0 left-0 -z-10 w-full opacity-15" fill="none" aria-hidden>
          <path d="M0 20h210l10-14 13 28 11-20 7 6h149" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="flex h-full flex-col" aria-hidden>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-8 [&>rect]:fill-white [&>path:first-of-type]:fill-blood-600 [&>path:last-of-type]:stroke-white" />
              <div className="leading-tight">
                <p className="font-display text-sm font-bold">RaktFlow</p>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">Donor pass</p>
              </div>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase ring-1 ring-white/20 backdrop-blur">
              Booked
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">Donor</p>
              <p className="truncate font-display text-lg font-bold sm:text-2xl">{donor.name}</p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-white/80 sm:text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {slot.weekday}, {slot.day} {slot.month} · {slot.time}
                  </span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{centre ? `${centre.name}` : 'Centre to be confirmed'}</span>
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">Group</p>
              <p className="font-display text-5xl leading-none font-extrabold tracking-tight sm:text-6xl">{donor.bloodGroup}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-[11px] sm:text-xs">
            <span className="font-mono tracking-[0.18em]">{bookingRef(donor)}</span>
            <span className="hidden text-white/60 min-[420px]:inline">Eligibility confirmed at the centre</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
