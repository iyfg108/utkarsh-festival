import { useMemo } from 'react'
import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/* =========================================================================
   Decorative motifs.

   Performance note: everything here is cheap on purpose. There are no CSS
   `filter: blur()` layers — a large blurred element forces a low-end Android
   GPU to rasterise and re-blur a huge surface every frame, which is the
   single most common cause of a janky scroll on a ₹8,000 phone. Soft washes
   are done with radial-gradients instead, which cost nothing.
   ========================================================================= */

export function Lotus({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden {...rest}>
      <g fill="currentColor">
        <path d="M60 6c8 10 12 20 12 30S66 62 60 66c-6-4-12-14-12-30S52 16 60 6Z" fillOpacity=".95" />
        <path d="M60 66c-6-2-16-8-22-18S30 26 32 20c9 4 18 12 22 22s6 20 6 24Z" fillOpacity=".72" />
        <path d="M60 66c6-2 16-8 22-18s8-22 6-28c-9 4-18 12-22 22s-6 20-6 24Z" fillOpacity=".72" />
        <path d="M60 68c-8 0-22-4-30-12s-12-18-12-24c10 1 22 6 30 15s12 18 12 21Z" fillOpacity=".5" />
        <path d="M60 68c8 0 22-4 30-12s12-18 12-24c-10 1-22 6-30 15s-12 18-12 21Z" fillOpacity=".5" />
      </g>
    </svg>
  )
}

export function Flute({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 260 44" fill="none" className={className} aria-hidden {...rest}>
      <defs>
        <linearGradient id="fl-body" x1="8" y1="22" x2="252" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b74708" />
          <stop offset=".45" stopColor="#dd6602" />
          <stop offset="1" stopColor="#ffc44d" />
        </linearGradient>
      </defs>
      <rect x="8" y="14" width="244" height="16" rx="8" fill="url(#fl-body)" />
      <rect x="8" y="14" width="244" height="5" rx="2.5" fill="#fff" fillOpacity=".22" />
      {[46, 76, 106, 136, 166, 196].map((x) => (
        <circle key={x} cx={x} cy="22" r="3.4" fill="#7a2f0f" fillOpacity=".8" />
      ))}
      <circle cx="24" cy="22" r="4.2" fill="#2e2263" fillOpacity=".55" />
      <rect x="222" y="11" width="7" height="22" rx="3.5" fill="#e0a80d" />
      <rect x="236" y="11" width="7" height="22" rx="3.5" fill="#e0a80d" />
    </svg>
  )
}

export function Diya({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 80 76" fill="none" className={className} aria-hidden {...rest}>
      <path d="M40 12c5 7 7 11 7 15a7 7 0 1 1-14 0c0-4 2-8 7-15Z" fill="#ffab1f" />
      <path d="M40 20c2.4 3.6 3.4 5.6 3.4 7.6a3.4 3.4 0 1 1-6.8 0c0-2 1-4 3.4-7.6Z" fill="#fff8ea" fillOpacity=".9" />
      <path d="M12 50h56c0 9-12 16-28 16S12 59 12 50Z" fill="#b74708" />
      <path d="M12 50h56c0 2.6-1 5-2.8 7H14.8A10 10 0 0 1 12 50Z" fill="#dd6602" />
    </svg>
  )
}

/**
 * Rangoli mandala. `petals` drives the element count directly, so keep it low
 * anywhere it is animated — 12 reads the same as 20 at background opacity.
 */
export function Rangoli({
  className,
  petals = 12,
  ...rest
}: SVGProps<SVGSVGElement> & { petals?: number }) {
  const ring = useMemo(
    () => Array.from({ length: petals }, (_, i) => (i * 360) / petals),
    [petals],
  )
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden {...rest}>
      <g stroke="currentColor" strokeWidth="1.1" opacity=".8">
        {ring.map((deg) => (
          <ellipse key={deg} cx="100" cy="46" rx="13" ry="34" transform={`rotate(${deg} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="16" stroke="currentColor" strokeWidth="1.4" opacity=".9" />
      <circle cx="100" cy="100" r="7" fill="currentColor" opacity=".6" />
      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 7"
        opacity=".45"
      />
    </svg>
  )
}

/**
 * Marigold strip. Drawn as a repeating radial-gradient rather than dozens of
 * inline SVG blooms — one painted layer instead of ~150 DOM nodes.
 */
export function MarigoldGarland({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-3 w-full', className)}
      aria-hidden
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 40%, #ffab1f 0 4px, #dd6602 4px 6px, transparent 6.5px)',
        backgroundSize: '22px 12px',
        backgroundRepeat: 'repeat-x',
      }}
    />
  )
}

/**
 * Soft colour wash behind hero sections. Replaces the old blurred blobs —
 * same look, no filter, no compositing cost.
 */
export function SoftGlow({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 -z-10', className)}
      aria-hidden
      style={{
        backgroundImage: [
          'radial-gradient(38rem 28rem at 8% 0%, rgb(255 171 31 / 0.20), transparent 70%)',
          'radial-gradient(34rem 26rem at 96% 8%, rgb(6 174 211 / 0.16), transparent 70%)',
          'radial-gradient(30rem 24rem at 60% 100%, rgb(244 63 94 / 0.10), transparent 70%)',
        ].join(','),
      }}
    />
  )
}

/**
 * A handful of stars for the dark sections. Deliberately few and static —
 * animating dozens of elements is exactly the sort of thing that makes a
 * cheap phone drop frames while scrolling.
 */
export function StarField({ count = 18, className }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    // Fixed seed so the layout never shifts between renders.
    let seed = 20260830
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
    return Array.from({ length: count }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      size: 1 + rnd() * 1.8,
      opacity: 0.25 + rnd() * 0.5,
    }))
  }, [count])

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  )
}

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-2', className)} aria-hidden>
      <div className="rule-gold flex-1" />
      <Lotus className="size-6 shrink-0 text-marigold-400" />
      <div className="rule-gold flex-1" />
    </div>
  )
}

/** Generated tile shown when a gallery row has no real photograph yet. */
export function PlaceholderTile({
  seed,
  label,
  className,
}: {
  seed: string
  label?: string | null
  className?: string
}) {
  const hue = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
    return h
  }, [seed])

  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 74% 58%), hsl(${(hue + 42) % 360} 68% 42%))`,
      }}
      aria-hidden
    >
      <Rangoli className="absolute -right-8 -top-10 size-48 text-white/25" petals={10} />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <Lotus className="size-9 text-white/80" />
        {label ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}
