import { useMemo } from 'react'
import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/* =========================================================================
   Motifs. Everything is inline SVG with currentColor or explicit gradients,
   so nothing loads over the network and both themes stay crisp.
   ========================================================================= */

export function PeacockFeather({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 260" fill="none" className={className} {...rest}>
      <defs>
        <linearGradient id="pf-plume" x1="60" y1="8" x2="60" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66e4f8" />
          <stop offset=".45" stopColor="#06aed3" />
          <stop offset="1" stopColor="#5c3fc9" />
        </linearGradient>
        <linearGradient id="pf-stem" x1="60" y1="170" x2="60" y2="258" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d6e8f" />
          <stop offset="1" stopColor="#f98a00" stopOpacity=".85" />
        </linearGradient>
        <radialGradient id="pf-eye" cx="0" cy="0" r="1" gradientTransform="translate(60 96) rotate(90) scale(46 34)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2e2263" />
          <stop offset=".55" stopColor="#1a1240" />
          <stop offset="1" stopColor="#0d6e8f" stopOpacity=".2" />
        </radialGradient>
      </defs>

      {/* barbs */}
      <g stroke="#21cced" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round">
        {Array.from({ length: 26 }).map((_, i) => {
          const t = i / 25
          const angle = -68 + t * 136
          const rad = (angle * Math.PI) / 180
          const len = 54 + Math.sin(t * Math.PI) * 26
          return (
            <line
              key={i}
              x1={60 + Math.sin(rad) * 24}
              y1={110 - Math.cos(rad) * 20}
              x2={60 + Math.sin(rad) * len}
              y2={110 - Math.cos(rad) * (len * 0.86)}
            />
          )
        })}
      </g>

      <path
        d="M60 10c26 0 44 22 44 50s-16 46-33 60c-6 5-9 11-10 18l-1 8h-1l-1-8c-1-7-4-13-10-18-17-14-33-32-33-60S34 10 60 10Z"
        fill="url(#pf-plume)"
        fillOpacity=".9"
      />
      <ellipse cx="60" cy="96" rx="25" ry="33" fill="url(#pf-eye)" />
      <ellipse cx="60" cy="94" rx="15" ry="21" fill="#f98a00" />
      <ellipse cx="60" cy="93" rx="7.5" ry="11.5" fill="#e11d48" />
      <ellipse cx="57.5" cy="87" rx="2.6" ry="3.6" fill="#ffdf7e" fillOpacity=".85" />
      <path d="M58.5 148h3l2 104a3.5 3.5 0 0 1-7 0Z" fill="url(#pf-stem)" />
    </svg>
  )
}

