import { useFestival } from '@/context/FestivalContext'
import { useAsync } from '@/hooks/useAsync'
import { fetchPublicStats } from '@/lib/queries'
import { cn, formatLongDate } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { CountUp, Reveal, SectionHeading } from '@/components/ui/Primitives'
import {
  ArrowRightIcon,
  CalendarIcon,
  MapPinIcon,
  SchoolIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'
import {
  Diya,
  Flute,
  Lotus,
  MarigoldGarland,
  Rangoli,
  SoftGlow,
  StarField,
} from '@/components/Decor'
import { CompetitionCard } from '@/components/site/CompetitionCard'
import { Countdown } from '@/components/site/Countdown'

export default function Home() {
  const { settings, tracks, onlineTracks, onsiteTracks } = useFestival()
  const stats = useAsync(() => fetchPublicStats(), [])

  const event = settings?.event
  const reg = settings?.registration
  const regOpen = reg?.open ?? false

  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative isolate px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <SoftGlow />
        <Rangoli
          className="absolute -right-32 -top-20 -z-10 hidden size-[30rem] text-marigold-300/40 lg:block"
          petals={14}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-marigold-300 bg-marigold-50 px-4 py-1.5">
              <span className="size-1.5 rounded-full bg-marigold-500" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-marigold-700">
                {event?.edition ?? '2026'} · Guwahati · Class 1–10
              </span>
            </span>

            <h1 className="mt-5 text-[2.6rem] font-black leading-[0.98] tracking-tight text-night-950 sm:text-6xl lg:text-7xl">
              Your talent.
              <br />
              <span className="text-gradient-festival">Our heritage.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-night-950/70 sm:text-lg">
              Five competitions in art, music, scripture and general knowledge — open to
              every student from Class 1 to 10. Enter as many as you like.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {regOpen ? (
                <ButtonLink to="/register" size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
                  Register now
                </ButtonLink>
              ) : (
                <span className="rounded-2xl border-2 border-night-950/12 px-6 py-4 text-sm font-bold text-night-950/55">
                  Registration opens soon
                </span>
              )}
              <ButtonLink to="/competitions" size="lg" variant="outline">
                See the competitions
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-night-950/60">
              <span className="flex items-center gap-2">
                <TrophyIcon className="size-4 text-marigold-600" />
                Prizes &amp; certificates for all
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="size-4 text-peacock-600" />
                {event?.venue ?? 'ISKCON Ulubari'}
              </span>
            </div>
          </div>

          {/* dates card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-night p-6 shadow-2xl sm:p-8">
            <StarField count={16} />
            <Rangoli className="absolute -bottom-14 -right-14 size-56 text-white/8" petals={10} />

            <div className="relative">
              <div className="flex items-center gap-2 text-marigold-300">
                <Diya className="size-8" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                  First competition in
                </span>
              </div>

              <Countdown date={event?.online_date} light className="mt-5" />

              <div className="mt-7 space-y-4 border-t border-white/10 pt-6">
                <DayRow
                  date={event?.online_date}
                  label="Online"
                  detail={onlineTracks.map((t) => t.name).join(' · ') || 'Vedic Quiz'}
                  tone="peacock"
                />
                <DayRow
                  date={event?.onsite_date}
                  label="At the temple"
                  detail={onsiteTracks.map((t) => t.name).join(' · ') || 'Art, Fancy Dress, Bhajan, Shloka'}
                  tone="marigold"
                />
              </div>

              <Flute className="mt-7 w-full opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================== stats */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            {
              icon: <UsersIcon className="size-5" />,
              value: stats.data?.total_registrations ?? 0,
              label: 'Students registered',
              tone: 'from-marigold-400 to-marigold-600',
            },
            {
              icon: <SchoolIcon className="size-5" />,
              value: stats.data?.total_schools ?? 0,
              label: 'Schools taking part',
              tone: 'from-peacock-400 to-peacock-600',
            },
            {
              icon: <SparklesIcon className="size-5" />,
              value: stats.data?.total_tracks ?? tracks.length,
              label: 'Competitions',
              tone: 'from-rose-festival-400 to-fuchsia-600',
            },
            {
              icon: <TrophyIcon className="size-5" />,
              value: stats.data?.total_entries ?? 0,
              label: 'Entries so far',
              tone: 'from-night-500 to-night-700',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-night-950/8 bg-white p-4 stack-shadow sm:p-5"
            >
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white',
                  s.tone,
                )}
              >
                {s.icon}
              </span>
              <p className="mt-3 font-display text-2xl font-black tabular-nums text-night-950 sm:text-3xl">
                <CountUp value={s.value} duration={900} />
              </p>
              <p className="mt-0.5 text-[12px] font-semibold leading-snug text-night-950/55 sm:text-[13px]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== competitions */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Choose your stage"
              title={
                <>
                  Find the one that's <span className="text-gradient-festival">yours</span>
                </>
              }
              subtitle="Enter one, or enter them all — there is no extra charge and no age groups to worry about."
            />
          </Reveal>

          <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => (
              <Reveal key={t.id} delay={Math.min((i % 3) * 0.06, 0.12)}>
                <CompetitionCard track={t} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= what you get */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              eyebrow="Every participant"
              title="What you take home"
              subtitle="Whether you enter one competition or every one of them."
            />
          </Reveal>

          <div className="mt-11 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: <TrophyIcon className="size-6" />,
                title: 'Prizes',
                body: 'Trophies and medals for the top places in every competition.',
                tone: 'from-marigold-400 to-marigold-600',
              },
              {
                icon: <SparklesIcon className="size-6" />,
                title: 'A certificate',
                body: 'For every single participant — collected on the day, or sent to you afterwards.',
                tone: 'from-peacock-400 to-peacock-600',
              },
              {
                icon: <Lotus className="size-6" />,
                title: 'Prasadam',
                body: 'Served to everyone who comes to the temple on 30 August.',
                tone: 'from-rose-festival-400 to-fuchsia-600',
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.07}>
                <div className="h-full rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-white',
                      c.tone,
                    )}
                  >
                    {c.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-night-950">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-night-950/65">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= cta */}
      <section className="px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-night px-5 py-16 text-center sm:px-12">
          <StarField count={22} />
          <MarigoldGarland className="absolute inset-x-0 top-0" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-black leading-tight text-cream-50 sm:text-5xl">
              The stage is set.
              <br />
              <span className="text-gradient-gold">Now we need you on it.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-cream-100/70 sm:text-lg">
              Registration takes about two minutes, and you can enter as many competitions as you
              like.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {regOpen ? (
                <ButtonLink to="/register" size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
                  Register now
                </ButtonLink>
              ) : null}
              <ButtonLink
                to="/competitions"
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/10 text-cream-50 hover:border-marigold-300 hover:bg-white/15"
              >
                Browse competitions
              </ButtonLink>
            </div>

            {reg?.closes_at ? (
              <p className="mt-5 text-sm text-cream-100/50">
                Registration closes on {formatLongDate(reg.closes_at)}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ bits */

function DayRow({
  date,
  label,
  detail,
  tone,
}: {
  date: string | null | undefined
  label: string
  detail: string
  tone: 'peacock' | 'marigold'
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl text-center',
          tone === 'marigold' ? 'bg-marigold-400 text-night-950' : 'bg-peacock-500 text-white',
        )}
      >
        <CalendarIcon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-cream-50">
          {date ? formatLongDate(date) : 'Date to be announced'}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-marigold-300">{label}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-cream-100/55">{detail}</p>
      </div>
    </div>
  )
}
