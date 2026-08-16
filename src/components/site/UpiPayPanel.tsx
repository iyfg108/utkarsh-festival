import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { submitUpiReference } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import {
  cn,
  devicePlatform,
  formatMoney,
  timeRemaining,
  upiAppLinks,
  upiPayUri,
} from '@/lib/utils'
import type { PaymentSettings } from '@/lib/types'
import { QrCode } from '@/components/QrCode'
import { Button } from '@/components/ui/Button'
import { CheckIcon, ClipboardIcon, QrIcon } from '@/components/Icons'

/**
 * The UPI payment step: pay to our VPA, then report the reference number.
 *
 * Nothing here marks anyone paid — the reference goes into the organiser's
 * verification queue, and a human checks it against the bank statement. That
 * is the whole trade-off of taking UPI directly instead of through a gateway.
 *
 * The screen is arranged around how the student actually got here. Most arrive
 * on a phone, and a phone cannot scan its own screen: for them the QR is a dead
 * end and the tap-to-open link is the whole point, so that leads and the QR is
 * tucked behind a toggle for the case where a parent pays from another handset.
 * On a desktop it is the other way round.
 *
 * Paying means leaving the page for another app, so the return trip is handled
 * explicitly — see the visibilitychange effect below.
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
  const [leftForApp, setLeftForApp] = useState(false)
  const [backFromApp, setBackFromApp] = useState(false)
  const [showQr, setShowQr] = useState(false)

  const referenceInput = useRef<HTMLInputElement>(null)
  const platform = useMemo(devicePlatform, [])
  const isPhone = platform === 'android' || platform === 'ios'

  const vpa = payment.upi_id
  const uri = useMemo(
    () =>
      upiPayUri({
        vpa,
        payeeName: payment.upi_name || 'Utkarsh Heritage Festival',
        amount,
        note: `Utkarsh ${regCode}`,
      }),
    // Intentionally stable for the lifetime of this panel — a student should
    // not find the QR or app link changing under them while they type their UTR.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vpa, payment.upi_name, amount, regCode],
  )

  /**
   * Tapping a UPI link hands the phone to another app. When the student comes
   * back, the browser restores this tab exactly as it was — including the empty
   * reference box, halfway up a long page, with no sign of what to do next.
   *
   * So: notice the return, say welcome back, and put the cursor in the one box
   * they came back to fill. Only armed once they have actually tapped a pay
   * link, so merely switching tabs never triggers it.
   */
  useEffect(() => {
    if (!leftForApp || done) return

    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      setBackFromApp(true)
      // A beat for the browser to finish restoring the page before we move it.
      window.setTimeout(() => {
        referenceInput.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        referenceInput.current?.focus({ preventScroll: true })
      }, 400)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [leftForApp, done])

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
      <div className="rounded-4xl border-2 border-peacock-200 bg-peacock-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-peacock-500 text-white">
            <CheckIcon className="size-5" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-peacock-900">
              Reference received — we are checking it
            </p>
            <p className="mt-1 text-sm leading-relaxed text-peacock-900/80">
              You sent us <strong className="font-mono break-all">{done}</strong>. An organiser will
              match it against our bank statement, usually within a day. Your place is held in the
              meantime — nothing else is needed from you.
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
      <div className="rounded-4xl border-2 border-rose-300 bg-rose-50 p-5 sm:p-6">
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
      <div className="border-b border-marigold-200 px-5 py-5 sm:px-6">
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

      {/* ---------------------------------------------------------- step 1 */}
      <div className="px-5 py-6 sm:px-6">
        <StepLabel n={1}>Pay {formatMoney(amount)}</StepLabel>

        {isPhone ? (
          <div className="mt-3">
            <a
              href={uri}
              onClick={() => setLeftForApp(true)}
              className="flex w-full flex-col items-center rounded-2xl bg-night-950 px-5 py-4 text-cream-50 transition active:bg-night-900"
            >
              <span className="text-base font-bold">Open my UPI app</span>
              <span className="mt-0.5 text-[12px] text-cream-50/70">
                Pays {formatMoney(amount)} to {payment.upi_name || 'Utkarsh'}
              </span>
            </a>
            <p className="mt-2 text-center text-[12px] leading-relaxed text-marigold-900/65">
              {platform === 'android'
                ? 'Your phone will ask which app to use — GPay, PhonePe, Paytm, BHIM or any other.'
                : 'If your phone asks which app to use, pick any UPI app you have.'}
            </p>

            {/* iOS apps mostly do not claim `upi://`, so offer them by name. */}
            {platform === 'ios' ? (
              <div className="mt-4 rounded-2xl border border-marigold-200 bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-night-950/45">
                  Nothing opened? Tap your app
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {upiAppLinks(uri).map((app) => (
                    <a
                      key={app.name}
                      href={app.href}
                      onClick={() => setLeftForApp(true)}
                      className="rounded-xl border border-night-950/12 bg-white px-3 py-2 text-[13px] font-bold text-night-950 transition active:bg-night-950/5"
                    >
                      {app.name}
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-night-950/50">
                  A button does nothing if that app is not installed — use the UPI ID below instead.
                </p>
              </div>
            ) : null}

            <VpaCard
              vpa={vpa}
              payeeName={payment.upi_name}
              amount={amount}
              regCode={regCode}
              copied={copied}
              onCopy={copyVpa}
              className="mt-4"
            />

            {/*
              Kept for the case where a parent pays from a second handset.
              Rendered only once opened: `details` hides its children with CSS
              but still mounts them, and mounting QrCode pulls down the ~7 KB
              encoder — a download most phone users would never have a use for.
            */}
            <details className="mt-4" onToggle={(e) => setShowQr(e.currentTarget.open)}>
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-marigold-300 bg-white/60 px-4 py-2.5 text-[13px] font-bold text-marigold-900 [&::-webkit-details-marker]:hidden">
                <QrIcon className="size-4" />
                Show QR code — to pay from another phone
              </summary>
              <div className="mt-3 flex justify-center">
                {showQr ? (
                  <QrCode value={uri} size={188} className="ring-1 ring-marigold-200" />
                ) : null}
              </div>
            </details>
          </div>
        ) : (
          <div className="mt-3 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="mx-auto sm:mx-0">
              <QrCode value={uri} size={188} className="ring-1 ring-marigold-200" />
              <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-marigold-900/60">
                Scan with any UPI app
              </p>
            </div>
            <VpaCard
              vpa={vpa}
              payeeName={payment.upi_name}
              amount={amount}
              regCode={regCode}
              copied={copied}
              onCopy={copyVpa}
            />
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- step 2 */}
      <form onSubmit={onSubmit} className="border-t border-marigold-200 px-5 py-6 sm:px-6">
        {backFromApp ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border-2 border-peacock-300 bg-peacock-50 px-4 py-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-peacock-500 text-white">
              <CheckIcon className="size-3.5" strokeWidth={3} />
            </span>
            <p className="text-[13px] leading-relaxed text-peacock-900">
              <strong>Welcome back.</strong> If the payment went through, enter the reference number
              below. If it did not, tap <strong>Open my UPI app</strong> again — nothing has been
              lost.
            </p>
          </div>
        ) : null}

        <StepLabel n={2}>
          <label htmlFor="upi-ref">Tell us the reference number</label>
        </StepLabel>

        <p className="mt-2 text-[13px] leading-relaxed text-marigold-900/75">
          Your payment app shows it as <strong>UTR</strong>, <strong>Transaction ID</strong> or{' '}
          <strong>Reference No</strong> — usually 12 digits. This is how we find your payment on our
          statement.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="upi-ref"
            ref={referenceInput}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. 452312998877"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            required
            className={cn(
              'w-full min-w-0 rounded-2xl border-2 bg-white px-4 py-3 font-mono text-[15px] tracking-wide outline-none transition',
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
          Do not have it to hand? Come back to the <strong>Check status</strong> page any time with
          your code <strong className="font-mono text-marigold-900/80">{regCode}</strong> and the
          guardian phone number, and submit it then.
        </p>
      </form>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function StepLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marigold-500 text-[12px] font-black text-white">
        {n}
      </span>
      <span className="text-sm font-bold text-marigold-900">{children}</span>
    </div>
  )
}

function VpaCard({
  vpa,
  payeeName,
  amount,
  regCode,
  copied,
  onCopy,
  className,
}: {
  vpa: string
  payeeName?: string
  amount: number
  regCode: string
  copied: boolean
  onCopy: () => void
  className?: string
}) {
  return (
    <div
      className={cn('rounded-2xl border border-marigold-200 bg-white p-4', className)}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-night-950/45">
        Or pay to this UPI ID
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-[15px] font-bold text-night-950">
          {vpa}
        </code>
        <button
          type="button"
          onClick={onCopy}
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
      {payeeName ? <p className="mt-1 text-[12px] text-night-950/50">{payeeName}</p> : null}
      <p className="mt-2 text-[12px] text-night-950/55">
        Amount: <strong className="text-night-950">{formatMoney(amount)}</strong> · Please add{' '}
        <strong className="font-mono text-night-950">{regCode}</strong> in the note if your app
        allows it.
      </p>
    </div>
  )
}
