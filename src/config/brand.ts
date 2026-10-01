/**
 * Single source of truth for brand + business settings.
 * Rename the product, change the support line or tweak fees here only.
 */
export const BRAND = {
  name: 'RaktFlow',
  tagline: 'Blood, delivered in minutes.',
  promiseMinutes: 10,
  supportPhone: '1800-000-7258',
  emergencyPhone: '108',
  supportEmail: 'care@raktflow.example',
  grievanceOfficer: 'Grievance Officer, RaktFlow Health Pvt. Ltd.',
  company: 'RaktFlow Health Pvt. Ltd.',
  address: 'Registered office address goes here',
  currency: 'INR',
  locale: 'en-IN',
} as const

export const FEES = {
  /** Flat cold-chain logistics fee per order (transport only, never for blood). */
  logistics: 149,
  /** GST on logistics service. Blood processing charges are healthcare services and exempt. */
  logisticsGstRate: 0.18,
} as const

/**
 * Demo mode: the app runs fully in the browser with a simulated database,
 * payment gateway and delivery fleet. Flip to false once real services are wired.
 */
export const DEMO_MODE = true
