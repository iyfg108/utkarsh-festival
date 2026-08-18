import { Link, useParams } from 'react-router-dom'
import { useFestival } from '@/context/FestivalContext'
import { useAsync } from '@/hooks/useAsync'
import { fetchAvailability } from '@/lib/queries'
import { accent, cn, entriesClosed, formatLongDate, formatTime, formatTimeRange } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, EmptyState, LoadingBlock, Reveal } from '@/components/ui/Primitives'
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardIcon,
  MapPinIcon,
  SparklesIcon,
  TrackIcon,
} from '@/components/Icons'
import { SectionDivider, SoftGlow } from '@/components/Decor'
import { Syllabus } from '@/components/site/Syllabus'
import { AvailabilityRow } from '@/components/site/SlotMeter'

export default function CompetitionDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { tracks, settings, loading } = useFestival()

  const track = tracks.find((t) => t.slug === slug) ?? null

  const availability = useAsync(
    async () => (track?.requires_selection ? fetchAvailability(track.id) : []),
    [track?.id, track?.requires_selection],
  )

  if (loading) return <LoadingBlock />

  if (!track) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={<SparklesIcon className="size-12" />}
          title="We could not find that competition"
          description="It may have been renamed or is not running this year."
          action={
            <ButtonLink to="/competitions" variant="outline">
              See all competitions
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const a = accent(track.accent)
  const items = availability.data ?? []
  const regOpen = settings?.registration.open ?? false

  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative isolate px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <SoftGlow />

        <div className="mx-auto max-w-5xl">
          <Link
            to="/competitions"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-950/50 transition hover:text-night-950"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
            All competitions
          </Link>

          <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span
              className={cn('grid size-16 shrink-0 place-items-center rounded-3xl shadow-lift', a.solid)}
            >
              <TrackIcon name={track.icon} className="size-8" />
            </span>

            <div>
              <h1 className="text-3xl font-black leading-tight text-night-950 sm:text-5xl">
                {track.name}
              </h1>
              {track.sanskrit_name ? (
                <p className={cn('mt-1 font-display text-lg font-bold italic sm:text-xl', a.text)}>
                  {track.sanskrit_name}
                </p>
              ) : null}
            </div>
          </div>

          {track.tagline ? (
            <p className="mt-5 max-w-2xl font-display text-xl font-semibold italic leading-snug text-night-950/75 sm:text-2xl">
              “{track.tagline}”
            </p>
          ) : null}

          <SectionDivider className="mt-5 w-44" />

          <p className="mt-3 max-w-3xl text-base leading-relaxed text-night-950/70 sm:text-lg">
            {track.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge tone="warning">At the temple</Badge>
            {track.event_date ? (
              <Badge tone="neutral">
                <CalendarIcon className="size-3" />
                {formatLongDate(track.event_date)}
                {formatTimeRange(track.start_time, track.end_time)
                  ? ` · ${formatTimeRange(track.start_time, track.end_time)}`
                  : ''}
              </Badge>
            ) : null}
            {track.reporting_time ? (
              <Badge tone="danger">
                Report by {formatTime(track.reporting_time)}
              </Badge>
            ) : null}
            {track.registration_closes_at ? (
              <Badge tone={entriesClosed(track.registration_closes_at) ? 'danger' : 'neutral'}>
                {entriesClosed(track.registration_closes_at)
                  ? 'Entries closed'
                  : `Entries close ${formatLongDate(track.registration_closes_at)}`}
              </Badge>
            ) : null}
            <Badge tone="neutral">
              Class {track.min_class}–{track.max_class}
            </Badge>
            {track.duration_minutes ? (
              <Badge tone="neutral">{track.duration_minutes} minutes</Badge>
            ) : null}
          </div>

          {settings?.event.venue ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-night-950/60">
              <MapPinIcon className="size-4 text-marigold-600" />
              {settings.event.venue}
            </p>
          ) : null}

          {regOpen ? (
            <div className="mt-8">
              <ButtonLink
                to={`/register?competition=${track.slug}`}
                size="lg"
                iconRight={<ArrowRightIcon className="size-5" />}
              >
                Enter {track.name}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </section>

      {/* =============================================================== rules */}
      <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow sm:p-7">
              <h2 className="flex items-center gap-2.5 text-lg font-black text-night-950">
                <ClipboardIcon className={cn('size-5', a.text)} />
                Rules
              </h2>
              <ul className="mt-5 space-y-3.5">
                {track.rules.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-night-950/72">
                    <span
                      className={cn('mt-1 grid size-4 shrink-0 place-items-center rounded-full', a.solid)}
                    >
                      <CheckIcon className="size-2.5" strokeWidth={3.5} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {track.what_to_bring.length > 0 ? (
            <Reveal delay={0.07}>
              <div className={cn('h-full rounded-3xl border p-6 sm:p-7', a.border, a.surface)}>
                <h2 className="text-lg font-black text-night-950">What to bring</h2>
                <ul className="mt-5 space-y-2.5">
                  {track.what_to_bring.map((w) => (
                    <li
                      key={w}
                      className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-[15px] font-medium text-night-950/80"
                    >
                      <span className={cn('size-2 shrink-0 rounded-full', a.solid)} />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      {/* ============================================================ prepare */}
      {track.syllabus && track.syllabus.groups?.length ? (
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <Syllabus data={track.syllabus} accentKey={track.accent} />
        </section>
      ) : null}

      {/* ======================================================== availability */}
      {track.requires_selection ? (
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-black text-night-950 sm:text-3xl">
            Choose your {track.selection_label?.toLowerCase()}
          </h2>
          {track.selection_help ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-night-950/65">
              {track.selection_help}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-peacock-200 bg-peacock-50 px-5 py-3.5 text-sm text-peacock-900">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-marigold-500" /> Taken
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-night-950/15" /> Available
            </span>
            <span className="ml-auto text-[13px] font-medium opacity-80">
              Updates the moment someone registers.
            </span>
          </div>

          {availability.loading && items.length === 0 ? (
            <LoadingBlock label="Checking what is still open…" />
          ) : (
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {items.map((i) => (
                <AvailabilityRow key={i.id} item={i} />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* ================================================================= cta */}
      {regOpen ? (
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <div
            className={cn(
              'flex flex-col items-center gap-4 rounded-4xl border px-6 py-11 text-center',
              a.border,
              a.surface,
            )}
          >
            <h2 className="text-2xl font-black text-night-950 sm:text-3xl">Ready to enter?</h2>
            <p className="max-w-md text-[15px] text-night-950/65">
              You can add other competitions to the same registration — the fee does not change.
            </p>
            <ButtonLink
              to={`/register?competition=${track.slug}`}
              size="lg"
              className="mt-2"
              iconRight={<ArrowRightIcon className="size-5" />}
            >
              Register for {track.name}
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </>
  )
}
