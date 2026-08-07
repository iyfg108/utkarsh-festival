import { useEffect, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  deleteSelectionItem,
  fetchSelectionItems,
  logAudit,
  recountSlots,
  upsertSelectionItem,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { accent, cn } from '@/lib/utils'
import type { SelectionItem } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Select, Toggle } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { MusicIcon, TrackIcon } from '@/components/Icons'

const BLANK = {
  id: undefined as string | undefined,
  title: '',
  subtitle: '',
  reference_url: '',
  max_slots: 3,
  category_id: '',
  is_active: true,
  sort_order: 0,
}

export default function SelectionsAdmin() {
  const { tracks, categories, categoriesForTrack } = useFestival()
  const toast = useToast()

  const selectableTracks = tracks.filter((t) => t.requires_selection)
  const [trackId, setTrackId] = useState('')

  useEffect(() => {
    if (!trackId && selectableTracks.length > 0) setTrackId(selectableTracks[0].id)
  }, [selectableTracks, trackId])

  const { data, loading, error, reload } = useAsync(
    () => (trackId ? fetchSelectionItems(trackId) : Promise.resolve([])),
    [trackId],
  )

  const [editing, setEditing] = useState<typeof BLANK | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SelectionItem | null>(null)
  const [saving, setSaving] = useState(false)

  const track = tracks.find((t) => t.id === trackId)
  const items = data ?? []
  const bands = track ? categoriesForTrack(track.id) : []

  async function save() {
    if (!editing || !track) return
    if (!editing.title.trim()) {
      toast.error('Please give it a title.')
      return
    }
    setSaving(true)
    try {
      await upsertSelectionItem({
        ...(editing.id ? { id: editing.id } : {}),
        track_id: track.id,
        title: editing.title.trim(),
        subtitle: editing.subtitle.trim() || null,
        reference_url: editing.reference_url.trim() || null,
        max_slots: Number(editing.max_slots) || 1,
        category_id: editing.category_id || null,
        is_active: editing.is_active,
        sort_order: Number(editing.sort_order) || 0,
      })
      await logAudit(editing.id ? 'update' : 'create', 'selection_item', editing.id ?? null, {
        title: editing.title,
      })
      toast.success('Saved.')
      setEditing(null)
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirmDelete) return
    try {
      await deleteSelectionItem(confirmDelete.id)
      await logAudit('delete', 'selection_item', confirmDelete.id, { title: confirmDelete.title })
      toast.success('Removed.')
      setConfirmDelete(null)
      reload()
    } catch (err) {
      // Postgres refuses if students already picked it — explain that clearly.
      const message = friendlyError(err)
      toast.error(
        /foreign key|violates/i.test(message)
          ? 'Students have already chosen this, so it cannot be deleted. Switch it off instead — it will disappear from the form but existing entries stay intact.'
          : message,
      )
    }
  }

  if (selectableTracks.length === 0) {
    return (
      <EmptyState
        icon={<MusicIcon className="size-12" />}
        title="No competition uses a selection list"
        description="Turn on “requires selection” for a track to manage its songs, slokas or characters here."
      />
    )
  }

  return (
    <>
      <AdminHeader
        title="Songs, slokas & characters"
        subtitle="Set how many students may choose each one. The database enforces these caps."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await recountSlots()
                  toast.success('Counters recalculated.')
                  reload()
                } catch (err) {
                  toast.error(friendlyError(err))
                }
              }}
            >
              Recalculate counts
            </Button>
            <Button onClick={() => setEditing({ ...BLANK, sort_order: items.length + 1 })}>
              Add new
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {selectableTracks.map((t) => {
          const a = accent(t.accent)
          const active = t.id === trackId
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrackId(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition',
                active
                  ? cn(a.solid, 'border-transparent')
                  : 'border-night-950/12 bg-white text-night-950/65 hover:border-night-950/25',
              )}
            >
              <TrackIcon name={t.icon} className="size-4" />
              {t.name}
            </button>
          )
        })}
      </div>

      {loading && items.length === 0 ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MusicIcon className="size-12" />}
          title={`No ${track?.selection_label?.toLowerCase() ?? 'items'} yet`}
          description="Add the first one so students have something to choose from."
          action={<Button onClick={() => setEditing({ ...BLANK })}>Add the first one</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead>
                <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Age group</th>
                  <th className="px-4 py-3.5">Taken</th>
                  <th className="px-4 py-3.5">Cap</th>
                  <th className="px-4 py-3.5">Live</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/6">
                {items.map((i) => {
                  const full = i.taken_count >= i.max_slots
                  const band = categories.find((c) => c.id === i.category_id)
                  return (
                    <tr key={i.id} className="transition hover:bg-cream-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-night-950">{i.title}</p>
                        {i.subtitle ? (
                          <p className="text-[12px] italic text-night-950/50">{i.subtitle}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        {band ? (
                          <Badge tone="neutral">{band.name}</Badge>
                        ) : (
                          <span className="text-[12px] text-night-950/40">All groups</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[12px] font-bold tabular-nums',
                            full
                              ? 'bg-rose-100 text-rose-700'
                              : i.taken_count > 0
                                ? 'bg-marigold-100 text-marigold-800'
                                : 'bg-night-950/6 text-night-950/50',
                          )}
                        >
                          {i.taken_count}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold tabular-nums text-night-950">
                        {i.max_slots}
                      </td>
                      <td className="px-4 py-3.5">
                        <Toggle
                          checked={i.is_active}
                          label={`Toggle ${i.title}`}
                          onChange={async (next) => {
                            try {
                              await upsertSelectionItem({
                                id: i.id,
                                track_id: i.track_id,
                                title: i.title,
                                is_active: next,
                              })
                              reload()
                            } catch (err) {
                              toast.error(friendlyError(err))
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              id: i.id,
                              title: i.title,
                              subtitle: i.subtitle ?? '',
                              reference_url: i.reference_url ?? '',
                              max_slots: i.max_slots,
                              category_id: i.category_id ?? '',
                              is_active: i.is_active,
                              sort_order: i.sort_order,
                            })
                          }
                          className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-peacock-700 transition hover:bg-peacock-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(i)}
                          className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-night-950/50">
        Lowering a cap below the number already taken is refused by the database — free up slots
        first by removing entries. Switching something off hides it from new registrations without
        touching students who already chose it.
      </p>

      {/* editor */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit' : `Add to ${track?.name ?? ''}`}
        description={track?.selection_label ?? undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <Input
              label="Title"
              required
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="e.g. Jaya Radha Madhava"
            />
            <Input
              label="Subtitle"
              value={editing.subtitle}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              placeholder="Composer, scripture reference or first line"
            />
            <Input
              label="Reference link"
              value={editing.reference_url}
              onChange={(e) => setEditing({ ...editing, reference_url: e.target.value })}
              placeholder="https://… (optional recording for students to learn from)"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Maximum students"
                type="number"
                min={1}
                value={editing.max_slots}
                onChange={(e) => setEditing({ ...editing, max_slots: Number(e.target.value) })}
                hint="How many may pick this."
              />
              <Select
                label="Age group"
                value={editing.category_id}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                hint="Leave blank to allow every group."
              >
                <option value="">All age groups</option>
                {bands.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Class {c.min_class}–{c.max_class})
                  </option>
                ))}
              </Select>
            </div>
            <Input
              label="Sort order"
              type="number"
              value={editing.sort_order}
              onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this option?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-night-950/70">
          <strong>{confirmDelete?.title}</strong> will be removed. If any student has already chosen
          it, the database will refuse — switch it off instead.
        </p>
      </Modal>
    </>
  )
}
