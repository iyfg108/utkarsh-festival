import { useState } from 'react'
import type { FormEvent } from 'react'
import { submitUpiReference } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatMoney, timeRemaining, upiPayUri } from '@/lib/utils'
import type { PaymentSettings } from '@/lib/types'
import { QrCode } from '@/components/QrCode'
import { Button } from '@/components/ui/Button'
import { CheckIcon, ClipboardIcon } from '@/components/Icons'

/**
 * The UPI payment step: pay to our VPA, then report the reference number.
 *
 * Nothing here marks anyone paid — the reference goes into the organiser's
 * verification queue, and a human checks it against the bank statement. That
 * is the whole trade-off of taking UPI directly instead of through a gateway.
 */
export function UpiPayPanel({
  registrationId,
  regCode,
  amount,
  payment,
  submittedReference,
  holdExpiresAt,
  onSubmitted,
}: {
  registrationId: string
  regCode: string
  amount: number
  payment: PaymentSettings
  /** Set when the student has already reported a reference. */
  submittedReference?: string | null
  /** When the bhajan song slot is released if they do not pay. */
  holdExpiresAt?: string | null
  onSubmitted?: (reference: string) => void
}) {
  const [reference, setReference] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(submittedReference ?? null)
  const [copied, setCopied] = useState(false)

  const vpa = payment.upi_id
  const uri = upiPayUri({
    vpa,
    payeeName: payment.upi_name || 'Utkarsh Heritage Festival',
    amount,
    note: `Utkarsh ${regCode}`,
  })

  async function copyVpa() {
    try {
      await navigator.clipboard.writeText(vpa)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the id is on screen anyway */
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await submitUpiReference(registrationId, reference)
      const ref = result.reference ?? reference.trim().toUpperCase()
      setDone(ref)
      onSubmitted?.(ref)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  /* ---- already reported ------------------------------------------------ */
  if (done) {
    return (
      <div className="rounded-4xl border-2 border-peacock-200 bg-peacock-50 p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-peacock-500 text-white">
            <CheckIcon className="size-5" strokeWidth={3} />
          </span>
          <div>
            <p className="font-bold text-peacock-900">
              Reference received — we are checking it
            </p>
            <p className="mt-1 text-sm leading-relaxed text-peacock-900/80">
              You sent us <strong className="font-mono">{done}</strong>. An organiser will match it
              against our bank statement, usually within a day. Your place is held in the meantime —
              nothing else is needed from you.
            </p>
            <p className="mt-2 text-[13px] text-peacock-900/65">
              This page will show <strong>Paid</strong> once it is confirmed. If anything looks
              wrong we will call the guardian number on your registration.
            </p>
          </div>
        </div>
      </div>
    )
  }

  /* ---- not configured -------------------------------------------------- */
  if (!vpa) {
    return (
      <div className="rounded-4xl border-2 border-rose-300 bg-rose-50 p-6">
        <p className="font-bold text-rose-900">UPI is not set up yet</p>
        <p className="mt-1 text-sm leading-relaxed text-rose-800/85">
          Please contact the organisers to pay. (Organisers: set the UPI ID in
          Admin → Settings → Payment.)
        </p>
      </div>
    )
  }

  /* ---- pay + report ---------------------------------------------------- */
  return (
    <div className="overflow-hidden rounded-4xl border-2 border-marigold-300 bg-marigold-50">
      <div className="border-b border-marigold-200 px-6 py-5">
        <p className="font-bold text-marigold-900">Pay {formatMoney(amount)} by UPI</p>
        <p className="mt-0.5 text-sm text-marigold-900/75">
          Two steps: pay, then tell us the reference number so we can match it.
        </p>
        {timeRemaining(holdExpiresAt) ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 text-[12px] font-semibold text-marigold-900">
            Your place is held for another {timeRemaining(holdExpiresAt)}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_1fr] sm:items-start">
        {/* QR — mainly for desktop, or scanning from a second phone */}
        <div className="mx-auto sm:mx-0">
          <QrCode value={uri} size={188} className="ring-1 ring-marigold-200" />
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-marigold-900/60">
            Scan to pay
          </p>
        </div>

        <div>
          {/* On a phone this opens GPay / PhonePe / Paytm directly. */}
          <a
            href={uri}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-night-950 px-5 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-night-900 sm:hidden"
          >
            Open my UPI app to pay {formatMoney(amount)}
          </a>
          <p className="mt-2 text-center text-[12px] text-marigold-900/60 sm:hidden">
            Opens GPay, PhonePe, Paytm or any UPI app
          </p>

          <div className="mt-4 rounded-2xl border border-marigold-200 bg-white p-4 sm:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-night-950/45">
              Or pay to this UPI ID
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 break-all font-mono text-[15px] font-bold text-night-950">
                {vpa}
              </code>
              <button
                type="button"
                onClick={copyVpa}
                className="shrink-0 rounded-lg border border-night-950/12 px-2.5 py-1.5 text-[12px] font-bold text-night-950/70 transition hover:bg-night-950/5"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ClipboardIcon className="size-3.5" />
                    Copy
                  </span>
                )}
              </button>
            </div>
            {payment.upi_name ? (
              <p className="mt-1 text-[12px] text-night-950/50">{payment.upi_name}</p>
            ) : null}
            <p className="mt-2 text-[12px] text-night-950/55">
              Amount: <strong className="text-night-950">{formatMoney(amount)}</strong> · Please add{' '}
              <strong className="font-mono text-night-950">{regCode}</strong> in the note if your app
              allows it.
            </p>
          </div>
        </div>
      </div>

      {/* reference */}
      <form onSubmit={onSubmit} className="border-t border-marigold-200 px-6 py-6">
        <label
          htmlFor="upi-ref"
          className="block text-sm font-bold text-marigold-900"
        >
          After paying, enter the reference number
        </label>
        <p className="mt-1 text-[13px] leading-relaxed text-marigold-900/75">
          Your payment app shows it as <strong>UTR</strong>, <strong>Transaction ID</strong> or{' '}
          <strong>Reference No</strong> — usually 12 digits. This is how we find your payment on our
          statement.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="upi-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. 452312998877"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            required
            className={cn(
              'w-full rounded-2xl border-2 bg-white px-4 py-3 font-mono text-[15px] tracking-wide outline-none transition',
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15'
                : 'border-night-950/12 focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15',
            )}
          />
          <Button type="submit" loading={saving} className="shrink-0">
            Submit
          </Button>
        </div>

        {error ? (
          <p className="mt-2.5 text-[13px] font-semibold text-rose-700">{error}</p>
        ) : null}

        <p className="mt-3 text-[12px] leading-relaxed text-marigold-900/60">
          Do not have it to hand? You can come back to the <strong>Check status</strong> page later
          with your registration code and submit it then.
        </p>
      </form>
    </div>
  )
}
