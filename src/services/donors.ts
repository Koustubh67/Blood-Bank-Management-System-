import { useMemo } from 'react'
import { useDB } from '@/store/db'
import type { BloodGroup, DonorProfile } from '@/types'
import { uid } from '@/lib/utils'
import { ApiError, latency } from './api'
import { getCurrentUser } from './auth'

export interface EligibilityAnswers {
  age: number
  weightKg: number
  gender: 'female' | 'male' | 'other'
  /** ISO date of last whole-blood donation, if any */
  lastDonation?: string
  feelingWell: boolean
  tattooOrPiercingLast12Months: boolean
  pregnantOrBreastfeeding: boolean
  onAntibiotics: boolean
  majorSurgeryLast6Months: boolean
}

/**
 * Screening based on the donor selection criteria published by NBTC (2017).
 * This is a pre-check only; the medical officer at the centre makes the final
 * call after a haemoglobin test and physical examination.
 */
export function checkEligibility(a: EligibilityAnswers): { eligible: boolean; reasons: string[]; nextEligibleDate?: string } {
  const reasons: string[] = []
  if (a.age < 18 || a.age > 65) reasons.push('Donors must be between 18 and 65 years old.')
  if (a.weightKg < 45) reasons.push('Minimum weight is 45 kg (50 kg for a 450 ml donation).')
  if (!a.feelingWell) reasons.push('Please donate only when you are feeling fit and well.')
  if (a.tattooOrPiercingLast12Months) reasons.push('Wait 12 months after a tattoo, piercing or acupuncture.')
  if (a.pregnantOrBreastfeeding) reasons.push('Not eligible during pregnancy or while breastfeeding.')
  if (a.onAntibiotics) reasons.push('Wait until you have finished antibiotics and are symptom-free.')
  if (a.majorSurgeryLast6Months) reasons.push('Wait 12 months after major surgery (6 months after minor surgery).')

  let nextEligibleDate: string | undefined
  if (a.lastDonation) {
    const gapDays = a.gender === 'female' ? 120 : 90
    const next = new Date(a.lastDonation)
    next.setDate(next.getDate() + gapDays)
    if (next.getTime() > Date.now()) {
      nextEligibleDate = next.toISOString().slice(0, 10)
      reasons.push(`Minimum gap between whole-blood donations is ${gapDays} days.`)
    }
  }
  return { eligible: reasons.length === 0, reasons, nextEligibleDate }
}

export interface DonorInput {
  name: string
  phone: string
  bloodGroup: BloodGroup
  age: number
  weightKg: number
  lastDonation?: string
  centreId: string
  slot: string
}

export async function registerDonor(input: DonorInput): Promise<DonorProfile> {
  await latency()
  if (input.name.trim().length < 2) throw new ApiError('Enter your full name.')
  if (!/^[6-9]\d{9}$/.test(input.phone.replace(/\D/g, ''))) throw new ApiError('Enter a valid 10-digit mobile number.')
  if (!input.centreId || !input.slot) throw new ApiError('Pick a centre and a time slot.')
  const donor: DonorProfile = {
    id: uid('D'),
    userId: getCurrentUser()?.id,
    name: input.name.trim(),
    phone: input.phone.replace(/\D/g, ''),
    bloodGroup: input.bloodGroup,
    age: input.age,
    weightKg: input.weightKg,
    lastDonation: input.lastDonation,
    centreId: input.centreId,
    slot: input.slot,
    createdAt: Date.now(),
  }
  useDB.getState()._set((s) => ({ donors: [donor, ...s.donors] }))
  return donor
}

export function useMyDonations() {
  const userId = useDB((s) => s.session.userId)
  const donors = useDB((s) => s.donors)
  return useMemo(() => (userId ? donors.filter((d) => d.userId === userId) : []), [donors, userId])
}

export function useDonorCount() {
  return useDB((s) => s.donors.length)
}
