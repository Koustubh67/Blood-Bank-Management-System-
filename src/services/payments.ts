import type { PaymentMethod, PaymentRecord } from '@/types'
import { uid } from '@/lib/utils'
import { ApiError, latency } from './api'
import { getOrder, recordPaymentFailure, recordPaymentSuccess } from './orders'
import { getCurrentUser } from './auth'

/**
 * Payment gateway seam.
 *
 * Production: create the gateway order on your server (never expose secret
 * keys in the browser), open the provider's checkout (Razorpay / Cashfree /
 * PhonePe PG), then verify the signature server-side before calling
 * `recordPaymentSuccess`. The mock below mirrors that contract.
 */
export interface UpiDetails { upiId: string }
export interface CardDetails { number: string; expiry: string; cvv: string; name: string }
export interface NetbankingDetails { bankCode: string }
export interface CreditDetails { poNumber: string }

export type PaymentDetails =
  | { method: 'upi'; data: UpiDetails }
  | { method: 'card'; data: CardDetails }
  | { method: 'netbanking'; data: NetbankingDetails }
  | { method: 'credit'; data: CreditDetails }

export interface PaymentGateway {
  name: string
  charge(req: { orderId: string; amount: number } & PaymentDetails): Promise<PaymentRecord>
}

export const BANKS = [
  { code: 'SBIN', name: 'State Bank of India' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICIC', name: 'ICICI Bank' },
  { code: 'UTIB', name: 'Axis Bank' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank' },
  { code: 'PUNB', name: 'Punjab National Bank' },
  { code: 'BARB', name: 'Bank of Baroda' },
  { code: 'TEST_FAIL', name: 'Test Bank (always fails)' },
]

/** Test data shown in the checkout's test-mode panel. */
export const TEST_INSTRUMENTS = {
  cardSuccess: '4111 1111 1111 1111',
  cardDecline: '4000 0000 0000 0002',
  upiSuccess: 'success@razorpay',
  upiFail: 'failure@upi',
}

// ---------- validation helpers ----------

export function digitsOnly(s: string) {
  return s.replace(/\D/g, '')
}

export function luhnValid(num: string) {
  const d = digitsOnly(num)
  if (d.length < 12 || d.length > 19) return false
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

export type CardBrand = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'unknown'

export function cardBrand(num: string): CardBrand {
  const d = digitsOnly(num)
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard'
  if (/^(60|65|81|82|508|353|356)/.test(d)) return 'rupay'
  if (/^3[47]/.test(d)) return 'amex'
  return 'unknown'
}

/** "4111111111111111" -> "4111 1111 1111 1111" */
export function formatCardNumber(value: string) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
}

export function formatExpiry(value: string) {
  const d = digitsOnly(value).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function expiryValid(value: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)
  return endOfMonth.getTime() >= Date.now()
}

export function isValidUpiId(v: string) {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/.test(v.trim())
}

export function validatePayment(details: PaymentDetails): string | null {
  switch (details.method) {
    case 'upi':
      return isValidUpiId(details.data.upiId) ? null : 'Enter a valid UPI ID, like name@okhdfc.'
    case 'card': {
      const { number, expiry, cvv, name } = details.data
      if (!luhnValid(number)) return 'Card number looks incorrect.'
      if (!expiryValid(expiry)) return 'Card expiry is invalid or in the past.'
      const cvvLen = cardBrand(number) === 'amex' ? 4 : 3
      if (digitsOnly(cvv).length !== cvvLen) return `CVV must be ${cvvLen} digits.`
      if (name.trim().length < 2) return 'Enter the name printed on the card.'
      return null
    }
    case 'netbanking':
      return details.data.bankCode ? null : 'Choose your bank.'
    case 'credit':
      return details.data.poNumber.trim().length >= 3 ? null : 'Enter your hospital purchase-order number.'
  }
}

function instrumentLabel(details: PaymentDetails) {
  switch (details.method) {
    case 'upi':
      return details.data.upiId.trim()
    case 'card':
      return `${cardBrand(details.data.number).toUpperCase()} •••• ${digitsOnly(details.data.number).slice(-4)}`
    case 'netbanking':
      return BANKS.find((b) => b.code === details.data.bankCode)?.name ?? details.data.bankCode
    case 'credit':
      return `Hospital credit · PO ${details.data.poNumber.trim()}`
  }
}

// ---------- mock gateway ----------

export const mockGateway: PaymentGateway = {
  name: 'RaktFlow Test Gateway',
  async charge(req) {
    await latency(1400, 2200)
    let failureReason: string | undefined
    if (req.method === 'card' && digitsOnly(req.data.number) === digitsOnly(TEST_INSTRUMENTS.cardDecline))
      failureReason = 'Card declined by issuing bank.'
    if (req.method === 'upi' && req.data.upiId.trim().toLowerCase().startsWith('fail'))
      failureReason = 'UPI request was declined in the app.'
    if (req.method === 'netbanking' && req.data.bankCode === 'TEST_FAIL')
      failureReason = 'Bank session timed out.'
    return {
      method: req.method as PaymentMethod,
      status: failureReason ? 'failed' : 'success',
      transactionId: uid('TXN'),
      gatewayRef: `pay_${uid().toLowerCase()}`,
      amount: req.amount,
      paidAt: Date.now(),
      instrument: instrumentLabel(req),
      failureReason,
    }
  },
}

let gateway: PaymentGateway = mockGateway
/** Swap in a real gateway adapter at startup. */
export function setPaymentGateway(g: PaymentGateway) {
  gateway = g
}

/**
 * Charges the order total. Resolves with the payment record whether it
 * succeeded or failed; throws only for problems before the charge.
 */
export async function payForOrder(orderId: string, details: PaymentDetails): Promise<PaymentRecord> {
  const order = getOrder(orderId)
  if (!order) throw new ApiError('Order not found.', 'not_found')
  if (order.status !== 'pending_payment' && order.status !== 'payment_failed')
    throw new ApiError('This order has already been paid or cancelled.')
  const user = getCurrentUser()
  if (details.method === 'credit' && (user?.role !== 'hospital' || !user.verified))
    throw new ApiError('Credit terms are available to verified hospitals only.')
  const invalid = validatePayment(details)
  if (invalid) throw new ApiError(invalid, 'validation')

  const record = await gateway.charge({ orderId, amount: order.price.total, ...details })
  if (record.status === 'success') recordPaymentSuccess(orderId, record)
  else recordPaymentFailure(orderId, record)
  return record
}
