import { Link } from 'react-router-dom'
import { accent, cn } from '@/lib/utils'
import type { Category, Track } from '@/lib/types'
import { TrackIcon, ArrowRightIcon, UsersIcon } from '@/components/Icons'
import { Badge } from '@/components/ui/Primitives'

export function TrackCard({
  track,
  categories,
  className,
}: {
  track: Track
  categories?: Category[]
  className?: string
}) {
  const a = accent(track.accent)

  return (
    <Link
      to={`/tracks/${track.slug}`}
      className={cn(
        'group ring-festival card-lift relative flex flex-col overflow-hidden rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow',
        className,
      )}
    >
      {/* tinted wash that grows on hover */}
      <span
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 size-40 rounded-full opacity-60 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-90',
          a.surface,
        )}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110',
            a.solid,
          )}
        >
          <TrackIcon name={track.icon} className="size-7" />
        </span>

        <div className="flex flex-col items-end gap-1.5">
          {track.is_team ? (
            <Badge tone="info">
              <UsersIcon className="size-3" />
              Team of {track.min_team_size}–{track.max_team_size}
            </Badge>
          ) : (
            <Badge>Solo</Badge>
          )}
          {track.duration_minutes ? (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-night-950/40">
              {track.duration_minutes} min
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative mt-5 flex-1">
        <h3 className="text-xl font-black leading-tight text-night-950">{track.name}</h3>
        {track.sanskrit_name ? (
          <p className={cn('mt-0.5 font-display text-sm font-semibold italic', a.text)}>
            {track.sanskrit_name}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-night-950/65">
          {track.tagline ?? track.description}
        </p>

        {categories && categories.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c.id}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                  a.chip,
                )}
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-night-950/8 pt-4">
        {track.requires_selection ? (
          <span className="text-[12px] font-semibold text-night-950/50">
            Limited slots per {track.selection_label?.toLowerCase()}
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-night-950/50">Open entry</span>
        )}
        <span
          className={cn(
            'flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-1',
            a.text,
          )}
        >
          Details
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
    </Link>
  )
}