export function Flute({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 260 44" fill="none" className={className} {...rest}>
      <defs>
        <linearGradient id="fl-body" x1="8" y1="22" x2="252" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b74708" />
          <stop offset=".3" stopColor="#dd6602" />
          <stop offset=".72" stopColor="#f98a00" />
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

export function Lotus({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} {...rest}>
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

export function Diya({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 80 76" fill="none" className={className} {...rest}>
      <defs>
        <radialGradient id="diya-flame" cx="0" cy="0" r="1" gradientTransform="translate(40 26) scale(11 18)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff8ea" />
          <stop offset=".4" stopColor="#ffc44d" />
          <stop offset="1" stopColor="#f98a00" stopOpacity=".1" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="28" rx="12" ry="19" fill="url(#diya-flame)" />
      <path d="M40 12c5 7 7 11 7 15a7 7 0 1 1-14 0c0-4 2-8 7-15Z" fill="#ffab1f" />
      <path d="M40 20c2.4 3.6 3.4 5.6 3.4 7.6a3.4 3.4 0 1 1-6.8 0c0-2 1-4 3.4-7.6Z" fill="#fff8ea" fillOpacity=".9" />
      <path d="M12 50h56c0 9-12 16-28 16S12 59 12 50Z" fill="#b74708" />
      <path d="M12 50h56c0 2.6-1 5-2.8 7H14.8A10 10 0 0 1 12 50Z" fill="#dd6602" />
    </svg>
  )
}

/** Slowly rotating rangoli mandala — used as a background flourish. */
export function Rangoli({ className, petals = 16, ...rest }: SVGProps<SVGSVGElement> & { petals?: number }) {
  const ring = useMemo(
    () =>
      Array.from({ length: petals }).map((_, i) => (i * 360) / petals),
    [petals],
  )
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} {...rest}>
      <g stroke="currentColor" strokeWidth="1.1" opacity=".8">
        {ring.map((deg) => (
          <ellipse
            key={deg}
            cx="100"
            cy="46"
            rx="13"
            ry="34"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}
      </g>
      <g stroke="currentColor" strokeWidth="1.1" opacity=".55">
        {ring.slice(0, petals / 2).map((deg) => (
          <ellipse
            key={deg}
            cx="100"
            cy="70"
            rx="8"
            ry="20"
            transform={`rotate(${deg + 180 / petals} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="16" stroke="currentColor" strokeWidth="1.4" opacity=".9" />
      <circle cx="100" cy="100" r="7" fill="currentColor" opacity=".6" />
      <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" opacity=".45" />
    </svg>
  )
}

/** Marigold garland — a horizontal strip of alternating blooms. */
export function MarigoldGarland({ className }: { className?: string }) {
  const blooms = Array.from({ length: 26 })
  return (
    <div className={cn('flex w-full items-center justify-between overflow-hidden', className)} aria-hidden>
      {blooms.map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 40 52"
          className={cn('h-8 w-6 shrink-0', i % 2 ? 'translate-y-1' : '')}
          fill="none"
        >
          <path d="M20 0v10" stroke="#15803d" strokeWidth="1.6" />
          <g fill={i % 3 === 0 ? '#ffab1f' : i % 3 === 1 ? '#f98a00' : '#ffc44d'}>
            <circle cx="20" cy="26" r="13" />
          </g>
          <g fill="#dd6602" opacity=".55">
            {Array.from({ length: 8 }).map((_, k) => {
              const a = (k * Math.PI) / 4
              return <circle key={k} cx={20 + Math.cos(a) * 7.5} cy={26 + Math.sin(a) * 7.5} r="3.6" />
            })}
          </g>
          <circle cx="20" cy="26" r="4" fill="#b74708" opacity=".7" />
        </svg>
      ))}
    </div>
  )
}

/** Twinkling stars for the night-sky sections. Deterministic, so no layout jitter. */
export function StarField({ count = 46, className }: { count?: number; className?: string }) {
  const stars = useMemo(() => {
    // Simple LCG so the layout is identical on every render.
    let seed = 20260903
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
    return Array.from({ length: count }).map(() => ({
      x: rnd() * 100,
      y: rnd() * 100,
      size: 1 + rnd() * 2.2,
      delay: rnd() * 3.4,
      duration: 2.6 + rnd() * 2.4,
    }))
  }, [count])

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Soft colour blobs that drift behind hero sections. */
export function AuroraBlobs({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute -left-24 -top-24 size-[26rem] rounded-full bg-marigold-400/30 blur-3xl animate-float-slow" />
      <div className="absolute -right-20 top-10 size-[22rem] rounded-full bg-peacock-400/25 blur-3xl animate-float" style={{ animationDelay: '-2.5s' }} />
      <div className="absolute bottom-[-8rem] left-1/3 size-[24rem] rounded-full bg-rose-festival-400/20 blur-3xl animate-float-slow" style={{ animationDelay: '-5s' }} />
    </div>
  )
}

/** Decorative divider with a lotus in the middle. */
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-2', className)} aria-hidden>
      <div className="rule-gold flex-1" />
      <Lotus className="size-7 shrink-0 text-marigold-400" />
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
      <Rangoli className="absolute -right-8 -top-10 size-56 text-white/25 animate-spin-slower" petals={14} />
      <Rangoli className="absolute -bottom-14 -left-10 size-44 text-white/20 animate-spin-slow" petals={10} />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <Lotus className="size-10 text-white/80" />
        {label ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}
