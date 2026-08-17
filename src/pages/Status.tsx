import { useState } from 'react'
import type { FormEvent } from 'react'
import { useFestival } from '@/context/FestivalContext'
import { lookupRegistration } from '@/lib/queries'
import { payForRegistration } from '@/lib/razorpay'
import { friendlyError } from '@/lib/supabase'
import {
  CERTIFICATE_LABEL,
  cn,
  formatDate,
  formatLongDate,
  formatMoney,
} from '@/lib/utils'
import type { EntryOutcome, StatusResult } from '@/lib/types'
import { PageHeader } from '@/components/site/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Primitives'
import {
  CheckIcon,
  LockIcon,
  SchoolIcon,
  SearchIcon,
  TrophyIcon,
} from '@/components/Icons'
import { Lotus } from '@/components/Decor'
import { UpiPayPanel } from '@/components/site/UpiPayPanel'

const OUTCOME: Record<EntryOutcome, { label: string; tone: 'neutral' | 'success' | 'gold' }> = {
  registered: { label: 'Registered', tone: 'neutral' },
  participated: { label: 'Participated', tone: 'success' },
  absent: { label: 'Absent', tone: 'neutral' },
  winner: { label: 'Winner', tone: 'gold' },
}

export default function Status() {
  const { settings } = useFestival()
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<StatusResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  const event = settings?.event

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotFound(false)
    setResult(null)

    try {
      const found = await lookupRegistration(code.trim(), phone.trim())
      if (found) setResult(found)
      else setNotFound(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  async function payNow() {
    if (!result) return
    setPaying(true)
    setError(null)
    try {
      const outcome = await payForRegistration(result.registration_id)
      if (outcome.status === 'paid' || outcome.status === 'already_paid') {
        // Re-read from the server rather than trusting the browser.
        const fresh = await lookupRegistration(code.trim(), phone.trim())
        if (fresh) setResult(fresh)
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setPaying(false)
    }
  }

  const unpaid = result != null && result.payment_status !== 'paid'
  const unpaidOnline = unpaid && result.payment_method === 'razorpay'
  const unpaidAtVenue = unpaid && result.payment_method === 'pay_at_venue'
  const unpaidUpi = unpaid && result.payment_method === 'upi_manual'
  const awaitingCheck = result?.payment_status === 'awaiting_verification'

  async function refresh() {
    const fresh = await lookupRegistration(code.trim(), phone.trim())
    if (fresh) setResult(fresh)
  }

  return (
    <>
      <PageHeader
        eyebrow="Check status"
        title={
          <>
            Look up your <span className="text-gradient-festival">registration</span>
          </>
        }
        subtitle="Enter your registration code and the guardian phone number you registered with."
      />

      <section className="mx-auto max-w-2xl px-4 pb-20 sm:px-6 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="rounded-4xl border border-night-950/8 bg-white p-6 stack-shadow sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Registration code"
              placeholder="UTK26-1042"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              spellCheck={false}
            />
            <Input
              label="Guardian phone number"
              placeholder="98640 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="mt-5 w-full"
            icon={<SearchIcon className="size-5" />}
          >
            Find my registration
          </Button>

          <p className="mt-4 text-center text-[13px] text-night-950/50">
            Both fields must match — this keeps everyone's details private.
          </p>
        </form>

        {notFound ? (
          <div className="mt-5 rounded-3xl border-2 border-dashed border-night-950/15 bg-white/70 px-6 py-9 text-center">
            <h2 className="text-lg font-black text-night-950">We could not find that</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-night-950/60">
              Check the code matches your confirmation exactly, and that the phone number is the
              guardian's number used while registering. Still stuck? Give us a call.
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-5 overflow-hidden rounded-4xl border border-night-950/8 bg-white stack-shadow">
            <div className="relative overflow-hidden bg-night px-6 py-7">
              <Lotus className="absolute -right-6 -top-6 size-28 text-white/10" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
                Registration found
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-black text-cream-50 sm:text-3xl">
                {result.full_name}
              </h2>
              <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-marigold-300">
                {result.reg_code}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cream-100">
                  Class {result.class_level}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold',
                    result.payment_status === 'paid'
                      ? 'bg-emerald-400 text-emerald-950'
                      : awaitingCheck
                        ? 'bg-peacock-300 text-peacock-950'
                        : 'bg-rose-400 text-rose-950',
                  )}
                >
                  {result.payment_status === 'paid'
                    ? `${formatMoney(result.fee_amount)} paid`
                    : awaitingCheck
                      ? 'Payment being checked'
                      : `${formatMoney(result.fee_amount)} due`}
                </span>
              </div>
            </div>

            {/* payment */}
            {unpaidUpi && settings?.payment ? (
              <div className="border-b border-night-950/8 p-5">
                <UpiPayPanel
                  registrationId={result.registration_id}
                  regCode={result.reg_code}
                  amount={result.fee_amount}
                  payment={settings.payment}
                  submittedReference={result.upi_reference}
                  holdExpiresAt={result.hold_expires_at}
                  onSubmitted={() => void refresh()}
                />
              </div>
            ) : null}

            {unpaidOnline ? (
              <div className="border-b border-night-950/8 bg-rose-50 px-6 py-5">
                <p className="font-bold text-rose-900">Your fee has not been paid yet</p>
                <p className="mt-1 text-sm leading-relaxed text-rose-800/85">
                  Your entry is confirmed once the {formatMoney(result.fee_amount)} fee is paid.
                </p>
                <Button
                  className="mt-4"
                  loading={paying}
                  onClick={payNow}
                  icon={<LockIcon className="size-4" />}
                >
                  Pay {formatMoney(result.fee_amount)} now
                </Button>
              </div>
            ) : null}

            {unpaidAtVenue ? (
              <div className="border-b border-night-950/8 bg-marigold-50 px-6 py-5">
                <p className="font-bold text-marigold-900">
                  Bring {formatMoney(result.fee_amount)} on the day
                </p>
                <p className="mt-1 text-sm leading-relaxed text-marigold-900/80">
                  You chose to pay at {event?.venue ?? 'the temple'} on{' '}
                  {event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'}. Prefer to
                  pay now instead?
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  loading={paying}
                  onClick={payNow}
                  icon={<LockIcon className="size-4" />}
                >
                  Pay online instead
                </Button>
              </div>
            ) : null}

            {result.payment_status === 'paid' ? (
              <div className="flex items-center gap-3 border-b border-night-950/8 bg-emerald-50 px-6 py-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white">
                  <CheckIcon className="size-4" strokeWidth={3} />
                </span>
                <p className="text-sm font-bold text-emerald-900">
                  {formatMoney(result.fee_amount)} paid — nothing more to do
                </p>
              </div>
            ) : null}

            <div className="px-6 py-5">
              <p className="flex items-center gap-2 text-sm text-night-950/60">
                <SchoolIcon className="size-4 text-peacock-600" />
                {result.school_name}
              </p>
              <p className="mt-1 text-xs text-night-950/40">
                Registered on {formatDate(result.created_at)}
              </p>

              <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                Your competitions
              </h3>

              <ul className="mt-3.5 space-y-2.5">
                {result.entries.map((e) => {
                  const o = OUTCOME[e.outcome] ?? OUTCOME.registered
                  return (
                    <li
                      key={e.track_slug}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-night-950/8 bg-cream-50/60 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-night-950">{e.track}</p>
                        <p className="text-[12px] text-night-950/55">
                          At the temple
                          {e.event_date ? ` · ${formatLongDate(e.event_date)}` : ''}
                          {e.selection ? ` · ${e.selection}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {e.award ? (
                          <Badge tone="gold">
                            <TrophyIcon className="size-3" />
                            {e.award}
                          </Badge>
                        ) : null}
                        <Badge tone={o.tone}>{o.label}</Badge>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-night-950/8 px-4 py-3">
                <span className="text-sm font-semibold text-night-950/60">Certificate</span>
                <Badge tone={result.certificate_status === 'pending' ? 'neutral' : 'success'}>
                  {CERTIFICATE_LABEL[result.certificate_status]}
                </Badge>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}
