import { useMemo } from 'react'
import { useDB, type StoredUser } from '@/store/db'
import type { Role, User } from '@/types'
import { uid } from '@/lib/utils'
import { ApiError, latency } from './api'
import { adoptAccountCity } from './location'

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(`raktflow:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function toPublic({ passwordHash: _omit, ...user }: StoredUser): User {
  return user
}

export const DEMO_ACCOUNTS = [
  {
    role: 'individual' as Role,
    label: 'Patient family',
    name: 'Aarav Sharma',
    email: 'demo@raktflow.example',
    phone: '9876543210',
    password: 'demo1234',
    cityId: 'delhi',
  },
  {
    role: 'hospital' as Role,
    label: 'Hospital',
    name: 'CityCare Multispeciality Hospital',
    email: 'hospital@raktflow.example',
    phone: '1140000000',
    password: 'demo1234',
    hospitalId: 'H-CC',
    registrationNo: 'DL-CE-1101 (demo)',
    cityId: 'delhi',
  },
  {
    role: 'admin' as Role,
    label: 'Operations admin',
    name: 'Meera Iyer',
    email: 'admin@raktflow.example',
    phone: '9810000000',
    password: 'demo1234',
    cityId: 'delhi',
  },
]

/** Creates the demo accounts once so judges and testers can sign in instantly. */
export async function ensureDemoAccounts() {
  const { users, _set } = useDB.getState()
  // Accounts saved before cities existed: give them their demo city.
  if (users.some((u) => !u.cityId && DEMO_ACCOUNTS.some((d) => d.email === u.email)))
    _set((s) => ({ users: s.users.map((u) => (u.cityId ? u : { ...u, cityId: DEMO_ACCOUNTS.find((d) => d.email === u.email)?.cityId })) }))
  const missing = DEMO_ACCOUNTS.filter((d) => !users.some((u) => u.email === d.email))
  if (missing.length === 0) return
  const created: StoredUser[] = []
  for (const d of missing) {
    created.push({
      id: uid('U'),
      role: d.role,
      name: d.name,
      email: d.email,
      phone: d.phone,
      cityId: d.cityId,
      hospitalId: 'hospitalId' in d ? d.hospitalId : undefined,
      registrationNo: 'registrationNo' in d ? d.registrationNo : undefined,
      verified: true,
      createdAt: Date.now(),
      passwordHash: await hashPassword(d.password),
    })
  }
  _set((s) => ({ users: [...s.users, ...created] }))
}

export interface SignupInput {
  role: Role
  name: string
  email: string
  phone: string
  password: string
  cityId: string
  hospitalId?: string
  registrationNo?: string
}

export async function signup(input: SignupInput): Promise<User> {
  await latency()
  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Enter a valid email address.')
  if (!/^[6-9]\d{9}$|^\d{10,11}$/.test(input.phone.replace(/\D/g, '')))
    throw new ApiError('Enter a valid 10-digit phone number.')
  if (input.password.length < 8) throw new ApiError('Password must be at least 8 characters.')
  if (input.role === 'hospital' && (!input.hospitalId || !input.registrationNo?.trim()))
    throw new ApiError('Hospitals must select their facility and enter the registration number.')

  const { users, _set } = useDB.getState()
  if (users.some((u) => u.email === email)) throw new ApiError('An account with this email already exists.')

  const user: StoredUser = {
    id: uid('U'),
    role: input.role,
    name: input.name.trim(),
    email,
    phone: input.phone.replace(/\D/g, ''),
    cityId: input.cityId,
    hospitalId: input.role === 'hospital' ? input.hospitalId : undefined,
    registrationNo: input.role === 'hospital' ? input.registrationNo?.trim() : undefined,
    // Real launch: hospitals stay unverified until documents are reviewed.
    verified: true,
    createdAt: Date.now(),
    passwordHash: await hashPassword(input.password),
  }
  _set((s) => ({ users: [...s.users, user], session: { userId: user.id } }))
  adoptAccountCity(user.cityId)
  return toPublic(user)
}

export async function login(email: string, password: string): Promise<User> {
  await latency()
  const user = useDB.getState().users.find((u) => u.email === email.trim().toLowerCase())
  if (!user || user.passwordHash !== (await hashPassword(password)))
    throw new ApiError('Email or password is incorrect.')
  useDB.getState()._set(() => ({ session: { userId: user.id } }))
  adoptAccountCity(user.cityId)
  return toPublic(user)
}

export function logout() {
  useDB.getState()._set(() => ({ session: { userId: null } }))
}

export async function updateProfile(patch: Partial<Pick<User, 'name' | 'phone'>>) {
  await latency(150, 300)
  const { session, _set } = useDB.getState()
  if (!session.userId) throw new ApiError('Please sign in again.')
  _set((s) => ({ users: s.users.map((u) => (u.id === session.userId ? { ...u, ...patch } : u)) }))
}

export function useCurrentUser(): User | null {
  const userId = useDB((s) => s.session.userId)
  const user = useDB((s) => s.users.find((u) => u.id === userId))
  return useMemo(() => (user ? toPublic(user) : null), [user])
}

export function getCurrentUser(): User | null {
  const { session, users } = useDB.getState()
  const u = users.find((x) => x.id === session.userId)
  return u ? toPublic(u) : null
}
