import { useMemo, useState } from 'react'
import { Ban, Bike, CircleCheck, ClipboardCheck, PackageCheck, Send, Siren, ThermometerSnowflake, TrendingUp, UsersRound, X, Zap, type LucideIcon } from 'lucide-react'
import type { ActivityKind, OpsActivity } from '@/services/admin/types'
import { useOps } from '@/services/admin/store'
import { inScope, useScope } from '@/services/admin/hooks'
import { cn, formatTime } from '@/lib/utils'
import { Panel } from '../ui'
import { openOrder } from '../orders/state'

const KIND: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  order: { icon: Siren, tone: 'bg-blood-50 text-blood-600' },
  verify: { icon: ClipboardCheck, tone: 'bg-ink-50 text-ink-600' },
  pack: { icon: PackageCheck, tone: 'bg-ink-50 text-ink-600' },
  assign: { icon: Bike, tone: 'bg-amber-50 text-amber-700' },
  dispatch: { icon: Send, tone: 'bg-blood-50 text-blood-600' },
  deliver: { icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-700' },
  reject: { icon: Ban, tone: 'bg-ink-100 text-ink-600' },
  cancel: { icon: X, tone: 'bg-ink-100 text-ink-600' },
  escalate: { icon: TrendingUp, tone: 'bg-amber-50 text-amber-700' },
  surge: { icon: Zap, tone: 'bg-ink-950 text-white' },
  staff: { icon: UsersRound, tone: 'bg-ice-50 text-ice-700' },
  alert: { icon: ThermometerSnowflake, tone: 'bg-blood-50 text-blood-600' },
}

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  return formatTime(Date.now() - ms)
}

function Entry({ e, now }: { e: OpsActivity; now: number }) {
  const k = KIND[e.kind]
  const body = (
    <>
      <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg', k.tone)} aria-hidden>
        <k.icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-ink-800">{e.text}</span>
        <span className="text-xs text-ink-400">{ago(now - e.at)}</span>
      </span>
    </>
  )
  return e.orderId ? (
    <button type="button" onClick={() => openOrder(e.orderId!)} className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-ink-50">
      {body}
    </button>
  ) : (
    <div className="flex items-start gap-3 px-2 py-2">{body}</div>
  )
}

export function ActivityLog({ now, className, limit = 10 }: { now: number; className?: string; limit?: number }) {
  const scope = useScope()
  const all = useOps((s) => s.activity)
  const [shown, setShown] = useState(limit)
  const items = useMemo(() => all.filter((e) => inScope(scope, e.cityId)), [all, scope])
  return (
    <Panel
      title="Live activity"
      description="Orders, riders, staff and alerts as they happen"
      className={className}
      bodyClassName="px-2 py-2 sm:px-3"
    >
      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-ink-500">Quiet so far. New orders arrive every half a minute or so.</p>
      ) : (
        <ol aria-live="off" className="flex flex-col">
          {items.slice(0, shown).map((e) => (
            <li key={e.id}>
              <Entry e={e} now={now} />
            </li>
          ))}
        </ol>
      )}
      {items.length > shown && (
        <div className="px-2 pt-1 pb-2">
          <button type="button" onClick={() => setShown((n) => n + 15)} className="w-full rounded-full py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50">
            Earlier activity
          </button>
        </div>
      )}
    </Panel>
  )
}
