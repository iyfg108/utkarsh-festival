import { cn } from '@/lib/utils'

/**
 * The wordmark. Pure type — no illustration, so it costs nothing to render
 * and stays crisp at any size.
 */
export function Brand({
  size = 'md',
  tone = 'dark',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'dark' | 'light'
  className?: string
}) {
  const SIZES = {
    sm: { name: 'text-lg', sub: 'text-[9px] tracking-[0.16em]' },
    md: { name: 'text-xl', sub: 'text-[10px] tracking-[0.17em]' },
    lg: { name: 'text-3xl', sub: 'text-[11px] tracking-[0.2em]' },
  }

  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span
        className={cn(
          'font-display font-black tracking-tight',
          SIZES[size].name,
          tone === 'light' ? 'text-cream-50' : 'text-night-950',
        )}
      >
        Utkarsh
      </span>
      <span
        className={cn(
          'font-bold uppercase',
          SIZES[size].sub,
          tone === 'light' ? 'text-marigold-300' : 'text-marigold-600',
        )}
      >
        Heritage Festival
      </span>
    </span>
  )
}
