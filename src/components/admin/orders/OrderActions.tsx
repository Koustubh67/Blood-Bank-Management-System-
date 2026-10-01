import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Ellipsis, ArrowUpDown, Bike, ClipboardCheck, ExternalLink, KeyRound, PackageCheck, PanelRightOpen, Repeat, Send, X } from 'lucide-react'
import type { OpsOrder } from '@/services/admin/types'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { playSound } from '@/lib/sound'
import { cn } from '@/lib/utils'
import { markOutForDelivery, markPacked, startVerification } from '@/services/admin/actions'
import { isPreDispatch } from '@/services/admin/priority'
import { openAction, openOrder } from './state'

interface Primary {
  label: string
  /** For narrow board cards */
  short: string
  icon: ReactNode
  run: () => void
}

function report(r: { ok: true } | { ok: false; error: string }, title: string, description?: string) {
  if (!r.ok) return toast.error('Not done', r.error)
  playSound('tap')
  toast.success(title, description)
}

/** The one next step for an order at its current stage. */
export function primaryFor(order: OpsOrder): Primary | null {
  if (order.source === 'app') return null
  switch (order.stage) {
    case 'incoming':
    case 'verifying':
      return {
        label: 'Review requisition',
        short: 'Verify',
        icon: <ClipboardCheck className="size-4" />,
        run: () => {
          if (order.stage === 'incoming') startVerification(order.id)
          openAction('verify', order.id)
        },
      }
    case 'packing':
      return { label: 'Mark packed', short: 'Mark packed', icon: <PackageCheck className="size-4" />, run: () => report(markPacked(order.id), 'Packed', `${order.id} is ready for a rider.`) }
    case 'ready':
      return order.riderId
        ? { label: 'Out for delivery', short: 'Send out', icon: <Send className="size-4" />, run: () => report(markOutForDelivery(order.id), 'Out for delivery', `${order.id} has left the store.`) }
        : { label: 'Assign rider', short: 'Assign rider', icon: <Bike className="size-4" />, run: () => openAction('assign', order.id) }
    case 'out_for_delivery':
      return { label: 'Delivered · OTP', short: 'Hand over', icon: <KeyRound className="size-4" />, run: () => openAction('deliver', order.id) }
    default:
      return null
  }
}

export function PrimaryButton({ order, size = 'sm', short = false, className }: { order: OpsOrder; size?: 'sm' | 'md'; short?: boolean; className?: string }) {
  const p = primaryFor(order)
  if (!p) return null
  return (
    <Button size={size} variant="dark" icon={p.icon} onClick={p.run} className={className} aria-label={short && p.short !== p.label ? `${p.label} for ${order.id}` : undefined}>
      {short ? p.short : p.label}
    </Button>
  )
}

/** Secondary actions in a small menu (details, priority, rider change, cancel). */
export function OrderMenu({ order, className }: { order: OpsOrder; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    wrap.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: { label: string; icon: ReactNode; run: () => void; danger?: boolean }[] = [{ label: 'Open details', icon: <PanelRightOpen className="size-4" />, run: () => openOrder(order.id) }]
  if (order.source === 'app') {
    items.push({ label: 'Customer tracking page', icon: <ExternalLink className="size-4" />, run: () => navigate(`/track/${order.id}`) })
  } else {
    if (isPreDispatch(order) || order.stage === 'out_for_delivery') items.push({ label: 'Escalate / de-escalate', icon: <ArrowUpDown className="size-4" />, run: () => openAction('priority', order.id) })
    if (order.stage === 'ready' && order.riderId) items.push({ label: 'Change rider', icon: <Repeat className="size-4" />, run: () => openAction('assign', order.id) })
    if (isPreDispatch(order)) items.push({ label: 'Cancel order', icon: <X className="size-4" />, run: () => openAction('cancel', order.id), danger: true })
  }

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const els = [...(wrap.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus()
  }

  return (
    <div ref={wrap} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`More actions for ${order.id}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
      >
        <Ellipsis className="size-4" />
      </button>
      {open && (
        <div id={id} role="menu" onKeyDown={onMenuKey} className="absolute right-0 bottom-full z-30 mb-1 w-56 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                it.run()
              }}
              className={cn('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium focus:bg-ink-50 focus:outline-none', it.danger ? 'text-blood-700 hover:bg-blood-50' : 'text-ink-800 hover:bg-ink-50')}
            >
              <span className={it.danger ? 'text-blood-600' : 'text-ink-400'}>{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
