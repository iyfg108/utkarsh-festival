import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { useFestival } from '@/context/FestivalContext'
import { useAsync } from '@/hooks/useAsync'
import { fetchAvailability } from '@/lib/queries'
import { accent, cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import {
  Badge,
  EmptyState,
  LoadingBlock,
  Reveal,
  SectionHeading,
} from '@/components/ui/Primitives'
import {
  ArrowRightIcon,
  CheckIcon,
  ClipboardIcon,
  SparklesIcon,
  TrackIcon,
  UsersIcon,
} from '@/components/Icons'
import { AuroraBlobs, Rangoli, SectionDivider } from '@/components/Decor'
import { AvailabilityRow } from '@/components/site/SlotMeter'

export default function TrackDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { tracks, categories, categoriesForTrack, settings, loading } = useFestival()

  const track = tracks.find((t) => t.slug === slug) ?? null

  const availability = useAsync(
    async () => (track ? fetchAvailability(track.id) : []),
    [track?.id],
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
            <ButtonLink to="/tracks" variant="outline">
              See all competitions
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const a = accent(track.accent)
  const openTo = categoriesForTrack(track.id)
  const items = availability.data ?? []
  const regOpen = settings?.registration.open ?? false

  // Group the selectable items: some are per age band, some open to all.
  const grouped = openTo
    .map((cat) => ({
      category: cat,
      items: items.filter((i) => i.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0)

  const shared = items.filter((i) => i.category_id === null)

  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative isolate overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <AuroraBlobs className="opacity-60" />
        <Rangoli
          className={cn(
            'absolute -right-28 -top-24 -z-10 hidden size-[26rem] animate-spin-slower lg:block',
            a.text,
            'opacity-20',
          )}
          petals={16}
        />

        <div className="mx-auto max-w-5xl">
          <Link
            to="/tracks"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-950/50 transition hover:text-night-950"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
            All competitions
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center"
          >
            <span
              className={cn(
                'grid size-20 shrink-0 place-items-center rounded-3xl shadow-lift',
                a.solid,
              )}
            >
              <TrackIcon name={track.icon} className="size-10" />
            </span>

            <div>
              <h1 className="text-4xl font-black leading-tight text-night-950 sm:text-5xl">
                {track.name}
              </h1>
              {track.sanskrit_name ? (
                <p className={cn('mt-1 font-display text-xl font-bold italic', a.text)}>
                  {track.sanskrit_name}
                </p>
              ) : null}
            </div>
          </motion.div>

          {track.tagline ? (
            <p className="mt-6 max-w-2xl font-display text-2xl font-semibold italic leading-snug text-night-950/75">
              “{track.tagline}”
            </p>
          ) : null}

          <SectionDivider className="mt-6 w-48" />

          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-night-950/70">
            {track.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {track.is_team ? (
              <Badge tone="info">
                <UsersIcon className="size-3" />
                Team of {track.min_team_size}–{track.max_team_size}
              </Badge>
            ) : (
              <Badge>Solo entry</Badge>
            )}
            {track.duration_minutes ? (
              <Badge tone="warning">{track.duration_minutes} minutes</Badge>
            ) : null}
            {openTo.map((c) => (
              <Badge key={c.id} tone="neutral">
                {c.name} · Class {c.min_class}–{c.max_class}
              </Badge>
            ))}
          </div>

          {regOpen ? (
            <div className="mt-9">
              <ButtonLink
                to={`/register?track=${track.slug}`}
                size="lg"
                shimmer
                iconRight={<ArrowRightIcon className="size-5" />}
              >
                Enter {track.name}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </section>

      {/* =============================================================== rules */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-night-950/8 bg-white p-7 stack-shadow">
              <h2 className="flex items-center gap-2.5 text-xl font-black text-night-950">
                <ClipboardIcon className={cn('size-5', a.text)} />
                Rules
              </h2>
              <ul className="mt-5 space-y-3.5">
                {track.rules.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-night-950/72">
                    <span
                      className={cn(
                        'mt-1 grid size-4 shrink-0 place-items-center rounded-full',
                        a.solid,
                      )}
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
            <Reveal delay={0.08}>
              <div className={cn('h-full rounded-3xl border p-7', a.border, a.surface)}>
                <h2 className="text-xl font-black text-night-950">What to bring</h2>
                <ul className="mt-5 space-y-3">
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

      {/* ======================================================== availability */}
      {track.requires_selection ? (
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={`Choose your ${track.selection_label?.toLowerCase()}`}
              title={
                <>
                  Live availability
                </>
              }
              subtitle={track.selection_help}
              divider={false}
            />
          </Reveal>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-peacock-200 bg-peacock-50 px-5 py-4 text-sm text-peacock-900">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-marigold-500" /> Taken
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-night-950/15" /> Available
            </span>
            <span className="ml-auto text-[13px] font-medium opacity-80">
              Counts update the moment someone registers.
            </span>
          </div>

          {availability.loading && items.length === 0 ? (
            <LoadingBlock label="Checking what is still open…" />
          ) : (
            <div className="mt-8 space-y-10">
              {shared.length > 0 ? (
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                    Open to every age group
                  </h3>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {shared.map((i) => (
                      <AvailabilityRow key={i.id} item={i} />
                    ))}
                  </ul>
                </div>
              ) : null}

              {grouped.map((g) => (
                <div key={g.category.id}>
                  <h3 className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
                    {g.category.name}
                    <span className="rounded-full bg-night-950/6 px-2 py-0.5 text-[11px] normal-case tracking-normal">
                      Class {g.category.min_class}–{g.category.max_class}
                    </span>
                  </h3>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {g.items.map((i) => (
                      <AvailabilityRow key={i.id} item={i} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* ================================================================= cta */}
      {regOpen ? (
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div
              className={cn(
                'flex flex-col items-center gap-4 rounded-4xl border px-6 py-12 text-center',
                a.border,
                a.surface,
              )}
            >
              <h2 className="text-3xl font-black text-night-950">Ready to enter?</h2>
              <p className="max-w-md text-[15px] text-night-950/65">
                Registration takes about two minutes and is completely free.
              </p>
              <ButtonLink
                to={`/register?track=${track.slug}`}
                size="lg"
                shimmer
                className="mt-2"
                iconRight={<ArrowRightIcon className="size-5" />}
              >
                Register for {track.name}
              </ButtonLink>
            </div>
          </Reveal>
        </section>
      ) : null}

      {/* other tracks */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
          Other competitions
        </h2>
        <div className="flex flex-wrap gap-2">
          {tracks
            .filter((t) => t.id !== track.id)
            .map((t) => {
              const ta = accent(t.accent)
              return (
                <Link
                  key={t.id}
                  to={`/tracks/${t.slug}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 border-night-950/10 bg-white px-4 py-2 text-sm font-bold text-night-950/75 transition hover:-translate-y-0.5 hover:bg-night-950/[0.03]',
                    ta.border && 'hover:shadow-sm',
                  )}
                >
                  <TrackIcon name={t.icon} className={cn('size-4', ta.text)} />
                  {t.name}
                </Link>
              )
            })}
        </div>
        <p className="mt-6 text-xs text-night-950/40">
          Categories: {categories.map((c) => c.name).join(' · ')}
        </p>
      </section>
    </>
  )
}
