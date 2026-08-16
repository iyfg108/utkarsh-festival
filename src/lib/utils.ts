import type {
  AccentKey,
  CertificateStatus,
  PaymentMethod,
  PaymentStatus,
} from './types'

/** Tiny classnames helper — no dependency needed for what we do here. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* -------------------------------------------------------------------------
   Accent palette — one source of truth so tracks stay visually consistent
   across cards, detail pages, chips and the admin portal.
   Tailwind needs literal class strings, so these are written out in full.
   ------------------------------------------------------------------------- */
export interface AccentStyles {
  /** Soft tinted surface for cards */
  surface: string
  /** Solid fill for icon badges and buttons */
  solid: string
  /** Text colour on a light background */
  text: string
  /** Border colour */
  border: string
  /** Gradient used for hero washes and progress bars */
  gradient: string
  /** Small chip */
  chip: string
  /** Glow ring on hover */
  glow: string
}

const ACCENTS: Record<AccentKey, AccentStyles> = {
  saffron: {
    surface: 'bg-marigold-50',
    solid: 'bg-marigold-500 text-white',
    text: 'text-marigold-700',
    border: 'border-marigold-200',
    gradient: 'from-marigold-400 to-marigold-600',
    chip: 'bg-marigold-100 text-marigold-800 border-marigold-200',
    glow: 'group-hover:shadow-glow-marigold',
  },
  amber: {
    surface: 'bg-amber-50',
    solid: 'bg-amber-500 text-white',
    text: 'text-amber-700',
    border: 'border-amber-200',
    gradient: 'from-amber-400 to-orange-500',
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    glow: 'group-hover:shadow-glow-marigold',
  },
  gold: {
    surface: 'bg-yellow-50',
    solid: 'bg-gold-500 text-night-950',
    text: 'text-gold-600',
    border: 'border-gold-300',
    gradient: 'from-gold-300 to-marigold-500',
    chip: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    glow: 'group-hover:shadow-glow-marigold',
  },
  peacock: {
    surface: 'bg-peacock-50',
    solid: 'bg-peacock-500 text-white',
    text: 'text-peacock-700',
    border: 'border-peacock-200',
    gradient: 'from-peacock-400 to-peacock-600',
    chip: 'bg-peacock-100 text-peacock-800 border-peacock-200',
    glow: 'group-hover:shadow-glow-peacock',
  },
  teal: {
    surface: 'bg-teal-50',
    solid: 'bg-teal-500 text-white',
    text: 'text-teal-700',
    border: 'border-teal-200',
    gradient: 'from-teal-400 to-peacock-600',
    chip: 'bg-teal-100 text-teal-800 border-teal-200',
    glow: 'group-hover:shadow-glow-peacock',
  },
  indigo: {
    surface: 'bg-night-50',
    solid: 'bg-night-600 text-white',
    text: 'text-night-700',
    border: 'border-night-200',
    gradient: 'from-night-500 to-night-700',
    chip: 'bg-night-100 text-night-800 border-night-200',
    glow: 'group-hover:shadow-lift',
  },
  magenta: {
    surface: 'bg-fuchsia-50',
    solid: 'bg-fuchsia-600 text-white',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    gradient: 'from-fuchsia-500 to-rose-festival-600',
    chip: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    glow: 'group-hover:shadow-lift',
  },
  rose: {
    surface: 'bg-rose-50',
    solid: 'bg-rose-festival-500 text-white',
    text: 'text-rose-festival-600',
    border: 'border-rose-200',
    gradient: 'from-rose-festival-400 to-fuchsia-600',
    chip: 'bg-rose-100 text-rose-800 border-rose-200',
    glow: 'group-hover:shadow-lift',
  },
}

export function accent(key: string | null | undefined): AccentStyles {
  return ACCENTS[(key ?? 'saffron') as AccentKey] ?? ACCENTS.saffron
}

/* ------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------
   Payment & certificate labels — one source of truth for the whole app.
   ------------------------------------------------------------------------- */

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Not paid',
  awaiting_verification: 'Awaiting check',
  paid: 'Paid',
  failed: 'Failed',
  waived: 'Waived',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  razorpay: 'Card / net banking',
  upi_manual: 'UPI',
  pay_at_venue: 'At the venue',
}

