import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useFestival } from '@/context/FestivalContext'
import { payForRegistration } from '@/lib/razorpay'
import { friendlyError } from '@/lib/supabase'
import { cn, formatLongDate, formatMoney } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import type { PaymentMethod } from '@/lib/types'
import { Button, ButtonLink } from '@/components/ui/Button'
import {
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  LockIcon,
  MapPinIcon,
} from '@/components/Icons'
import { Lotus, MarigoldGarland, StarField } from '@/components/Decor'
import { UpiPayPanel } from '@/components/site/UpiPayPanel'

interface SuccessState {
  regCode: string
  fullName: string
  entries: string[]
  paid: boolean
  method: PaymentMethod
  fee: number
  registrationId?: string
  holdExpiresAt?: string | null
  paymentError?: string
}

export default function RegisterSuccess() {
  const location = useLocation()
  const state = location.state as SuccessState | null
  const { settings } = useFestival()
  const reduced = usePrefersReducedMotion()
  const [copied, setCopied] = useState(false)
  const [paid, setPaid] = useState(state?.paid ?? false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(state?.paymentError ?? null)
  const fired = useRef(false)

  useEffect(() => {
    if (!state || fired.current || reduced) return
    fired.current = true

    const colours = ['#f98a00', '#ffc44d', '#06aed3', '#f43f5e', '#6b4fe4', '#e0a80d']
    const timers: number[] = []

    // Loaded on demand — no reason to ship a confetti library to every visitor.
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 80, spread: 74, origin: { y: 0.35 }, colors: colours })
      timers.push(
        window.setTimeout(
          () => confetti({ particleCount: 45, angle: 60, spread: 58, origin: { x: 0, y: 0.6 }, colors: colours }),
          220,
        ),
        window.setTimeout(
          () => confetti({ particleCount: 45, angle: 120, spread: 58, origin: { x: 1, y: 0.6 }, colors: colours }),
          380,
        ),
      )
    })

    return () => timers.forEach(window.clearTimeout)
  }, [state, reduced])

  if (!state?.regCode) return <Navigate to="/register" replace />

  const event = settings?.event
  const atVenue = state.method === 'pay_at_venue'
  const byUpi = state.method === 'upi_manual'

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(state!.regCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* clipboard blocked — the code is on screen anyway */
    }
  }

  async function retryPayment() {
    if (!state?.registrationId) return
    setPaying(true)
    setPayError(null)
    try {
      const outcome = await payForRegistration(state.registrationId)
      if (outcome.status === 'paid' || outcome.status === 'already_paid') setPaid(true)
    } catch (err) {
      setPayError(friendlyError(err))
    } finally {
      setPaying(false)
    }
  }

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div
          className={cn(
            'mx-auto grid size-20 place-items-center rounded-full shadow-lift',
            paid || atVenue
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
              : 'bg-gradient-to-br from-marigold-400 to-marigold-600',
          )}
        >
          <CheckIcon className="size-10 text-white" strokeWidth={3} />
        </div>

        <div className="mt-7 text-center">
          <h1 className="text-3xl font-black leading-tight text-night-950 sm:text-5xl">
            You're in, {state.fullName.split(' ')[0]}!
          </h1>
          <p className="mx-auto mt-3.5 max-w-lg text-base leading-relaxed text-night-950/65 sm:text-lg">
            Your place at Utkarsh {event?.edition ?? ''} is saved. Keep the code below — you need it
            to check your status.
          </p>
        </div>

        {/* code card */}
        <div className="relative mt-8 overflow-hidden rounded-4xl bg-night px-6 py-8 text-center">
          <StarField count={14} />
          <MarigoldGarland className="absolute inset-x-0 top-0" />
          <Lotus className="absolute -bottom-6 -right-6 size-24 text-white/10" />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
              Your registration code
            </p>
            <p className="mt-2.5 font-mono text-3xl font-black tracking-[0.12em] text-cream-50 sm:text-5xl">
              {state.regCode}
            </p>

            <button
              type="button"
              onClick={copyCode}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-cream-100 transition hover:bg-white/20"
            >
              {copied ? (
                <>
                  <CheckIcon className="size-4 text-emerald-300" strokeWidth={3} />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardIcon className="size-4" />
                  Copy code
                </>
              )}
            </button>
          </div>
        </div>

        {/* payment */}
        {byUpi && !paid && state.registrationId && settings?.payment ? (
          <div className="mt-5">
            <UpiPayPanel
              registrationId={state.registrationId}
              regCode={state.regCode}
              amount={state.fee}
              payment={settings.payment}
              holdExpiresAt={state.holdExpiresAt}
            />
          </div>
        ) : (
        <div
          className={cn(
            'mt-5 rounded-4xl border-2 p-6',
            paid
              ? 'border-emerald-200 bg-emerald-50'
              : atVenue
                ? 'border-marigold-200 bg-marigold-50'
                : 'border-rose-300 bg-rose-50',
          )}
        >
          {paid ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
                <CheckIcon className="size-5" strokeWidth={3} />
              </span>
              <div>
                <p className="font-bold text-emerald-900">
                  {formatMoney(state.fee)} paid — you are all set
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-emerald-800/80">
                  Nothing more to do. We will be in touch before the competition.
                </p>
              </div>
            </div>
          ) : atVenue ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-marigold-500 text-white">
                <CalendarIcon className="size-5" />
              </span>
              <div>
                <p className="font-bold text-marigold-900">
                  Bring {formatMoney(state.fee)} on the day
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-marigold-900/80">
                  Pay in cash at {event?.venue ?? 'the temple'} on{' '}
                  {event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'}. Please
                  arrive a little early so the desk is not rushed — mention your registration code.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-bold text-rose-900">
                The {formatMoney(state.fee)} fee has not been paid yet
              </p>
              <p className="mt-1 text-sm leading-relaxed text-rose-800/85">
                Your place is saved, but your entry is only confirmed once the fee is paid.
                {payError ? ` ${payError}` : ''}
              </p>
              {state.registrationId ? (
                <Button
                  className="mt-4"
                  loading={paying}
                  onClick={retryPayment}
                  icon={<LockIcon className="size-4" />}
                >
                  Pay {formatMoney(state.fee)} now
                </Button>
              ) : (
                <ButtonLink to="/status" className="mt-4" variant="outline">
                  Pay from the status page
                </ButtonLink>
              )}
            </div>
          )}
        </div>
        )}

        {/* entries */}
        <div className="mt-5 rounded-4xl border border-night-950/8 bg-white p-6 stack-shadow">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
            You are entered in
          </h2>
          <ul className="mt-3.5 flex flex-wrap gap-2">
            {state.entries.map((e) => (
              <li
                key={e}
                className="rounded-full border-2 border-marigold-200 bg-marigold-50 px-4 py-1.5 text-sm font-bold text-marigold-800"
              >
                {e}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-4 border-t border-night-950/8 pt-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
              What happens next
            </h2>

            {event?.online_date ? (
              <Step
                icon={<CalendarIcon className="size-5" />}
                title={formatLongDate(event.online_date)}
                body="Online competitions. We send the link to your email or WhatsApp a day before."
              />
            ) : null}
            {event?.onsite_date ? (
              <Step
                icon={<MapPinIcon className="size-5" />}
                title={formatLongDate(event.onsite_date)}
                body={`Competitions at ${event.venue}. Prizes, certificates and prasadam on the day.`}
              />
            ) : null}
            <Step
              icon={<CheckIcon className="size-5" />}
              title="Your certificate"
              body="Collect it at the temple, or we will send a digital copy to your email or WhatsApp."
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/status" variant="outline">
            Check my status
          </ButtonLink>
          <ButtonLink to="/competitions">Explore other competitions</ButtonLink>
        </div>

        <p className="mt-6 text-center text-sm text-night-950/50">
          Take a screenshot of this page, or write the code down.{' '}
          <Link to="/contact" className="font-semibold text-peacock-700 underline underline-offset-2">
            Need help?
          </Link>
        </p>
      </div>
    </section>
  )
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-marigold-100 text-marigold-700">
        {icon}
      </span>
      <div>
        <p className="font-bold text-night-950">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-night-950/60">{body}</p>
      </div>
    </div>
  )
}
