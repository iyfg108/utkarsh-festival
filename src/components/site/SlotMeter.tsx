import { cn } from '@/lib/utils'
import type { SelectionAvailability } from '@/lib/types'

/** Compact "2 of 3 taken" indicator with a dot for every slot. */
export function SlotMeter({
  item,
  className,
}: {
  item: Pick<SelectionAvailability, 'max_slots' | 'taken_count' | 'slots_left' | 'is_full'>
  className?: string
}) {
  const { max_slots, taken_count, is_full } = item
  const left = Math.max(max_slots - taken_count, 0)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: max_slots }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'size-2 rounded-full transition-colors',
              i < taken_count
                ? is_full
                  ? 'bg-rose-festival-500'
                  : 'bg-marigold-500'
                : 'bg-night-950/15',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'text-[11px] font-bold uppercase tracking-wide',
          is_full ? 'text-rose-festival-600' : left === 1 ? 'text-marigold-700' : 'text-night-950/45',
        )}
      >
        {is_full ? 'Full' : left === 1 ? 'Last slot' : `${left} left`}
      </span>
    </div>
  )
}

/** Read-only row used on the track detail page. */
export function AvailabilityRow({ item }: { item: SelectionAvailability }) {
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border-2 px-4 py-3 transition',
        item.is_full
          ? 'border-night-950/8 bg-night-950/[0.03] opacity-70'
          : 'border-night-950/10 bg-white hover:border-marigold-300',
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-[15px] font-bold',
            item.is_full ? 'text-night-950/50 line-through' : 'text-night-950',
          )}
        >
          {item.title}
        </p>
        {item.subtitle ? (
          <p className="truncate text-[13px] italic text-night-950/50">{item.subtitle}</p>
        ) : null}
      </div>
      <SlotMeter item={item} className="shrink-0" />
    </li>
  )
}
