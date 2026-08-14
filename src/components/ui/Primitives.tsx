import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useReveal } from '@/hooks/useReveal'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
import { CloseIcon, SpinnerIcon } from '@/components/Icons'
import { SectionDivider } from '@/components/Decor'

/* ------------------------------------------------------------------ card */

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string
  children: ReactNode
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <Tag
      className={cn(
        'rounded-3xl border border-night-950/8 bg-white stack-shadow',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/* ----------------------------------------------------------------- badge */

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode
  className?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
}) {
  const TONES = {
    neutral: 'bg-night-950/6 text-night-800 border-night-950/10',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-peacock-50 text-peacock-800 border-peacock-200',
    gold: 'bg-gradient-to-r from-gold-300 to-marigold-300 text-night-950 border-gold-400',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- reveal */

/** Fades + rises its children the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 22,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s, transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------- section header */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
  divider = true,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'center' | 'left'
  light?: boolean
  divider?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]',
            light
              ? 'border-white/25 bg-white/10 text-marigold-200 backdrop-blur'
              : 'border-marigold-200 bg-marigold-50 text-marigold-700',
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {eyebrow}
        </span>
      ) : null}

      <h2
        className={cn(
          'text-3xl font-black leading-[1.1] sm:text-4xl lg:text-[2.75rem]',
          light ? 'text-cream-50' : 'text-night-950',
        )}
      >
        {title}
      </h2>

      {divider ? (
        <SectionDivider className={cn('w-40', align === 'center' ? '' : 'self-start')} />
      ) : null}

      {subtitle ? (
        <p
          className={cn(
            'max-w-2xl text-[15px] leading-relaxed sm:text-base',
            light ? 'text-cream-100/75' : 'text-night-950/65',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------- states */

export function Spinner({ className }: { className?: string }) {
  return <SpinnerIcon className={cn('size-6 animate-spin text-marigold-500', className)} />
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-night-950/55">
      <Spinner className="size-8" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-gradient-to-r from-night-950/6 via-night-950/10 to-night-950/6',
        className,
      )}
    />
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-night-950/12 bg-white/60 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? <div className="text-night-950/25">{icon}</div> : null}
      <h3 className="text-lg font-bold text-night-950">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-night-950/60">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const message =
    typeof error === 'string'
      ? error
      : ((error as { message?: string })?.message ?? 'Something went wrong.')

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-3xl border-2 border-rose-200 bg-rose-50/70 px-6 py-12 text-center',
        className,
      )}
    >
      <h3 className="text-lg font-bold text-rose-900">We could not load this</h3>
      <p className="max-w-md text-sm leading-relaxed text-rose-800/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const SIZES = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  // Close on Escape — expected of any dialog.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-night-950/55"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-scale-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl',
          SIZES[size],
        )}
      >
            <div className="flex items-start justify-between gap-4 border-b border-night-950/8 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-night-950">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-night-950/60">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 rounded-xl p-2 text-night-950/45 transition hover:bg-night-950/6 hover:text-night-950"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-night-950/8 bg-cream-50/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- progress */

export function ProgressBar({
  value,
  max = 100,
  className,
  gradient = 'from-marigold-400 to-rose-festival-500',
}: {
  value: number
  max?: number
  className?: string
  gradient?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-night-950/8', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-700', gradient)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Number that counts up the first time it scrolls into view.
 * Plain rAF — no dependency needed, and it respects reduced motion by
 * landing on the final value immediately.
 */
export function CountUp({
  value,
  duration = 1500,
  className,
  suffix = '',
}: {
  value: number
  duration?: number
  className?: string
  suffix?: string
}) {
  const { ref, shown } = useReveal<HTMLSpanElement>(0.4)
  const [display, setDisplay] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!shown) return
    if (reduced || duration <= 0) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let raf = requestAnimationFrame(function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    })

    return () => cancelAnimationFrame(raf)
  }, [shown, value, duration, reduced])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}
