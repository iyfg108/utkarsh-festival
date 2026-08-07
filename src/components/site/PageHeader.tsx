import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { AuroraBlobs, Rangoli, SectionDivider } from '@/components/Decor'

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
        'relative isolate overflow-hidden px-4 pb-14 pt-12 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16',
        className,
      )}
    >
      <AuroraBlobs className="opacity-70" />
      <Rangoli
        className="absolute -right-32 -top-28 -z-10 hidden size-[28rem] text-marigold-300/35 animate-spin-slower lg:block"
        petals={16}
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-marigold-200 bg-marigold-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-700"
          >
            <span className="size-1.5 rounded-full bg-marigold-500" />
            {eyebrow}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-night-950 sm:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>

        <SectionDivider className="mt-6 w-48" />

        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-2xl text-lg leading-relaxed text-night-950/65"
          >
            {subtitle}
          </motion.p>
        ) : null}

        {children ? <div className="mt-8 w-full">{children}</div> : null}
      </div>
    </section>
  )
}
