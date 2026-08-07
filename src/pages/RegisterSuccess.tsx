import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useFestival } from '@/context/FestivalContext'
import { formatLongDate } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { ButtonLink } from '@/components/ui/Button'
import { CheckIcon, ClipboardIcon, CalendarIcon, MapPinIcon } from '@/components/Icons'
import { Lotus, MarigoldGarland, StarField, Rangoli } from '@/components/Decor'

interface SuccessState {
  regCode: string
  fullName: string
  entries: string[]
}

export default function RegisterSuccess() {
  const location = useLocation()
  const state = location.state as SuccessState | null
  const { settings } = useFestival()
  const reduced = usePrefersReducedMotion()
  const [copied, setCopied] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    if (!state || fired.current || reduced) return
    fired.current = true

    const colours = ['#f98a00', '#ffc44d', '#06aed3', '#f43f5e', '#6b4fe4', '#e0a80d']
    const timers: number[] = []

    // Loaded on demand — no reason to ship a confetti library to every visitor.
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 90, spread: 78, origin: { y: 0.35 }, colors: colours })
      timers.push(
        window.setTimeout(
          () =>
            confetti({ particleCount: 55, angle: 60, spread: 62, origin: { x: 0, y: 0.6 }, colors: colours }),
          220,
        ),
        window.setTimeout(
          () =>
            confetti({ particleCount: 55, angle: 120, spread: 62, origin: { x: 1, y: 0.6 }, colors: colours }),
          380,
        ),
      )
    })

    return () => timers.forEach(window.clearTimeout)
  }, [state, reduced])

  // Reached directly without registering — nothing to show.
  if (!state?.regCode) return <Navigate to="/register" replace />

  const event = settings?.event

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(state!.regCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      /* clipboard blocked — the code is on screen anyway */
    }
  }

  return (
    <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <Rangoli
        className="absolute left-1/2 top-10 -z-10 size-[40rem] -translate-x-1/2 text-marigold-300/25 animate-spin-slower"
        petals={22}
      />

      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lift"
        >
          <CheckIcon className="size-12 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-center"
        >
          <h1 className="text-4xl font-black leading-tight text-night-950 sm:text-5xl">
            You're in, {state.fullName.split(' ')[0]}!
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-night-950/65">
            Your place at Utkarsh {event?.edition ?? ''} is confirmed. Save the code below — you
            will need it to check your status later.
          </p>
        </motion.div>

        {/* code card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 overflow-hidden rounded-4xl bg-night px-7 py-9 text-center"
        >
          <StarField count={30} />
          <MarigoldGarland className="absolute inset-x-0 top-0 opacity-80" />
          <Lotus className="absolute -bottom-6 -right-6 size-28 text-white/10" />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
              Your registration code
            </p>
            <p className="mt-3 font-mono text-4xl font-black tracking-[0.14em] text-cream-50 sm:text-5xl">
              {state.regCode}
            </p>

            <button
              type="button"
              onClick={copyCode}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-cream-100 transition hover:bg-white/20"
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
        </motion.div>

        {/* entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-6 rounded-4xl border border-night-950/8 bg-white p-7 stack-shadow"
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
            You are entered in
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {state.entries.map((e) => (
              <li
                key={e}
                className="rounded-full border-2 border-marigold-200 bg-marigold-50 px-4 py-1.5 text-sm font-bold text-marigold-800"
              >
                {e}
              </li>
            ))}
          </ul>

          <div className="mt-7 space-y-4 border-t border-night-950/8 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
              What happens next
            </h2>

            <Step
              n={1}
              title="Your school round"
              body={
                event?.stage1_window ??
                'We will confirm the date with your school and let you know.'
              }
              icon={<CalendarIcon className="size-5" />}
            />
            <Step
              n={2}
              title="Shortlisting"
              body="If you are selected, we call the guardian number you gave us — and this shows up on the status page."
              icon={<CheckIcon className="size-5" />}
            />
            <Step
              n={3}
              title="The grand finale"
              body={`${event?.venue ?? 'ISKCON Ulubari'}${
                event?.stage2_date ? ` · ${formatLongDate(event.stage2_date)}` : ''
              }`}
              icon={<MapPinIcon className="size-5" />}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <ButtonLink to="/status" variant="outline">
            Check my status
          </ButtonLink>
          <ButtonLink to="/tracks">Explore other competitions</ButtonLink>
        </motion.div>

        <p className="mt-8 text-center text-sm text-night-950/50">
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
  n,
  title,
  body,
  icon,
}: {
  n: number
  title: string
  body: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-marigold-100 text-marigold-700">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-night-950/40">
          Step {n}
        </p>
        <p className="font-bold text-night-950">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-night-950/60">{body}</p>
      </div>
    </div>
  )
}
