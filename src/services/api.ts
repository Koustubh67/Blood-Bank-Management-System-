import { sleep } from '@/lib/utils'

/** Error type every service throws. `message` is safe to show to the user. */
export class ApiError extends Error {
  constructor(message: string, public code = 'error') {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Simulated network latency so loading states are exercised in the demo.
 * When a real backend is added, service functions replace their body with a
 * fetch() to `API_BASE_URL` and keep the same signature.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function latency(min = 250, max = 700) {
  return sleep(min + Math.random() * (max - min))
}
