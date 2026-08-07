import { Link } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SpinnerIcon } from '@/components/Icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'night'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-marigold-500 via-marigold-500 to-rose-festival-500 text-white shadow-glow-marigold hover:brightness-110 active:brightness-95',
  secondary:
    'bg-gradient-to-r from-peacock-500 to-night-600 text-white shadow-glow-peacock hover:brightness-110 active:brightness-95',
  night:
    'bg-night-950 text-cream-50 hover:bg-night-900 shadow-lift',
  outline:
    'border-2 border-night-950/15 bg-white/70 text-night-950 backdrop-blur hover:border-marigold-400 hover:bg-marigold-50',
  ghost: 'text-night-800 hover:bg-night-950/6',
  danger: 'bg-rose-festival-600 text-white hover:bg-rose-festival-500',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3.5 text-[13px]',
  md: 'h-11 gap-2 rounded-2xl px-5 text-sm',
  lg: 'h-14 gap-2.5 rounded-2xl px-7 text-base',
}

const BASE =
  'relative inline-flex select-none items-center justify-center font-semibold tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.975] whitespace-nowrap'

interface CommonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  shimmer?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  className?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  shimmer = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], SIZES[size], shimmer && !disabled && 'btn-shimmer', className)}
    >
      {loading ? <SpinnerIcon className="size-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  shimmer = false,
  icon,
  iconRight,
  className,
  children,
  external = false,
}: CommonProps & { to: string; external?: boolean }) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], shimmer && 'btn-shimmer', className)

  if (external) {
    return (
      <a href={to} target="_blank" rel="noreferrer noopener" className={classes}>
        {icon}
        {children}
        {iconRight}
      </a>
    )
  }

  return (
    <Link to={to} className={classes}>
      {icon}
      {children}
      {iconRight}
    </Link>
  )
}
