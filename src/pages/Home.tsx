import { motion } from 'motion/react'
import { useFestival } from '@/context/FestivalContext'
import { useAsync } from '@/hooks/useAsync'
import { fetchGallery, fetchPublicStats, fetchTestimonials } from '@/lib/queries'
import { accent, cn, formatLongDate } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import {
  Badge,
  CountUp,
  Reveal,
  SectionHeading,
} from '@/components/ui/Primitives'
import {
  ArrowRightIcon,
  CalendarIcon,
  MapPinIcon,
  QuoteIcon,
  SchoolIcon,
  SparklesIcon,
  TrackIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'
import {
  AuroraBlobs,
  Diya,
  Flute,
  MarigoldGarland,
  PeacockFeather,
  PlaceholderTile,
  Rangoli,
  StarField,
} from '@/components/Decor'
import { TrackCard } from '@/components/site/TrackCard'
import { Countdown } from '@/components/site/Countdown'

export default function Home() {
  const { settings, tracks, categoriesForTrack } = useFestival()
  const stats = useAsync(() => fetchPublicStats(), [])
  const gallery = useAsync(() => fetchGallery(), [])
  const testimonials = useAsync(() => fetchTestimonials(), [])

  const event = settings?.event
  const regOpen = settings?.registration.open ?? false
  const featured = (gallery.data ?? []).filter((g) => g.is_featured).slice(0, 6)
  const quotes = testimonials.data ?? []

  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative isolate overflow-hidden px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-32 lg:pt-16">
        <AuroraBlobs />
        <div className="absolute inset-0 -z-10 bg-dots opacity-60" aria-hidden />

        <Rangoli
          className="absolute -right-40 -top-24 -z-10 hidden size-[34rem] text-marigold-300/45 animate-spin-slower lg:block"
          petals={18}
        />
        <PeacockFeather className="absolute -left-10 top-32 -z-10 hidden h-72 w-auto opacity-30 animate-float-slow xl:block" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-marigold-300 bg-marigold-50 px-4 py-1.5"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-marigold-500" />
                <span className="relative inline-flex size-2 rounded-full bg-marigold-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-marigold-700">
                {event?.edition ?? '2026'} Edition · Guwahati
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-[2.9rem] font-black leading-[0.98] tracking-tight text-night-950 sm:text-6xl lg:text-7xl"
            >
              Your talent.
              <br />
              Our heritage.
              <br />
              <span className="text-gradient-festival">One stage.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-night-950/70"
            >
              <strong className="font-bold text-night-950">Utkarsh</strong> is ISKCON Guwahati's annual
              heritage festival for school students — art, music, dance, drama, sloka and speech. Compete
              first at your own school, then perform at{' '}
              <strong className="font-bold text-night-950">{event?.venue ?? 'ISKCON Ulubari'}</strong>{' '}
              on the eve of Janmashtami.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              {regOpen ? (
                <ButtonLink
                  to="/register"
                  size="lg"
                  shimmer
                  iconRight={<ArrowRightIcon className="size-5" />}
                >
                  Register free
                </ButtonLink>
              ) : (
                <span className="rounded-2xl border-2 border-night-950/12 px-6 py-4 text-sm font-bold text-night-950/55">
                  Registration opens soon
                </span>
              )}
              <ButtonLink to="/tracks" size="lg" variant="outline">
                Explore competitions
              </ButtonLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.32 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-night-950/60"
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-marigold-600" />
                Finals on {event?.stage2_date ? formatLongDate(event.stage2_date) : 'Janmashtami eve'}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="size-4 text-peacock-600" />
                {event?.venue ?? 'ISKCON Ulubari, Guwahati'}
              </span>
              <span className="flex items-center gap-2">
                <TrophyIcon className="size-4 text-rose-festival-500" />
                Free to enter
              </span>
            </motion.div>
          </div>

          {/* countdown card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[2.25rem] bg-night p-8 shadow-2xl sm:p-10">
              <StarField count={34} />
              <Rangoli className="absolute -bottom-16 -right-16 size-64 text-white/10 animate-spin-slow" />

              <div className="relative">
                <div className="flex items-center gap-2 text-marigold-300">
                  <Diya className="size-9" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                    Grand finale in
                  </span>
                </div>

                <Countdown date={event?.stage2_date} light className="mt-6" />

                <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
                  <Stage
                    n={1}
                    label={event?.stage1_label ?? 'School Round'}
                    detail={event?.stage1_window ?? 'At your own school'}
                  />
                  <Stage
                    n={2}
                    label={event?.stage2_label ?? 'Grand Finale'}
                    detail={event?.venue ?? 'ISKCON Ulubari, Guwahati'}
                    highlight
                  />
                </div>

                <Flute className="mt-8 w-full opacity-80" />
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-night-950/8 bg-white px-5 py-3 stack-shadow sm:block">
              <p className="text-[11px] font-bold uppercase tracking-wider text-night-950/45">
                Open to
              </p>
              <p className="font-display text-lg font-black text-night-950">Class 1 – 12</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================= marquee */}
      <section className="relative border-y border-night-950/8 bg-night py-5" aria-hidden>
        <div className="marquee-mask overflow-hidden">
          <div className="marquee-track gap-10">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-10">
                {tracks.map((t) => (
                  <span
                    key={`${dup}-${t.id}`}
                    className="flex items-center gap-2.5 whitespace-nowrap font-display text-lg font-bold text-cream-100/80"
                  >
                    <TrackIcon name={t.icon} className="size-5 text-marigold-300" />
                    {t.name}
                    <span className="text-marigold-400/50">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================================== stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <UsersIcon className="size-6" />,
              value: stats.data?.total_registrations ?? 0,
              label: 'Students registered',
              tone: 'from-marigold-400 to-marigold-600',
            },
            {
              icon: <SchoolIcon className="size-6" />,
              value: stats.data?.total_schools ?? 0,
              label: 'Schools taking part',
              tone: 'from-peacock-400 to-peacock-600',
            },
            {
              icon: <SparklesIcon className="size-6" />,
              value: stats.data?.total_tracks ?? tracks.length,
              label: 'Competition tracks',
              tone: 'from-rose-festival-400 to-fuchsia-600',
            },
            {
              icon: <TrophyIcon className="size-6" />,
              value: stats.data?.total_entries ?? 0,
              label: 'Entries so far',
              tone: 'from-night-500 to-night-700',
            },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <div className="group relative overflow-hidden rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow card-lift">
                <span
                  className={cn(
                    'mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white',
                    s.tone,
                  )}
                >
                  {s.icon}
                </span>
                <p className="font-display text-4xl font-black tabular-nums text-night-950">
                  <CountUp value={s.value} />
                  {s.value > 0 ? '+' : ''}
                </p>
                <p className="mt-1 text-sm font-semibold text-night-950/55">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================= journey */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title={
                <>
                  Two stages,{' '}
                  <span className="text-gradient-festival">one unforgettable evening</span>
                </>
              }
              subtitle="Everyone starts at their own school. The best from every school go on to perform at the temple on Janmashtami eve."
            />
          </Reveal>

          <div className="relative mt-16 grid gap-8 lg:grid-cols-2">
            {/* connector */}
            <div
              className="absolute left-1/2 top-1/2 hidden h-px w-24 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-marigold-400 to-peacock-500 lg:block"
              aria-hidden
            />

            <Reveal>
              <JourneyCard
                step="Stage 1"
                title={event?.stage1_label ?? 'School Round'}
                when={event?.stage1_window ?? 'Mid-August, at your school'}
                icon={<SchoolIcon className="size-7" />}
                tone="marigold"
                points={[
                  'Held inside your own school premises — no travel needed.',
                  'Judged by our team along with your school teachers.',
                  'Every participant receives a certificate.',
                  'The top performers from each school are shortlisted.',
                ]}
              />
            </Reveal>

            <Reveal delay={0.1}>
              <JourneyCard
                step="Stage 2"
                title={event?.stage2_label ?? 'Grand Finale'}
                when={
                  event?.stage2_date
                    ? formatLongDate(event.stage2_date)
                    : 'On the eve of Janmashtami'
                }
                icon={<TrophyIcon className="size-7" />}
                tone="peacock"
                points={[
                  `Shortlisted students perform at ${event?.venue ?? 'ISKCON Ulubari'}.`,
                  'A full festival evening with lights, music and an audience.',
                  'Trophies, medals and prizes across every age group.',
                  'Prasadam for every participant and their family.',
                ]}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================== tracks */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Choose your stage"
              title={
                <>
                  Find the one that's <span className="text-gradient-festival">yours</span>
                </>
              }
              subtitle="Eight ways to take part. Enter up to three — pick what you love, or try something you have never done before."
            />
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.slice(0, 6).map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 0.07}>
                <TrackCard track={t} categories={categoriesForTrack(t.id)} className="h-full" />
              </Reveal>
            ))}
          </div>

          {tracks.length > 6 ? (
            <div className="mt-10 flex justify-center">
              <ButtonLink
                to="/tracks"
                variant="outline"
                size="lg"
                iconRight={<ArrowRightIcon className="size-5" />}
              >
                See all {tracks.length} competitions
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </section>

      {/* ============================================================= gallery */}
      {featured.length > 0 ? (
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionHeading
                eyebrow="Past editions"
                title="Moments from the years before"
                subtitle="Every year the hall fills a little more. Here is what you are joining."
              />
            </Reveal>

            <div className="mt-14 grid auto-rows-[13rem] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((g, i) => (
                <Reveal
                  key={g.id}
                  delay={(i % 4) * 0.06}
                  className={cn(
                    i === 0 && 'col-span-2 row-span-2',
                    i === 3 && 'sm:row-span-2',
                  )}
                >
                  <figure className="group relative h-full overflow-hidden rounded-3xl border border-night-950/8 stack-shadow">
                    {g.image_url.startsWith('placeholder:') ? (
                      <PlaceholderTile
                        seed={g.image_url}
                        label={g.title}
                        className="size-full transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={g.image_url}
                        alt={g.title ?? `Utkarsh ${g.year}`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/85 to-transparent p-4 pt-10">
                      <p className="text-xs font-bold uppercase tracking-wider text-marigold-300">
                        {g.year}
                      </p>
                      {g.title ? (
                        <p className="mt-0.5 text-sm font-bold leading-tight text-white">
                          {g.title}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <ButtonLink to="/gallery" variant="outline" iconRight={<ArrowRightIcon className="size-4" />}>
                Open the full gallery
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      {/* ======================================================== testimonials */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionHeading
              eyebrow="Student voices"
              title={quotes.length > 0 ? 'What they remember' : 'Were you part of Utkarsh?'}
              subtitle={
                quotes.length > 0
                  ? 'In their own words.'
                  : 'If you took part in a past edition, we would love to share your memory here. Write to us and tell us what the day felt like.'
              }
            />
          </Reveal>

          {quotes.length > 0 ? (
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {quotes.slice(0, 6).map((t, i) => (
                <Reveal key={t.id} delay={(i % 3) * 0.07}>
                  <figure className="relative h-full overflow-hidden rounded-3xl border border-night-950/8 bg-white p-7 stack-shadow card-lift">
                    <QuoteIcon className="size-8 text-marigold-300" />
                    <blockquote className="mt-4 text-[15px] leading-relaxed text-night-950/80">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-5 border-t border-night-950/8 pt-4">
                      <p className="font-bold text-night-950">{t.student_name}</p>
                      <p className="text-[13px] text-night-950/55">
                        {[t.school_name, t.track_name, t.year].filter(Boolean).join(' · ')}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-12 flex justify-center">
              <ButtonLink to="/contact" variant="outline" size="lg">
                Share your Utkarsh memory
              </ButtonLink>
            </Reveal>
          )}
        </div>
      </section>

      {/* ================================================================= cta */}
      <section className="relative px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-night px-6 py-20 text-center sm:px-12">
          <StarField count={52} />
          <MarigoldGarland className="absolute inset-x-0 top-0 opacity-80" />
          <Rangoli
            className="absolute -left-24 -top-16 size-96 text-white/8 animate-spin-slower"
            petals={20}
          />
          <Rangoli
            className="absolute -bottom-28 -right-20 size-[26rem] text-white/8 animate-spin-slow"
            petals={16}
          />

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <Badge tone="gold" className="mb-6">
                {regOpen ? 'Registration is open' : 'Registration opens soon'}
              </Badge>

              <h2 className="text-4xl font-black leading-tight text-cream-50 sm:text-5xl lg:text-6xl">
                The stage is set.
                <br />
                <span className="text-gradient-gold">Now we need you on it.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream-100/70">
                It takes two minutes to register, it costs nothing, and it starts right in your own
                school.
              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {regOpen ? (
                  <ButtonLink
                    to="/register"
                    size="lg"
                    shimmer
                    iconRight={<ArrowRightIcon className="size-5" />}
                  >
                    Register now — it's free
                  </ButtonLink>
                ) : null}
                <ButtonLink
                  to="/tracks"
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/10 text-cream-50 hover:border-marigold-300 hover:bg-white/15"
                >
                  Browse the competitions
                </ButtonLink>
              </div>

              {settings?.registration.closes_at ? (
                <p className="mt-6 text-sm text-cream-100/50">
                  Registration closes on {formatLongDate(settings.registration.closes_at)}
                </p>
              ) : null}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ bits */

function Stage({
  n,
  label,
  detail,
  highlight = false,
}: {
  n: number
  label: string
  detail: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full text-xs font-black',
          highlight ? 'bg-marigold-400 text-night-950' : 'bg-white/15 text-cream-100',
        )}
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-cream-50">{label}</p>
        <p className="truncate text-[13px] text-cream-100/55">{detail}</p>
      </div>
    </div>
  )
}

function JourneyCard({
  step,
  title,
  when,
  icon,
  points,
  tone,
}: {
  step: string
  title: string
  when: string
  icon: React.ReactNode
  points: string[]
  tone: 'marigold' | 'peacock'
}) {
  const a = accent(tone === 'marigold' ? 'saffron' : 'peacock')
  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-night-950/8 bg-white p-8 stack-shadow">
      <span
        className={cn('absolute -right-14 -top-14 size-40 rounded-full opacity-70 blur-2xl', a.surface)}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className={cn('grid size-14 place-items-center rounded-2xl', a.solid)}>{icon}</span>
          <div>
            <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', a.text)}>{step}</p>
            <h3 className="text-2xl font-black text-night-950">{title}</h3>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-night-950/60">
          <CalendarIcon className="size-4" />
          {when}
        </p>

        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-night-950/70">
              <span className={cn('mt-2 size-1.5 shrink-0 rounded-full', a.solid)} />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
