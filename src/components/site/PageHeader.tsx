import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SectionDivider, SoftGlow } from '@/components/Decor'

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative isolate px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-14',
        className,
      )}
    >
      <SoftGlow />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-marigold-200 bg-marigold-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-700">
            <span className="size-1.5 rounded-full bg-marigold-500" />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="mt-5 text-[2.1rem] font-black leading-[1.08] tracking-tight text-night-950 sm:text-5xl lg:text-6xl">
          {title}
        </h1>

        <SectionDivider className="mt-5 w-44" />

        {subtitle ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-night-950/65 sm:text-lg">
            {subtitle}
          </p>
        ) : null}

        {children ? <div className="mt-7 w-full">{children}</div> : null}
      </div>
    </section>
  )
}
