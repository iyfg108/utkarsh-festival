import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/context/ToastContext'
import { useFestival } from '@/context/FestivalContext'
import {
  deleteSchool,
  fetchRegistrations,
  fetchSchools,
  logAudit,
  upsertSchool,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { School } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Toggle } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { SchoolIcon } from '@/components/Icons'

const BLANK = {
  id: undefined as string | undefined,
  name: '',
  slug: '',
  area: '',
  address: '',
  coordinator_name: '',
  coordinator_phone: '',
  coordinator_email: '',
  stage1_date: '',
  stage1_venue: '',
  is_active: true,
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export default function SchoolsAdmin() {
  const toast = useToast()
  const { reload: reloadFestival } = useFestival()
  const schools = useAsync(() => fetchSchools(true), [])
  const regs = useAsync(() => fetchRegistrations(), [])

  const [editing, setEditing] = useState<typeof BLANK | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<School | null>(null)
  const [saving, setSaving] = useState(false)

  const rows = schools.data ?? []

  const counts = new Map<string, number>()
  for (const r of regs.data ?? []) {
    if (r.school_id) counts.set(r.school_id, (counts.get(r.school_id) ?? 0) + 1)
  }

  // Free-text school names students typed in — worth surfacing so they get added.
  const unlisted = new Map<string, number>()
  for (const r of regs.data ?? []) {
    if (!r.school_id && r.school_name_other) {
      const key = r.school_name_other.trim()
      unlisted.set(key, (unlisted.get(key) ?? 0) + 1)
    }
  }

  async function save() {
    if (!editing) return
    const name = editing.name.trim()
    if (!name) {
      toast.error('Please enter the school name.')
      return
    }
    setSaving(true)
    try {
      await upsertSchool({
        ...(editing.id ? { id: editing.id } : {}),
        name,
        slug: editing.slug.trim() || slugify(name),
        area: editing.area.trim() || null,
        address: editing.address.trim() || null,
        coordinator_name: editing.coordinator_name.trim() || null,
        coordinator_phone: editing.coordinator_phone.trim() || null,
        coordinator_email: editing.coordinator_email.trim() || null,
        stage1_date: editing.stage1_date || null,
        stage1_venue: editing.stage1_venue.trim() || null,
        is_active: editing.is_active,
      })
      await logAudit(editing.id ? 'update' : 'create', 'school', editing.id ?? null, { name })
      toast.success('Saved.')
      setEditing(null)
      schools.reload()
      reloadFestival()
    } catch (err) {
      const message = friendlyError(err)
      toast.error(
        /duplicate key|unique/i.test(message)
          ? 'A school with that short name already exists — change the slug.'
          : message,
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirmDelete) return
    try {
      await deleteSchool(confirmDelete.id)
      await logAudit('delete', 'school', confirmDelete.id, { name: confirmDelete.name })
      toast.success('School removed.')
      setConfirmDelete(null)
      schools.reload()
      reloadFestival()
    } catch (err) {
      const message = friendlyError(err)
      toast.error(
        /foreign key|violates/i.test(message)
          ? 'Students are registered under this school, so it cannot be deleted. Switch it off instead.'
          : message,
      )
    }
  }

  if (schools.loading && rows.length === 0) return <LoadingBlock />
  if (schools.error) return <ErrorState error={schools.error} onRetry={schools.reload} />

  return (
    <>
      <AdminHeader
        title="Schools"
        subtitle="Who is taking part, and when their Stage 1 round happens."
        actions={<Button onClick={() => setEditing({ ...BLANK })}>Add a school</Button>}
      />

      {unlisted.size > 0 ? (
        <div className="mb-5 rounded-2xl border-2 border-marigold-300 bg-marigold-50 px-5 py-4">
          <p className="text-sm font-bold text-marigold-900">
            Students typed in {unlisted.size} school{unlisted.size === 1 ? '' : 's'} we do not have
            listed
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...unlisted.entries()].map(([name, n]) => (
              <button
                key={name}
                type="button"
                onClick={() => setEditing({ ...BLANK, name, slug: slugify(name) })}
                className="rounded-full border border-marigold-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-marigold-900 transition hover:border-marigold-500"
              >
                {name} <span className="opacity-60">({n})</span> +
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<SchoolIcon className="size-12" />}
          title="No schools yet"
          description="Add the schools taking part so students can pick theirs while registering."
          action={<Button onClick={() => setEditing({ ...BLANK })}>Add the first school</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-night-950">{s.name}</h2>
                  {s.area ? <p className="text-[13px] text-night-950/50">{s.area}</p> : null}
                </div>
                <Badge tone={s.is_active ? 'success' : 'neutral'}>
                  {counts.get(s.id) ?? 0} registered
                </Badge>
              </div>

              {s.coordinator_name || s.stage1_date ? (
                <dl className="mt-4 space-y-1.5 text-[13px] text-night-950/60">
                  {s.coordinator_name ? (
                    <div>
                      Coordinator: <strong className="text-night-950/80">{s.coordinator_name}</strong>
                      {s.coordinator_phone ? ` · ${s.coordinator_phone}` : ''}
                    </div>
                  ) : null}
                  {s.stage1_date ? (
                    <div>
                      Stage 1: <strong className="text-night-950/80">{formatDate(s.stage1_date)}</strong>
                      {s.stage1_venue ? ` · ${s.stage1_venue}` : ''}
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <div className="mt-4 flex items-center gap-2 border-t border-night-950/8 pt-3">
                <Toggle
                  checked={s.is_active}
                  label={`Toggle ${s.name}`}
                  onChange={async (next) => {
                    try {
                      await upsertSchool({ id: s.id, name: s.name, slug: s.slug, is_active: next })
                      schools.reload()
                      reloadFestival()
                    } catch (err) {
                      toast.error(friendlyError(err))
                    }
                  }}
                />
                <span className="text-[12px] font-semibold text-night-950/50">
                  {s.is_active ? 'Accepting registrations' : 'Hidden'}
                </span>

                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: s.id,
                        name: s.name,
                        slug: s.slug,
                        area: s.area ?? '',
                        address: s.address ?? '',
                        coordinator_name: s.coordinator_name ?? '',
                        coordinator_phone: s.coordinator_phone ?? '',
                        coordinator_email: s.coordinator_email ?? '',
                        stage1_date: s.stage1_date ?? '',
                        stage1_venue: s.stage1_venue ?? '',
                        is_active: s.is_active,
                      })
                    }
                    className="rounded-lg px-3 py-1.5 text-[13px] font-bold text-peacock-700 transition hover:bg-peacock-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(s)}
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
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit school' : 'Add a school'}
        size="lg"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="School name"
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: editing.id ? editing.slug : slugify(e.target.value),
                  })
                }
              />
              <Input
                label="Short name (slug)"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                hint="Used internally. Must be unique."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Area"
                value={editing.area}
                onChange={(e) => setEditing({ ...editing, area: e.target.value })}
                placeholder="e.g. Ulubari"
              />
              <Input
                label="Address"
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </div>

            <div className="rule-gold" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Coordinator"
                value={editing.coordinator_name}
                onChange={(e) => setEditing({ ...editing, coordinator_name: e.target.value })}
              />
              <Input
                label="Phone"
                value={editing.coordinator_phone}
                onChange={(e) => setEditing({ ...editing, coordinator_phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={editing.coordinator_email}
                onChange={(e) => setEditing({ ...editing, coordinator_email: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Stage 1 date"
                type="date"
                value={editing.stage1_date}
                onChange={(e) => setEditing({ ...editing, stage1_date: e.target.value })}
              />
              <Input
                label="Stage 1 venue"
                value={editing.stage1_venue}
                onChange={(e) => setEditing({ ...editing, stage1_venue: e.target.value })}
                placeholder="e.g. School auditorium"
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this school?"
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
          <strong>{confirmDelete?.name}</strong> will be removed from the list. If students are
          already registered under it, the database will refuse — switch it off instead.
        </p>
      </Modal>
    </>
  )
}
