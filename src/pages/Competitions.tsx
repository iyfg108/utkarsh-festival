import { useFestival } from '@/context/FestivalContext'
import { formatLongDate } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { CompetitionCard } from '@/components/site/CompetitionCard'
import { Reveal } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import { ArrowRightIcon, MapPinIcon } from '@/components/Icons'

export default function Competitions() {
  const { onlineTracks, onsiteTracks, settings } = useFestival()
  const event = settings?.event

  return (
    <>
      <PageHeader
        eyebrow="Competitions"
        title={
          <>
            Five ways to <span className="text-gradient-festival">take part</span>
          </>
        }
        subtitle="Open to Class 1 to 10. Enter as many as you like — one registration covers all of them."
      />

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        {/* ---- online day ---- */}
        {onlineTracks.length > 0 ? (
          <div className="mb-14">
            <DayHeading
              date={event?.online_date}
              badge="Online"
              tone="peacock"
              note="Held online — take part from home. The link reaches you a day before."
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {onlineTracks.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i * 0.06, 0.12)}>
                  <CompetitionCard track={t} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}

        {/* ---- onsite day ---- */}
        {onsiteTracks.length > 0 ? (
          <div>
            <DayHeading
              date={event?.onsite_date}
              badge="At the temple"
              tone="marigold"
              note={`Held at ${event?.venue ?? 'ISKCON Ulubari'} — come in person for the day.`}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {onsiteTracks.map((t, i) => (
                <Reveal key={t.id} delay={Math.min(i * 0.06, 0.12)}>
                  <CompetitionCard track={t} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {settings?.registration.open ? (
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 rounded-4xl border border-marigold-200 bg-marigold-50/70 px-6 py-12 text-center">
            <h2 className="text-2xl font-black text-night-950 sm:text-3xl">
              Found the ones you want?
            </h2>
            <p className="max-w-md text-[15px] text-night-950/65">
              One registration covers as many competitions as you like.
            </p>
            <ButtonLink
              to="/register"
              size="lg"
              className="mt-2"
              iconRight={<ArrowRightIcon className="size-5" />}
            >
              Register now
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </>
  )
}

function DayHeading({
  date,
  badge,
  note,
  tone,
}: {
  date: string | null | undefined
  badge: string
  note: string
  tone: 'peacock' | 'marigold'
}) {
  const styles =
    tone === 'marigold'
      ? 'border-marigold-200 bg-marigold-50 text-marigold-800'
      : 'border-peacock-200 bg-peacock-50 text-peacock-800'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-night-950/8 pb-4">
      <h2 className="font-display text-2xl font-black text-night-950 sm:text-3xl">
        {date ? formatLongDate(date) : 'Date to be announced'}
      </h2>
      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${styles}`}>
        {badge}
      </span>
      <p className="flex w-full items-center gap-1.5 text-sm text-night-950/55 sm:w-auto">
        {tone === 'marigold' ? <MapPinIcon className="size-4 shrink-0" /> : null}
        {note}
      </p>
    </div>
  )
}