/**
 * Builds the `upi://pay` deep link. Tapping it on a phone opens GPay / PhonePe
 * / Paytm with the amount already filled in; the same string is what the QR
 * code encodes, so scanning and tapping lead to exactly the same screen.
 */
export function upiPayUri(opts: {
  vpa: string
  payeeName: string
  amount: number
  note?: string
  /** Unique transaction reference — mandatory per NPCI spec. Defaults to a random id. */
  tr?: string
}): string {
  // NPCI spec requires `am` with exactly two decimal places (e.g. "99.00").
  // Without it, strict apps like PhonePe reject the payment with a misleading
  // "maximum amount exceeded" error even for small amounts like ₹99.
  const amFormatted = opts.amount.toFixed(2)

  // `tr` is a mandatory unique transaction reference for merchant payments.
  // Omitting it causes PhonePe and other PSP apps to reject the intent.
  const tr = opts.tr ?? `UTK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const params = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.payeeName,
    am: amFormatted,
    cu: 'INR',
    tr,
  })
  if (opts.note) params.set('tn', opts.note)
  // URLSearchParams writes spaces as "+", which is only correct for HTML form
  // bodies. UPI apps read these as plain URI components, and the sloppier ones
  // render the payee as "ISKCON+Guwahati" and put a literal "+" in the note we
  // later match against the statement. %20 is unambiguous everywhere.
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`
}

/**
 * Per-app deep links carrying the same parameters as `upiPayUri`.
 *
 * On Android every UPI app claims `upi://pay`, so the plain link already opens
 * the system chooser listing whatever the student has installed — which is what
 * we want, and these are not needed. On iOS almost nothing claims `upi://`;
 * the apps register their own schemes instead, so this is the only way to reach
 * them. A link to an app that is not installed simply does nothing, which is
 * why the UPI ID is always shown as well.
 */
export function upiAppLinks(uri: string): { name: string; href: string }[] {
  const query = uri.slice(uri.indexOf('?'))
  return [
    { name: 'Google Pay', href: `gpay://upi/pay${query}` },
    { name: 'PhonePe', href: `phonepe://pay${query}` },
    { name: 'Paytm', href: `paytmmp://pay${query}` },
    { name: 'BHIM', href: `bhim://pay${query}` },
  ]
}

/**
 * Coarse platform read. Used only to decide between showing a QR code and
 * showing "open your UPI app" buttons — a phone cannot scan its own screen,
 * and a desktop cannot open a UPI app.
 */
export function devicePlatform(): 'android' | 'ios' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'ios'
  return 'desktop'
}

export const CERTIFICATE_LABEL: Record<CertificateStatus, string> = {
  pending: 'Not issued',
  collected: 'Collected in person',
  emailed: 'Sent by email',
  whatsapp_sent: 'Sent on WhatsApp',
}

/**
 * "in 45 minutes" / "in 2 hours" — for telling a student how long their
 * unpaid song slot is held. Returns null once it has passed.
 */
export function timeRemaining(iso: string | null | undefined): string | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms) || ms <= 0) return null

  const mins = Math.round(ms / 60_000)
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'}`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'}`
}

/** "just now" / "12 min ago" / "3 hours ago" — for the activity feed. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  if (ms < 60_000) return 'just now'

  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

export function formatMoney(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`
}

export function formatDate(value: string | null | undefined, withTime = false): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function formatLongDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function classLabel(n: number | null | undefined): string {
  if (!n) return '—'
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  return `${n}${suffix}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Indian mobile numbers, loosely — enough to catch typos, not to gatekeep. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 13
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** Escapes a value for CSV — quotes, commas and newlines all handled. */
export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return ''
  const keys = columns ?? Object.keys(rows[0])
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM so Excel opens UTF-8 (Assamese/Devanagari names) correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function pluralise(n: number, one: string, many?: string): string {
  return n === 1 ? one : (many ?? `${one}s`)
}
