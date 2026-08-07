import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  deleteRegistration,
  fetchRegistration,
  logAudit,
  updateEntry,
  updateRegistration,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { accent, cn, formatDate } from '@/lib/utils'
import type { EntryOutcome, RegStage, RegStatus } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Form'
import {
  Badge,
  ErrorState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { ArrowRightIcon, TrackIcon, TrophyIcon, UsersIcon } from '@/components/Icons'

const OUTCOMES: { value: EntryOutcome; label: string }[] = [
  { value: 'registered', label: 'Registered' },
  { value: 'shortlisted', label: 'Shortlisted for finals' },
  { value: 'not_shortlisted', label: 'Not shortlisted' },
  { value: 'finalist', label: 'Finalist' },
  { value: 'winner', label: 'Winner' },
]

export default function RegistrationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { isSuperAdmin } = useAuth()
  const { data, loading, error, reload } = useAsync(
    () => (id ? fetchRegistration(id) : Promise.resolve(null)),
    [id],
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  if (loading && !data) return <LoadingBlock label="Loading registration…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) {
    return (
      <ErrorState
        error="That registration could not be found — it may have been removed."
        onRetry={() => navigate('/admin/registrations')}
      />
    )
  }

  const r = data

  async function patchRegistration(patch: { stage?: RegStage; status?: RegStatus }) {
    if (!id) return
    setSaving(true)
    try {
      await updateRegistration(id, patch)
      await logAudit('update', 'registration', id, patch)
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function patchEntry(
    entryId: string,
    patch: Parameters<typeof updateEntry>[1],
  ) {
    setSaving(true)
    try {
      await updateEntry(entryId, patch)
      await logAudit('update', 'registration_track', entryId, patch)
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!id) return
    try {
      await deleteRegistration(id)
      await logAudit('delete', 'registration', id, { reg_code: r.reg_code })
      toast.success(`${r.full_name}'s registration was deleted.`)
      navigate('/admin/registrations')
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  return (
    <>
      <Link
        to="/admin/registrations"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-night-950/50 transition hover:text-night-950"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        All registrations
      </Link>

      <AdminHeader
        title={r.full_name}
        subtitle={`${r.reg_code} · registered ${formatDate(r.created_at, true)}`}
        actions={
          isSuperAdmin ? (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* entries */}
        <div className="space-y-4">
          {r.registration_tracks.map((e) => {
            const a = accent(e.track?.accent)
            return (
              <section
                key={e.id}
                className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('grid size-11 place-items-center rounded-2xl', a.solid)}>
                      <TrackIcon name={e.track?.icon ?? 'sparkles'} className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-night-950">{e.track?.name}</h2>
                      {e.selection_item ? (
                        <p className="text-sm text-night-950/60">{e.selection_item.title}</p>
                      ) : null}
                    </div>
                  </div>

                  {e.award ? (
                    <Badge tone="gold">
                      <TrophyIcon className="size-3" />
                      {e.award}
                    </Badge>
                  ) : null}
                </div>

                {e.team_name || (e.team_members && e.team_members.length > 0) ? (
                  <div className="mt-4 rounded-2xl bg-cream-50/70 p-4">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-night-950/45">
                      <UsersIcon className="size-3.5" />
                      Team {e.team_name ? `· ${e.team_name}` : ''}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      <li className="rounded-full bg-marigold-100 px-3 py-1 text-[12px] font-bold text-marigold-800">
                        {r.full_name} (Class {r.class_level})
                      </li>
                      {(e.team_members ?? []).map((m) => (
                        <li
                          key={m.id}
                          className="rounded-full bg-night-950/6 px-3 py-1 text-[12px] font-semibold text-night-950/70"
                        >
                          {m.full_name}
                          {m.class_level ? ` (Class ${m.class_level})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Stage 1 score"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    defaultValue={e.stage1_score ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value
                      const next = v === '' ? null : Number(v)
                      if (next !== e.stage1_score) patchEntry(e.id, { stage1_score: next })
                    }}
                  />
                  <Input
                    label="Stage 2 score"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    defaultValue={e.stage2_score ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value
                      const next = v === '' ? null : Number(v)
                      if (next !== e.stage2_score) patchEntry(e.id, { stage2_score: next })
                    }}
                  />
                  <Select
                    label="Outcome"
                    value={e.outcome}
                    onChange={(ev) => patchEntry(e.id, { outcome: ev.target.value })}
                  >
                    {OUTCOMES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Award"
                    placeholder="e.g. First prize"
                    defaultValue={e.award ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim() || null
                      if (v !== e.award) patchEntry(e.id, { award: v })
                    }}
                  />
                  <Input
                    label="Judge's remarks"
                    placeholder="Optional"
                    defaultValue={e.stage1_remarks ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim() || null
                      if (v !== e.stage1_remarks) patchEntry(e.id, { stage1_remarks: v })
                    }}
                  />
                </div>
              </section>
            )
          })}
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">
              Student
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Class" value={`Class ${r.class_level}${r.section ? ` · ${r.section}` : ''}`} />
              <Detail label="Age group" value={r.category?.name ?? '—'} />
              <Detail label="School" value={r.school?.name ?? r.school_name_other ?? '—'} />
              {r.date_of_birth ? <Detail label="Date of birth" value={formatDate(r.date_of_birth)} /> : null}
              {r.gender ? <Detail label="Gender" value={r.gender} /> : null}
            </dl>
          </section>

          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">
              Contact
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Guardian" value={r.guardian_name} />
              <Detail
                label="Phone"
                value={
                  <a href={`tel:${r.guardian_phone}`} className="text-peacock-700 hover:underline">
                    {r.guardian_phone}
                  </a>
                }
              />
              {r.student_phone ? <Detail label="Student phone" value={r.student_phone} /> : null}
              {r.email ? (
                <Detail
                  label="Email"
                  value={
                    <a href={`mailto:${r.email}`} className="break-all text-peacock-700 hover:underline">
                      {r.email}
                    </a>
                  }
                />
              ) : null}
              {r.address ? <Detail label="Address" value={r.address} /> : null}
              <Detail label="Media consent" value={r.consent_media ? 'Given' : 'Not given'} />
            </dl>
          </section>

          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">
              Status
            </h2>
            <div className="mt-4 space-y-4">
              <Select
                label="Stage"
                value={r.stage}
                disabled={saving}
                onChange={(e) => patchRegistration({ stage: e.target.value as RegStage })}
              >
                <option value="school_round">School round</option>
                <option value="finals">Through to finals</option>
              </Select>
              <Select
                label="Status"
                value={r.status}
                disabled={saving}
                onChange={(e) => patchRegistration({ status: e.target.value as RegStatus })}
              >
                <option value="confirmed">Confirmed</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="disqualified">Disqualified</option>
              </Select>
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this registration?"
        description="This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-night-950/70">
          <strong>{r.full_name}</strong> ({r.reg_code}) and all {r.registration_tracks.length} of
          their entries will be removed. The song and sloka slots they were holding will be freed up
          for other students.
        </p>
      </Modal>
    </>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-night-950/40">{label}</dt>
      <dd className="mt-0.5 font-medium text-night-950">{value}</dd>
    </div>
  )
}
