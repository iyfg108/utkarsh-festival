import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAsync } from '@/hooks/useAsync'
import { fetchGallery } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Reveal,
} from '@/components/ui/Primitives'
import { CloseIcon, ImageIcon } from '@/components/Icons'
import { PlaceholderTile } from '@/components/Decor'
import type { GalleryItem } from '@/lib/types'

export default function Gallery() {
  const { data, loading, error, reload } = useAsync(() => fetchGallery(), [])
  const [year, setYear] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  const items = data ?? []
  const years = useMemo(
    () => [...new Set(items.map((i) => i.year))].sort((a, b) => b - a),
    [items],
  )
  const shown = year ? items.filter((i) => i.year === year) : items

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title={
          <>
            Years of <span className="text-gradient-festival">colour</span>
          </>
        }
        subtitle="Paint on fingers, costumes half-pinned, the moment before going on stage. A look back at the editions before this one."
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {loading && items.length === 0 ? (
          <LoadingBlock label="Loading the album…" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="size-12" />}
            title="No photos yet"
            description="Photographs from this year's festival will appear here once the celebration is over."
          />
        ) : (
          <>
            {years.length > 1 ? (
              <div className="mb-10 flex flex-wrap justify-center gap-2">
                <YearChip active={year === null} onClick={() => setYear(null)}>
                  All years
                </YearChip>
                {years.map((y) => (
                  <YearChip key={y} active={year === y} onClick={() => setYear(y)}>
                    {y}
                  </YearChip>
                ))}
              </div>
            ) : null}

            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
              {shown.map((g, i) => (
                <Reveal key={g.id} delay={(i % 3) * 0.05}>
                  <button
                    type="button"
                    onClick={() => setLightbox(g)}
                    className="group relative block w-full overflow-hidden rounded-3xl border border-night-950/8 text-left stack-shadow card-lift"
                  >
                    {g.image_url.startsWith('placeholder:') ? (
                      <PlaceholderTile
                        seed={g.image_url}
                        label={g.title}
                        className={cn(
                          'w-full transition-transform duration-700 group-hover:scale-105',
                          i % 3 === 0 ? 'h-72' : i % 3 === 1 ? 'h-56' : 'h-64',
                        )}
                      />
                    ) : (
                      <img
                        src={g.image_url}
                        alt={g.title ?? `Utkarsh ${g.year}`}
                        loading="lazy"
                        className="w-full transition-transform duration-700 group-hover:scale-105"
                      />
                    )}

                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/90 via-night-950/40 to-transparent p-5 pt-12">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-marigold-300">
                        {g.year}
                      </span>
                      {g.title ? (
                        <span className="mt-0.5 block font-display text-lg font-black leading-tight text-white">
                          {g.title}
                        </span>
                      ) : null}
                      {g.caption ? (
                        <span className="mt-1 block text-[13px] leading-snug text-white/70">
                          {g.caption}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </Reveal>
              ))}
            </div>
          </>
        )}
      </section>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-night-950/90 p-4 backdrop-blur"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.title ?? 'Photo'}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <CloseIcon className="size-5" />
            </button>

            <motion.figure
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="max-h-full w-full max-w-4xl overflow-hidden rounded-3xl bg-night-990"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.image_url.startsWith('placeholder:') ? (
                <PlaceholderTile
                  seed={lightbox.image_url}
                  label={lightbox.title}
                  className="h-[55vh] w-full"
                />
              ) : (
                <img
                  src={lightbox.image_url}
                  alt={lightbox.title ?? `Utkarsh ${lightbox.year}`}
                  className="max-h-[70vh] w-full object-contain"
                />
              )}
              <figcaption className="border-t border-white/10 p-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-marigold-300">
                  {lightbox.year}
                </p>
                {lightbox.title ? (
                  <p className="mt-1 font-display text-2xl font-black text-cream-50">
                    {lightbox.title}
                  </p>
                ) : null}
                {lightbox.caption ? (
                  <p className="mt-2 text-sm leading-relaxed text-cream-100/65">
                    {lightbox.caption}
                  </p>
                ) : null}
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

function YearChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border-2 px-5 py-2 text-sm font-bold transition',
        active
          ? 'border-marigold-500 bg-marigold-500 text-white shadow-glow-marigold'
          : 'border-night-950/12 bg-white text-night-950/70 hover:border-marigold-300 hover:text-night-950',
      )}
    >
      {children}
    </button>
  )
}
