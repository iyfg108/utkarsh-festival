import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/context/ToastContext'
import {
  deleteGalleryItem,
  deleteTestimonial,
  fetchGallery,
  fetchTestimonials,
  logAudit,
  upsertGalleryItem,
  upsertTestimonial,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Toggle } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { ImageIcon, QuoteIcon } from '@/components/Icons'
import { PlaceholderTile } from '@/components/Decor'

const BLANK_PHOTO = {
  id: undefined as string | undefined,
  year: new Date().getFullYear(),
  title: '',
  caption: '',
  image_url: '',
  is_featured: false,
  sort_order: 0,
}

const BLANK_QUOTE = {
  id: undefined as string | undefined,
  student_name: '',
  school_name: '',
  year: new Date().getFullYear(),
  track_name: '',
  quote: '',
  is_published: false,
  sort_order: 0,
}

export default function ContentAdmin() {
  const toast = useToast()
  const gallery = useAsync(() => fetchGallery(), [])
  const quotes = useAsync(() => fetchTestimonials(true), [])

  const [tab, setTab] = useState<'gallery' | 'quotes'>('gallery')
  const [photo, setPhoto] = useState<typeof BLANK_PHOTO | null>(null)
  const [quote, setQuote] = useState<typeof BLANK_QUOTE | null>(null)
  const [saving, setSaving] = useState(false)

  const photos = gallery.data ?? []
  const testimonials = quotes.data ?? []
  const unpublished = testimonials.filter((t) => !t.is_published).length

  async function savePhoto() {
    if (!photo) return
    if (!photo.image_url.trim()) {
      toast.error('Please paste an image URL.')
      return
    }
    setSaving(true)
    try {
      await upsertGalleryItem({
        ...(photo.id ? { id: photo.id } : {}),
        year: Number(photo.year),
        title: photo.title.trim() || null,
        caption: photo.caption.trim() || null,
        image_url: photo.image_url.trim(),
        is_featured: photo.is_featured,
        sort_order: Number(photo.sort_order) || 0,
      })
      await logAudit(photo.id ? 'update' : 'create', 'gallery_item', photo.id ?? null, null)
      toast.success('Saved.')
      setPhoto(null)
      gallery.reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function saveQuote() {
    if (!quote) return
    if (!quote.student_name.trim() || !quote.quote.trim()) {
      toast.error('Both a name and a quote are needed.')
      return
    }
    setSaving(true)
    try {
      await upsertTestimonial({
        ...(quote.id ? { id: quote.id } : {}),
        student_name: quote.student_name.trim(),
        school_name: quote.school_name.trim() || null,
        year: Number(quote.year) || null,
        track_name: quote.track_name.trim() || null,
        quote: quote.quote.trim(),
        is_published: quote.is_published,
        sort_order: Number(quote.sort_order) || 0,
      })
      await logAudit(quote.id ? 'update' : 'create', 'testimonial', quote.id ?? null, null)
      toast.success('Saved.')
      setQuote(null)
      quotes.reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminHeader
        title="Gallery & student voices"
        subtitle="Photos from past editions, and quotes shown on the home page."
        actions={
          tab === 'gallery' ? (
            <Button onClick={() => setPhoto({ ...BLANK_PHOTO })}>Add a photo</Button>
          ) : (
            <Button onClick={() => setQuote({ ...BLANK_QUOTE })}>Add a quote</Button>
          )
        }
      />

      <div className="mb-5 flex gap-2">
        {(
          [
            ['gallery', `Gallery (${photos.length})`],
            ['quotes', `Student voices (${testimonials.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-full border-2 px-4 py-2 text-sm font-bold transition',
              tab === key
                ? 'border-marigold-500 bg-marigold-500 text-white'
                : 'border-night-950/12 bg-white text-night-950/65 hover:border-night-950/25',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'gallery' ? (
        gallery.loading && photos.length === 0 ? (
          <LoadingBlock />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="size-12" />}
            title="No photos yet"
            description="Upload photos to Supabase Storage (or any host), then paste the public URL here."
            action={<Button onClick={() => setPhoto({ ...BLANK_PHOTO })}>Add the first photo</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((g) => (
              <div
                key={g.id}
                className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow"
              >
                {g.image_url.startsWith('placeholder:') ? (
                  <PlaceholderTile seed={g.image_url} label={g.title} className="h-40 w-full" />
                ) : (
                  <img
                    src={g.image_url}
                    alt={g.title ?? ''}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{g.year}</Badge>
                    {g.is_featured ? <Badge tone="gold">Featured</Badge> : null}
                    {g.image_url.startsWith('placeholder:') ? (
                      <Badge tone="warning">Placeholder</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 font-bold text-night-950">{g.title ?? 'Untitled'}</p>
                  {g.caption ? (
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-night-950/55">{g.caption}</p>
                  ) : null}

                  <div className="mt-3 flex gap-1 border-t border-night-950/8 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPhoto({
                          id: g.id,
                          year: g.year,
                          title: g.title ?? '',
                          caption: g.caption ?? '',
                          image_url: g.image_url,
                          is_featured: g.is_featured,
                          sort_order: g.sort_order,
                        })
                      }
                      className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-peacock-700 transition hover:bg-peacock-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteGalleryItem(g.id)
                          toast.success('Removed.')
                          gallery.reload()
                        } catch (err) {
                          toast.error(friendlyError(err))
                        }
                      }}
                      className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {unpublished > 0 ? (
            <div className="mb-4 rounded-2xl border-2 border-marigold-300 bg-marigold-50 px-5 py-4 text-sm text-marigold-900">
              <strong>{unpublished}</strong> quote{unpublished === 1 ? ' is' : 's are'} unpublished.
              The seed data ships with sample placeholders — replace them with real quotes (with the
              student's permission) before publishing.
            </div>
          ) : null}

          {quotes.loading && testimonials.length === 0 ? (
            <LoadingBlock />
          ) : testimonials.length === 0 ? (
            <EmptyState
              icon={<QuoteIcon className="size-12" />}
              title="No quotes yet"
              description="Add a few words from past participants. They appear on the home page once published."
              action={<Button onClick={() => setQuote({ ...BLANK_QUOTE })}>Add the first quote</Button>}
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-3xl border bg-white p-5 stack-shadow',
                    t.is_published ? 'border-night-950/8' : 'border-dashed border-night-950/20',
                  )}
                >
                  <QuoteIcon className="size-6 text-marigold-300" />
                  <p className="mt-3 text-[15px] leading-relaxed text-night-950/80">{t.quote}</p>
                  <p className="mt-3 font-bold text-night-950">{t.student_name}</p>
                  <p className="text-[13px] text-night-950/50">
                    {[t.school_name, t.track_name, t.year].filter(Boolean).join(' · ')}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-night-950/8 pt-3">
                    <Toggle
                      checked={t.is_published}
                      label={`Publish quote from ${t.student_name}`}
                      onChange={async (next) => {
                        try {
                          await upsertTestimonial({
                            id: t.id,
                            student_name: t.student_name,
                            quote: t.quote,
                            is_published: next,
                          })
                          quotes.reload()
                        } catch (err) {
                          toast.error(friendlyError(err))
                        }
                      }}
                    />
                    <span className="text-[12px] font-semibold text-night-950/50">
                      {t.is_published ? 'Live on the site' : 'Draft'}
                    </span>

                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setQuote({
                            id: t.id,
                            student_name: t.student_name,
                            school_name: t.school_name ?? '',
                            year: t.year ?? new Date().getFullYear(),
                            track_name: t.track_name ?? '',
                            quote: t.quote,
                            is_published: t.is_published,
                            sort_order: t.sort_order,
                          })
                        }
                        className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-peacock-700 transition hover:bg-peacock-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteTestimonial(t.id)
                            toast.success('Removed.')
                            quotes.reload()
                          } catch (err) {
                            toast.error(friendlyError(err))
                          }
                        }}
                        className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* photo editor */}
      <Modal
        open={photo !== null}
        onClose={() => setPhoto(null)}
        title={photo?.id ? 'Edit photo' : 'Add a photo'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPhoto(null)}>
              Cancel
            </Button>
            <Button onClick={savePhoto} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {photo ? (
          <div className="space-y-4">
            <Input
              label="Image URL"
              required
              value={photo.image_url}
              onChange={(e) => setPhoto({ ...photo, image_url: e.target.value })}
              placeholder="https://…/photo.jpg"
              hint="Upload to Supabase Storage and paste the public URL. Leave a placeholder: value to keep the generated tile."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Year"
                type="number"
                value={photo.year}
                onChange={(e) => setPhoto({ ...photo, year: Number(e.target.value) })}
              />
              <Input
                label="Sort order"
                type="number"
                value={photo.sort_order}
                onChange={(e) => setPhoto({ ...photo, sort_order: Number(e.target.value) })}
              />
            </div>
            <Input
              label="Title"
              value={photo.title}
              onChange={(e) => setPhoto({ ...photo, title: e.target.value })}
            />
            <Textarea
              label="Caption"
              value={photo.caption}
              onChange={(e) => setPhoto({ ...photo, caption: e.target.value })}
            />
            <label className="flex items-center gap-3">
              <Toggle
                checked={photo.is_featured}
                onChange={(v) => setPhoto({ ...photo, is_featured: v })}
                label="Feature on home page"
              />
              <span className="text-sm font-semibold text-night-950">Feature on the home page</span>
            </label>
          </div>
        ) : null}
      </Modal>

      {/* quote editor */}
      <Modal
        open={quote !== null}
        onClose={() => setQuote(null)}
        title={quote?.id ? 'Edit quote' : 'Add a quote'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setQuote(null)}>
              Cancel
            </Button>
            <Button onClick={saveQuote} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {quote ? (
          <div className="space-y-4">
            <Textarea
              label="Quote"
              required
              value={quote.quote}
              onChange={(e) => setQuote({ ...quote, quote: e.target.value })}
              placeholder="In the student's own words…"
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Student name"
                required
                value={quote.student_name}
                onChange={(e) => setQuote({ ...quote, student_name: e.target.value })}
              />
              <Input
                label="School"
                value={quote.school_name}
                onChange={(e) => setQuote({ ...quote, school_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Competition"
                value={quote.track_name}
                onChange={(e) => setQuote({ ...quote, track_name: e.target.value })}
              />
              <Input
                label="Year"
                type="number"
                value={quote.year}
                onChange={(e) => setQuote({ ...quote, year: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-3">
              <Toggle
                checked={quote.is_published}
                onChange={(v) => setQuote({ ...quote, is_published: v })}
                label="Publish"
              />
              <span className="text-sm font-semibold text-night-950">
                Publish on the home page
              </span>
            </label>
            <p className="rounded-2xl bg-peacock-50 px-4 py-3 text-[13px] leading-relaxed text-peacock-900">
              Only publish quotes you actually have from a real participant, with their permission.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
