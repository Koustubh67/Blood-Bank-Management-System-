import type { Order, PaymentMethod } from '@/types'
import type { CollectionRow, OpsOrder, OpsStore } from './types'
import { FEES } from '@/config/brand'
import { hashString, seeded } from '@/lib/utils'
import { storeById } from './stores'
import { cityById } from '@/data/cities'
import { DAY_MS, dayFraction, isoDay, startOfDay } from './time'

/**
 * Store takings per day. Past days are seeded aggregates (orders taken by
 * phone, walk-in and the app before this session); today is the seeded share
 * of the day so far plus every order live on the ops board and every order
 * paid in the app today. Amounts are processing charges, the logistics fee
 * and GST on logistics, the same split `quote` uses.
 */

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  credit: 'Hospital credit',
}

export const METHODS: PaymentMethod[] = ['credit', 'upi', 'netbanking', 'card']

const cache = new Map<string, CollectionRow>()

function emptyRow(day: number, store: OpsStore): CollectionRow {
  return { day, storeId: store.id, cityId: store.cityId, orders: 0, processing: 0, logistics: 0, gst: 0, total: 0, upi: 0, card: 0, netbanking: 0, credit: 0, refunds: 0 }
}

/** A full day's seeded takings for one store. */
function seededDay(store: OpsStore, day: number): CollectionRow {
  const key = `${store.id}:${day}`
  const hit = cache.get(key)
  if (hit) return hit
  const r = seeded(hashString(`col:${store.id}:${isoDay(day)}`))
  const dow = new Date(day).getDay()
  const weekday = dow === 0 ? 0.78 : dow === 6 ? 0.9 : 1
  const orders = Math.max(0, Math.round((store.kind === 'centre' ? 13 : 7) * store.busyness * weekday * (0.7 + r() * 0.6)))
  const processing = Math.round((orders * (1700 + r() * 1300)) / 50) * 50
  const logistics = orders * FEES.logistics
  const gst = Math.round(logistics * FEES.logisticsGstRate)
  const total = processing + logistics + gst
  const credit = Math.round(total * (0.32 + r() * 0.12))
  const upi = Math.round(total * (0.26 + r() * 0.1))
  const netbanking = Math.round(total * (0.1 + r() * 0.08))
  const refunds = orders > 0 && r() < 0.35 ? Math.round((total / orders) * (1 + Math.floor(r() * 2))) : 0
  const row: CollectionRow = { ...emptyRow(day, store), orders, processing, logistics, gst, total, credit, upi, netbanking, card: total - credit - upi - netbanking, refunds }
  cache.set(key, row)
  return row
}

/** Today's seeded share so far, scaled down from the full-day figure. */
function seededToday(store: OpsStore, now: number): CollectionRow {
  const full = seededDay(store, startOfDay(now))
  const f = dayFraction(now)
  const orders = Math.floor(full.orders * f)
  const k = full.orders ? orders / full.orders : 0
  const scale = (n: number) => Math.round(n * k)
  const row = { ...full, orders, processing: scale(full.processing), logistics: orders * FEES.logistics, refunds: f > 0.5 ? scale(full.refunds) : 0 }
  row.gst = Math.round(row.logistics * FEES.logisticsGstRate)
  row.total = row.processing + row.logistics + row.gst
  row.credit = scale(full.credit)
  row.upi = scale(full.upi)
  row.netbanking = scale(full.netbanking)
  row.card = Math.max(0, row.total - row.credit - row.upi - row.netbanking)
  return row
}

function addSale(row: CollectionRow, method: PaymentMethod, price: { processing: number; logistics: number; logisticsGst: number; total: number }, refund = 0) {
  row.orders += 1
  row.processing += price.processing
  row.logistics += price.logistics
  row.gst += price.logisticsGst
  row.total += price.total
  row[method] += price.total
  row.refunds += refund
}

/**
 * One row per store per day for the last `days` days (today included),
 * oldest first.
 */
export function collectionRows(stores: OpsStore[], days: number, now: number, live: OpsOrder[], appOrders: Order[]): CollectionRow[] {
  const today = startOfDay(now)
  const ids = new Set(stores.map((s) => s.id))
  const todayRows = new Map<string, CollectionRow>()
  for (const s of stores) todayRows.set(s.id, seededToday(s, now))

  for (const o of live) {
    if (o.source !== 'ops' || o.createdAt < today || !ids.has(o.storeId)) continue
    const row = todayRows.get(o.storeId)
    if (row) addSale(row, o.method, o.price, o.refund)
  }
  for (const o of appOrders) {
    const paid = o.payments.find((p) => p.status === 'success')
    if (!paid || paid.paidAt < today || !ids.has(o.centreId)) continue
    const row = todayRows.get(o.centreId)
    if (row) addSale(row, paid.method, o.price, o.status === 'cancelled' ? paid.amount : 0)
  }

  const rows: CollectionRow[] = []
  for (let i = days - 1; i >= 1; i--) {
    const day = today - i * DAY_MS
    for (const s of stores) rows.push(seededDay(s, day))
  }
  rows.push(...todayRows.values())
  return rows
}

export interface CollectionTotals extends Omit<CollectionRow, 'day' | 'storeId' | 'cityId'> {
  net: number
}

export function sumRows(rows: CollectionRow[]): CollectionTotals {
  const t = { orders: 0, processing: 0, logistics: 0, gst: 0, total: 0, upi: 0, card: 0, netbanking: 0, credit: 0, refunds: 0, net: 0 }
  for (const r of rows) {
    t.orders += r.orders
    t.processing += r.processing
    t.logistics += r.logistics
    t.gst += r.gst
    t.total += r.total
    t.upi += r.upi
    t.card += r.card
    t.netbanking += r.netbanking
    t.credit += r.credit
    t.refunds += r.refunds
  }
  t.net = t.total - t.refunds
  return t
}

/** Rows to CSV text (RFC 4180 quoting). */
export function rowsToCsv(rows: CollectionRow[]) {
  const header = ['Date', 'Store ID', 'Store', 'Type', 'City', 'Orders', 'Processing (INR)', 'Logistics (INR)', 'GST on logistics (INR)', 'Total (INR)', 'UPI', 'Card', 'Net banking', 'Hospital credit', 'Refunds (INR)', 'Net (INR)']
  const q = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = rows.map((r) => {
    const s = storeById(r.storeId)
    return [isoDay(r.day), r.storeId, s?.name ?? r.storeId, s?.kind === 'outlet' ? 'Outlet' : 'Blood centre', cityById(r.cityId).name, r.orders, r.processing, r.logistics, r.gst, r.total, r.upi, r.card, r.netbanking, r.credit, r.refunds, r.total - r.refunds]
      .map(q)
      .join(',')
  })
  return [header.map(q).join(','), ...lines].join('\n')
}

export function downloadCsv(filename: string, text: string) {
  // BOM so Excel opens the ₹-free UTF-8 file with the right encoding.
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
