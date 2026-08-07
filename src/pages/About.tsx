import { useFestival } from '@/context/FestivalContext'
import { formatLongDate } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { Reveal, SectionHeading } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import {
  ArrowRightIcon,
  CalendarIcon,
  MapPinIcon,
  SchoolIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'
import { Diya, Flute, Lotus, MarigoldGarland, StarField } from '@/components/Decor'

const VALUES = [
  {
    icon: <SparklesIcon className="size-6" />,
    title: 'Participation over prizes',
    body: 'Every student who takes part receives a certificate. The trophies are lovely, but the point is the taking part.',
    tone: 'from-marigold-400 to-marigold-600',
  },
  {
    icon: <SchoolIcon className="size-6" />,
    title: 'We come to you first',
    body: 'The first round happens inside your own school. No travel, no cost, no reason to hesitate.',
    tone: 'from-peacock-400 to-peacock-600',
  },
  {
    icon: <UsersIcon className="size-6" />,
    title: 'Everyone gets a turn',
    body: 'Limits on songs, slokas and characters mean the stage stays varied and no one is lost in a crowd of identical entries.',
    tone: 'from-rose-festival-400 to-fuchsia-600',
  },
  {
    icon: <TrophyIcon className="size-6" />,
    title: 'Culture, not competition',
    body: 'The Gita, the Puranas, our music and our dance — learnt not from a textbook, but by performing them.',
    tone: 'from-night-500 to-night-700',
  },
]

export default function About() {
  const { settings, tracks } = useFestival()
  const event = settings?.event

  return (
    <>
      <PageHeader
        eyebrow="About the festival"
        title={
          <>
            What <span className="text-gradient-festival">Utkarsh</span> is about
          </>
        }
        subtitle="उत्कर्ष — utkarṣa — means elevation, rising, flourishing. That is the whole idea."
      />

      {/* ============================================================== story */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="space-y-6 text-lg leading-relaxed text-night-950/75">
            <p className="font-display text-2xl font-semibold italic leading-snug text-night-950">
              Every year, on the day before Janmashtami, the students of Guwahati take over our
              temple.
            </p>
            <p>
              They come with paintbrushes and ghungroos, with costumes stitched at home the night
              before, with slokas memorised on the school bus. Some have performed a hundred times.
              Many have never held a microphone. By the end of the evening you cannot tell which
              was which.
            </p>
            <p>
              Utkarsh began as a small afternoon competition for a handful of schools. It has grown
              into a full festival — but the reason for it has not changed. We wanted young people
              to meet their own heritage not as a chapter to revise, but as something they perform,
              wear, sing and argue about.
            </p>
            <p>
              This year we are running it in <strong className="text-night-950">two stages</strong>.
              The first round comes to your school, so that taking part costs a student nothing more
              than a lunch break. The finalists then come to{' '}
              <strong className="text-night-950">{event?.venue ?? 'ISKCON Ulubari'}</strong> for the
              grand finale on Janmashtami eve — lights, an audience, and a proper stage.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 flex justify-center">
            <Flute className="w-full max-w-md opacity-70" />
          </div>
        </Reveal>
      </section>

      {/* ============================================================= values */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="What we care about"
            title="Four things we hold to"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={(i % 2) * 0.08}>
              <div className="h-full rounded-3xl border border-night-950/8 bg-white p-7 stack-shadow card-lift">
                <span
                  className={`mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${v.tone}`}
                >
                  {v.icon}
                </span>
                <h3 className="text-xl font-black text-night-950">{v.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-night-950/65">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* =========================================================== the day */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-night px-6 py-16 sm:px-12">
          <StarField count={44} />
          <MarigoldGarland className="absolute inset-x-0 top-0 opacity-80" />

          <div className="relative">
            <Reveal>
              <SectionHeading
                light
                eyebrow="The finale"
                title={<>An evening at the temple</>}
                subtitle="What the grand finale looks like."
              />
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: <CalendarIcon className="size-6" />,
                  label: 'When',
                  value: event?.stage2_date
                    ? formatLongDate(event.stage2_date)
                    : 'Eve of Janmashtami',
                  note: event?.stage2_note ?? 'One day before Sri Krishna Janmashtami.',
                },
                {
                  icon: <MapPinIcon className="size-6" />,
                  label: 'Where',
                  value: event?.venue ?? 'ISKCON Ulubari',
                  note: event?.city ?? 'Guwahati, Assam',
                },
                {
                  icon: <TrophyIcon className="size-6" />,
                  label: 'What happens',
                  value: `${tracks.length} competitions`,
                  note: 'Performances, prize distribution and prasadam for all.',
                },
              ].map((d, i) => (
                <Reveal key={d.label} delay={i * 0.08}>
                  <div className="h-full rounded-3xl border border-white/12 bg-white/5 p-7 backdrop-blur">
                    <span className="grid size-12 place-items-center rounded-2xl bg-marigold-400 text-night-950">
                      {d.icon}
                    </span>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-marigold-300">
                      {d.label}
                    </p>
                    <p className="mt-1 font-display text-xl font-black text-cream-50">{d.value}</p>
                    <p className="mt-2 text-sm leading-relaxed text-cream-100/60">{d.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            {event?.venue_map_url ? (
              <div className="mt-10 flex justify-center">
                <ButtonLink
                  to={event.venue_map_url}
                  external
                  variant="outline"
                  className="border-white/25 bg-white/10 text-cream-50 hover:border-marigold-300 hover:bg-white/15"
                  icon={<MapPinIcon className="size-4" />}
                >
                  Open venue in Maps
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ================================================================ cta */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Reveal>
          <Lotus className="mx-auto size-14 text-marigold-400" />
          <h2 className="mt-6 text-3xl font-black leading-tight text-night-950 sm:text-4xl">
            Bring Utkarsh to your school
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-night-950/65">
            If you are a teacher, principal or student coordinator and would like your school to
            host a first-stage round, we would love to hear from you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/contact" size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
              Get in touch
            </ButtonLink>
            <ButtonLink to="/tracks" size="lg" variant="outline">
              See the competitions
            </ButtonLink>
          </div>
          <Diya className="mx-auto mt-12 size-12 animate-float" />
        </Reveal>
      </section>
    </>
  )
}
