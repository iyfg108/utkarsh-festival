import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

/**
 * Four boxes counting down to a date.
 *
 * Laid out as a 4-column grid rather than a flex row: `grid-cols-4` is
 * `repeat(4, minmax(0, 1fr))`, so the boxes always divide whatever width they
 * are given and can never push past the card they sit in. The earlier version
 * used fixed `min-w` boxes plus ":" separators, which needed ~300px — more than
 * a 360px phone has once the page and card padding are taken off, so the last
 * box was clipped by the card's `overflow-hidden`.
 *
 * Labels are short ("Mins", not "Minutes") because the label, not the number,
 * is what sets the minimum sensible column width.
 */
export function Countdown({
  date,
  light = false,
  className,
}: {
  date: string | null | undefined
  light?: boolean
  className?: string
}) {
  const c = useCountdown(date)
  if (!c) return null

  if (c.isPast) {
    return (
      <p
        className={cn(
          'text-sm font-bold uppercase tracking-widest',
          light ? 'text-marigold-300' : 'text-marigold-700',
          className,
        )}
      >
        The festival is here 🎉
      </p>
    )
  }

  const units = [
    { label: 'Days', value: c.days },
    { label: 'Hours', value: c.hours },
    { label: 'Mins', value: c.minutes },
    { label: 'Secs', value: c.seconds },
  ]

  return (
    <div className={cn('grid grid-cols-4 gap-1.5 sm:gap-2.5', className)}>
      {units.map((u) => (
        <div
          key={u.label}
          className={cn(
            'flex min-w-0 flex-col items-center rounded-2xl border px-1 py-2.5 backdrop-blur sm:px-3 sm:py-3',
            light
              ? 'border-white/15 bg-white/10'
              : 'border-night-950/10 bg-white/80 stack-shadow',
          )}
        >
          <span
            className={cn(
              'font-display text-2xl font-black leading-none tabular-nums sm:text-3xl',
              light ? 'text-cream-50' : 'text-night-950',
            )}
          >
            {String(u.value).padStart(2, '0')}
          </span>
          <span
            className={cn(
              'mt-1 text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.14em]',
              light ? 'text-marigold-300' : 'text-marigold-600',
            )}
          >
            {u.label}
          </span>
        </div>
      ))}
    </div>
  )
}
