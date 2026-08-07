import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'motion/react'
import { lookupRegistration } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { EntryOutcome, StatusResult } from '@/lib/types'
import { PageHeader } from '@/components/site/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Primitives'
import { SearchIcon, SchoolIcon, TrophyIcon } from '@/components/Icons'
import { Lotus } from '@/components/Decor'

const OUTCOME_LABEL: Record<EntryOutcome, { label: string; tone: Parameters<typeof Badge>[0]['tone'] }> = {
  registered: { label: 'Registered', tone: 'neutral' },
  shortlisted: { label: 'Shortlisted for the finale', tone: 'success' },
  not_shortlisted: { label: 'Not shortlisted', tone: 'neutral' },
  finalist: { label: 'Finalist', tone: 'info' },
  winner: { label: 'Winner', tone: 'gold' },
}

export default function Status() {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<StatusResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

      <section className="mx-auto max-w-2xl px-4 pb-24 sm:px-6 lg:px-8">
        <form
          onSubmit={onSubmit}
          className="rounded-4xl border border-night-950/8 bg-white p-7 stack-shadow sm:p-9"
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
            className="mt-6 w-full"
            icon={<SearchIcon className="size-5" />}
          >
            Find my registration
          </Button>

          <p className="mt-4 text-center text-[13px] text-night-950/50">
            Both fields must match — this keeps everyone's details private.
          </p>
        </form>

        {notFound ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-3xl border-2 border-dashed border-night-950/15 bg-white/70 px-6 py-10 text-center"
          >
            <h2 className="text-lg font-black text-night-950">We could not find that</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-night-950/60">
              Check that the code is exactly as it appears on your confirmation, and that the phone
              number is the guardian's number used while registering. Still stuck? Give us a call
              and we will look it up for you.
            </p>
          </motion.div>
        ) : null}

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 overflow-hidden rounded-4xl border border-night-950/8 bg-white stack-shadow"
          >
            <div className="relative overflow-hidden bg-night px-7 py-8">
              <Lotus className="absolute -right-6 -top-6 size-32 text-white/10" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
                Registration confirmed
              </p>
              <h2 className="mt-2 font-display text-3xl font-black text-cream-50">
                {result.full_name}
              </h2>
              <p className="mt-1 font-mono text-lg font-bold tracking-wider text-marigold-300">
                {result.reg_code}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cream-100">
                  Class {result.class_level}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cream-100">
                  {result.category}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold',
                    result.stage === 'finals'
                      ? 'bg-marigold-400 text-night-950'
                      : 'border border-white/15 bg-white/10 text-cream-100',
                  )}
                >
                  {result.stage === 'finals' ? '🏆 Through to the finale' : 'School round'}
                </span>
              </div>
            </div>

            <div className="px-7 py-6">
              <p className="flex items-center gap-2 text-sm text-night-950/60">
                <SchoolIcon className="size-4 text-peacock-600" />
                {result.school}
              </p>
              <p className="mt-1 text-xs text-night-950/40">
                Registered on {formatDate(result.created_at)}
              </p>

              <h3 className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                Your competitions
              </h3>

              <ul className="mt-4 space-y-3">
                {result.entries.map((e) => {
                  const o = OUTCOME_LABEL[e.outcome] ?? OUTCOME_LABEL.registered
                  return (
                    <li
                      key={e.track_slug}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-night-950/8 bg-cream-50/60 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-night-950">{e.track}</p>
                        {e.selection ? (
                          <p className="text-[13px] text-night-950/55">{e.selection}</p>
                        ) : null}
                        {e.team_name ? (
                          <p className="text-[13px] italic text-night-950/45">
                            Team: {e.team_name}
                          </p>
                        ) : null}
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

              <p className="mt-6 rounded-2xl border border-peacock-200 bg-peacock-50 px-5 py-4 text-[13px] leading-relaxed text-peacock-900">
                Shortlisting happens after your school's Stage 1 round. We will call the guardian
                number on this registration — keep an eye on this page too, it updates as soon as
                results are entered.
              </p>
            </div>
          </motion.div>
        ) : null}
      </section>
    </>
  )
}
