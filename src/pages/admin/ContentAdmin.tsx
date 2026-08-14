import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/context/ToastContext'
import {
  deleteGalleryItem,
  fetchGallery,
  logAudit,
  upsertGalleryItem,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Toggle } from '@/components/ui/Form'
import { Badge, EmptyState, LoadingBlock, Modal } from '@/components/ui/Primitives'
import { ImageIcon } from '@/components/Icons'
import { PlaceholderTile } from '@/components/Decor'

const BLANK = {
  id: undefined as string | undefined,
  year: new Date().getFullYear(),
  title: '',
  caption: '',
  image_url: '',
  is_featured: false,
  sort_order: 0,
}

export default function ContentAdmin() {
  const toast = useToast()
  const gallery = useAsync(() => fetchGallery(), [])
  const [photo, setPhoto] = useState<typeof BLANK | null>(null)
  const [saving, setSaving] = useState(false)

  const photos = gallery.data ?? []
  const placeholders = photos.filter((p) => p.image_url.startsWith('placeholder:')).length

  async function save() {
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

  return (
    <>
      <AdminHeader
        title="Gallery"
        subtitle="Photos from past editions, shown on the home page and the gallery page."
        actions={<Button onClick={() => setPhoto({ ...BLANK })}>Add a photo</Button>}
      />

      {placeholders > 0 ? (
        <div className="mb-5 rounded-2xl border-2 border-marigold-300 bg-marigold-50 px-5 py-4 text-sm leading-relaxed text-marigold-900">
          <strong>{placeholders}</strong>{' '}
          {placeholders === 1 ? 'tile is' : 'tiles are'} still generated placeholders. Upload real
          photographs to Supabase Storage (a public bucket), then paste each public URL here to
          replace them.
        </div>
      ) : null}

      {gallery.loading && photos.length === 0 ? (
        <LoadingBlock />
      ) : photos.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-12" />}
          title="No photos yet"
          description="Upload photos to Supabase Storage (or any host), then paste the public URL here."
          action={<Button onClick={() => setPhoto({ ...BLANK })}>Add the first photo</Button>}
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
                  decoding="async"
                />
              )}
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
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
      )}

      <Modal
        open={photo !== null}
        onClose={() => setPhoto(null)}
        title={photo?.id ? 'Edit photo' : 'Add a photo'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPhoto(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
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
              hint="Upload to Supabase Storage and paste the public URL."
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
    </>
  )
}
