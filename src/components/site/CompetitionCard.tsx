import { Link } from 'react-router-dom'
import { accent, cn, formatDate } from '@/lib/utils'
import type { Track } from '@/lib/types'
import { TrackIcon, ArrowRightIcon } from '@/components/Icons'

export function CompetitionCard({ track, className }: { track: Track; className?: string }) {
  const a = accent(track.accent)
  const online = track.mode === 'online'

  return (
    <Link
      to={`/competitions/${track.slug}`}
      className={cn(
        'group card-lift relative flex flex-col overflow-hidden rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', a.solid)}>
          <TrackIcon name={track.icon} className="size-6" />
        </span>

        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[11px] font-bold',
            online
              ? 'border-peacock-200 bg-peacock-50 text-peacock-800'
              : 'border-marigold-200 bg-marigold-50 text-marigold-800',
          )}
        >
          {online ? 'Online' : 'At the temple'}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="text-lg font-black leading-tight text-night-950">{track.name}</h3>
        {track.sanskrit_name ? (
          <p className={cn('mt-0.5 font-display text-sm font-semibold italic', a.text)}>
            {track.sanskrit_name}
          </p>
        ) : null}
        <p className="mt-2.5 text-sm leading-relaxed text-night-950/65">
          {track.tagline ?? track.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-night-950/8 pt-3.5">
        <span className="text-[12px] font-semibold text-night-950/50">
          {track.event_date ? formatDate(track.event_date) : 'Date to be announced'}
        </span>
        <span
          className={cn(
            'flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-0.5',
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
