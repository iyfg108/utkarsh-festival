import { useState } from 'react'
import { useFestival } from '@/context/FestivalContext'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { TrackCard } from '@/components/site/TrackCard'
import { Reveal, EmptyState } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import { ArrowRightIcon, SparklesIcon } from '@/components/Icons'

export default function Tracks() {
  const { tracks, categories, categoriesForTrack, tracksForCategory, settings } = useFestival()
  const [filter, setFilter] = useState<string | null>(null)

  const shown = filter ? tracksForCategory(filter) : tracks

  return (
    <>
      <PageHeader
        eyebrow="Competitions"
        title={
          <>
            Eight ways to <span className="text-gradient-festival">take the stage</span>
          </>
        }
        subtitle="Every track is open to school students across Guwahati, and every one of them is free to enter. Choose up to three."
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* age filter */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          <FilterChip active={filter === null} onClick={() => setFilter(null)}>
            All age groups
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.name}
              <span className="ml-1.5 opacity-60">
                (Class {c.min_class}–{c.max_class})
              </span>
            </FilterChip>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<SparklesIcon className="size-10" />}
            title="Nothing here yet"
            description="No competitions are open to this age group at the moment. Try another group."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 0.06}>
                <TrackCard track={t} categories={categoriesForTrack(t.id)} className="h-full" />
              </Reveal>
            ))}
          </div>
        )}

        {settings?.registration.open ? (
          <Reveal className="mt-16 flex flex-col items-center gap-4 rounded-4xl border border-marigold-200 bg-marigold-50/70 px-6 py-12 text-center">
            <h2 className="text-2xl font-black text-night-950 sm:text-3xl">
              Found the one? Let's get you signed up.
            </h2>
            <p className="max-w-md text-[15px] text-night-950/65">
              You can enter up to {settings.registration.max_tracks_per_student} competitions with a
              single registration.
            </p>
            <ButtonLink
              to="/register"
              size="lg"
              shimmer
              className="mt-2"
              iconRight={<ArrowRightIcon className="size-5" />}
            >
              Register now
            </ButtonLink>
          </Reveal>
        ) : null}
      </section>
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-4 py-2 text-sm font-bold transition',
        active
          ? 'border-marigold-500 bg-marigold-500 text-white shadow-glow-marigold'
          : 'border-night-950/12 bg-white text-night-950/70 hover:border-marigold-300 hover:text-night-950',
      )}
    >
      {children}
    </button>
  )
}
