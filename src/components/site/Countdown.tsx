import { useCountdown } from '@/hooks/useCountdown'
import { cn } from '@/lib/utils'

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

  const units = [
    { label: 'Days', value: c.days },
    { label: 'Hours', value: c.hours },
    { label: 'Minutes', value: c.minutes },
    { label: 'Seconds', value: c.seconds },
  ]

  if (c.isPast) {
    return (
      <p className={cn('text-sm font-bold uppercase tracking-widest', light ? 'text-marigold-300' : 'text-marigold-700', className)}>
        The festival is here 🎉
      </p>
    )
  }

  return (
    <div className={cn('flex items-stretch gap-2 sm:gap-3', className)}>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-stretch gap-2 sm:gap-3">
          <div
            className={cn(
              'flex min-w-[3.75rem] flex-col items-center rounded-2xl border px-2.5 py-2.5 backdrop-blur sm:min-w-[4.5rem] sm:px-4',
              light
                ? 'border-white/15 bg-white/10'
                : 'border-night-950/10 bg-white/80 stack-shadow',
            )}
          >
            <span
              className={cn(
                'font-display text-2xl font-black tabular-nums leading-none sm:text-3xl',
                light ? 'text-cream-50' : 'text-night-950',
              )}
            >
              {String(u.value).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'mt-1 text-[9px] font-bold uppercase tracking-[0.14em] sm:text-[10px]',
                light ? 'text-marigold-300' : 'text-marigold-600',
              )}
            >
              {u.label}
            </span>
          </div>
          {i < units.length - 1 ? (
            <span
              className={cn(
                'self-center font-display text-xl font-black',
                light ? 'text-white/25' : 'text-night-950/20',
              )}
            >
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
