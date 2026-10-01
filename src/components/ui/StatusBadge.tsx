import type { OrderStatus } from '@/types'
import { STATUS_LABEL } from '@/services/orders'
import { Badge, LiveDot } from './primitives'

const TONE: Record<OrderStatus, 'neutral' | 'red' | 'green' | 'amber' | 'blue' | 'dark'> = {
  pending_payment: 'amber',
  payment_failed: 'red',
  placed: 'blue',
  verified: 'blue',
  packed: 'blue',
  dispatched: 'red',
  arriving: 'red',
  delivered: 'green',
  cancelled: 'neutral',
}

const LIVE: OrderStatus[] = ['placed', 'verified', 'packed', 'dispatched', 'arriving']

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge tone={TONE[status]} className={className}>
      {LIVE.includes(status) && <LiveDot className="size-2" color={status === 'dispatched' || status === 'arriving' ? 'bg-blood-600' : 'bg-ice-500'} />}
      {STATUS_LABEL[status]}
    </Badge>
  )
}
