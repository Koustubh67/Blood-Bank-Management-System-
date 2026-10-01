import { clsx, type ClassValue } from 'clsx'
import { BRAND } from '@/config/brand'
import type { LatLng } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

const inr = new Intl.NumberFormat(BRAND.locale, {
  style: 'currency',
  currency: BRAND.currency,
  maximumFractionDigits: 0,
})

export function formatINR(amount: number) {
  return inr.format(Math.round(amount))
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString(BRAND.locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(BRAND.locale, { hour: 'numeric', minute: '2-digit' })
}

/** "4 min", "1 h 12 min", "45 s" */
export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)} h ${m % 60} min`
}

/** mm:ss countdown */
export function formatClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function uid(prefix = '') {
  const rand = crypto.getRandomValues(new Uint32Array(2))
  return `${prefix}${Date.now().toString(36)}${rand[0].toString(36)}`.toUpperCase()
}

/** Human-friendly order id, e.g. RF-7K2M9Q */
export function orderId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return 'RF-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export function otp4() {
  return String(1000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 9000))
}

/** Deterministic PRNG so seeded demo data is stable across reloads. */
export function seeded(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

// ---------- geo ----------

const R = 6371e3

export function distanceMeters(a: LatLng, b: LatLng) {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dφ = ((b.lat - a.lat) * Math.PI) / 180
  const dλ = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

export function bearing(a: LatLng, b: LatLng) {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dλ = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(dλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Point at fraction t (0..1) along a polyline, measured by distance. */
export function pointAlong(path: LatLng[], t: number): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 }
  if (path.length === 1 || t <= 0) return path[0]
  if (t >= 1) return path[path.length - 1]
  const segs: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const d = distanceMeters(path[i - 1], path[i])
    segs.push(d)
    total += d
  }
  let target = total * t
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const f = segs[i] === 0 ? 0 : target / segs[i]
      const a = path[i]
      const b = path[i + 1]
      return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f }
    }
    target -= segs[i]
  }
  return path[path.length - 1]
}

export function pathLength(path: LatLng[]) {
  let total = 0
  for (let i = 1; i < path.length; i++) total += distanceMeters(path[i - 1], path[i])
  return total
}
