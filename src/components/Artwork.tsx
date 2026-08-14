import { cn } from '@/lib/utils'

/**
 * Devotional paintings used as illustration.
 *
 * Intrinsic dimensions are recorded here so every image reserves its space
 * before it loads — otherwise the page jumps as each one arrives, which is
 * worst exactly where it is most noticeable, on a slow phone.
 *
 * Sources live in public/art/*.jpg and are NOT served; scripts/optimise-art.sh
 * produces the -800 and -1600 WebP files that are.
 */
const ART = {
  running: {
    w: 1600,
    h: 1184,
    alt: 'A painting of Krishna and Balarama running through the forest with the cowherd boys and their cows.',
  },
  feeding: {
    w: 2160,
    h: 2648,
    alt: 'A painting of Krishna seated beneath a tree while his friends offer him sweets.',
  },
  resting: {
    w: 2398,
    h: 1598,
    alt: 'A painting of Krishna and the cowherd boys resting together in the forest.',
  },
  lunch: {
    w: 2398,
    h: 1748,
    alt: 'A painting of Krishna sharing lunch in the forest, surrounded by the cowherd boys.',
  },
} as const

export type ArtName = keyof typeof ART

export function Artwork({
  name,
  className,
  imgClassName,
  sizes = '100vw',
  priority = false,
  rounded = true,
}: {
  name: ArtName
  className?: string
  imgClassName?: string
  /** Tell the browser how wide this will render, so it picks the right file. */
  sizes?: string
  /** Only for an image above the fold — everything else stays lazy. */
  priority?: boolean
  rounded?: boolean
}) {
  const art = ART[name]

  return (
    <img
      src={`/art/${name}-800.webp`}
      srcSet={`/art/${name}-800.webp 800w, /art/${name}-1600.webp 1600w`}
      sizes={sizes}
      width={art.w}
      height={art.h}
      alt={art.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(
        'block h-full w-full object-cover',
        rounded && 'rounded-3xl',
        imgClassName,
        className,
      )}
    />
  )
}
