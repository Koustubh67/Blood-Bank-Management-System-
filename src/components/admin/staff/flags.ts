import type { StaffMember } from '@/services/admin/types'
import { daysUntil } from '@/services/admin/time'

export interface StaffFlag {
  label: string
  tone: 'red' | 'amber'
}

/** Compliance flags: driving licence (riders) and the yearly cold-chain training refresher (everyone). */
export function staffFlags(m: StaffMember, now: number): StaffFlag[] {
  const out: StaffFlag[] = []
  if (m.role === 'rider' && m.licenceExpiry) {
    const d = daysUntil(m.licenceExpiry, now)
    if (d < 0) out.push({ label: 'Licence expired', tone: 'red' })
    else if (d <= 30) out.push({ label: `Licence ends in ${d} d`, tone: 'amber' })
  }
  const since = -daysUntil(m.trainedOn, now)
  if (since > 365) out.push({ label: 'Training overdue', tone: 'red' })
  else if (since > 335) out.push({ label: `Training due in ${365 - since} d`, tone: 'amber' })
  return out
}
