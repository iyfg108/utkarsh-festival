import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  fetchRegistrations,
  logAudit,
  setEntryOutcomes,
  setRegistrationStage,
  updateEntry,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { accent, cn, downloadCsv, toCsv } from '@/lib/utils'
import type { EntryOutcome, RegistrationRow } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '@/components/ui/Primitives'
import {
  CheckIcon,
  DownloadIcon,
  TrackIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'

interface Line {
  entryId: string
  registrationId: string
  student: string
  regCode: string
  classLevel: number
  school: string
  selection: string | null
  teamName: string | null
  teamSize: number
  score: number | null
  outcome: EntryOutcome
  stage: string
}

export default function Shortlist() {
  const { tracks, categories, schools } = useFestival()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])

  const [trackId, setTrackId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  // Default to the first track once the catalogue arrives.
  useEffect(() => {
    if (!trackId && tracks.length > 0) setTrackId(tracks[0].id)
  }, [tracks, trackId])

  const rows = data ?? []

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = []
    for (const r of rows as RegistrationRow[]) {
      if (categoryId && r.category_id !== categoryId) continue
      if (schoolId && r.school_id !== schoolId) continue
      for (const e of r.registration_tracks) {
        if (trackId && e.track_id !== trackId) continue
        out.push({
          entryId: e.id,
          registrationId: r.id,
          student: r.full_name,
          regCode: r.reg_code,
          classLevel: r.class_level,
          school: r.school?.name ?? r.school_name_other ?? '—',
          selection: e.selection_item?.title ?? null,
          teamName: e.team_name,
          teamSize: (e.team_members?.length ?? 0) + 1,
          score: e.stage1_score,
          outcome: e.outcome,
          stage: r.stage,
        })
      }
    }
    // Highest score first; unscored entries sink to the bottom.
    return out.sort((a, b) => {
      if (a.score === null && b.score === null) return a.student.localeCompare(b.student)
      if (a.score === null) return 1
      if (b.score === null) return -1
      return b.score - a.score
    })
  }, [rows, trackId, categoryId, schoolId])

  const track = tracks.find((t) => t.id === trackId)
  const shortlistedCount = lines.filter((l) =>
    ['shortlisted', 'finalist', 'winner'].includes(l.outcome),
  ).length

  function toggle(entryId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === lines.length ? new Set() : new Set(lines.map((l) => l.entryId)),
    )
  }

  async function saveScore(entryId: string, raw: string) {
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (Number.isNaN(value) || value < 0 || value > 100)) {
      toast.error('Score must be between 0 and 100.')
      return
    }
    try {
      await updateEntry(entryId, { stage1_score: value })
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  async function promote(outcome: EntryOutcome, alsoStage: boolean) {
    const ids = [...selected]
    if (ids.length === 0) return
    setBusy(true)
    try {
      await setEntryOutcomes(ids, outcome)

      if (alsoStage) {
        const regIds = [
          ...new Set(
            lines.filter((l) => selected.has(l.entryId)).map((l) => l.registrationId),
          ),
        ]
        await setRegistrationStage(regIds, 'finals')
      }

      await logAudit('shortlist', 'registration_track', null, {
        count: ids.length,
        outcome,
        track: track?.name,
      })

      toast.success(
        alsoStage
          ? `${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} shortlisted and moved to the finals.`
          : `${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} updated.`,
      )
      setSelected(new Set())
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  function exportList() {
    downloadCsv(
      `utkarsh-${track?.slug ?? 'entries'}-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        lines.map((l, i) => ({
          rank: l.score !== null ? i + 1 : '',
          student: l.student,
          code: l.regCode,
          class: l.classLevel,
          school: l.school,
          selection: l.selection ?? '',
          team: l.teamName ?? '',
          stage1_score: l.score ?? '',
          outcome: l.outcome,
        })),
      ),
    )
  }

  if (loading && rows.length === 0) return <LoadingBlock label="Loading entries…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <AdminHeader
        title="Judging & shortlist"
        subtitle="Enter Stage 1 scores, then send the best through to the temple finals."
        actions={
          <Button
            variant="outline"
            onClick={exportList}
            disabled={lines.length === 0}
            icon={<DownloadIcon className="size-4" />}
          >
            Export list
          </Button>
        }
      />

      {/* filters */}
      <div className="mb-5 grid gap-3 rounded-3xl border border-night-950/8 bg-white p-4 stack-shadow sm:grid-cols-3">
        <Select label="Competition" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select label="Age group" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All age groups</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="School" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {/* summary */}
      {track ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-night-950/8 bg-white px-5 py-4">
          <span className={cn('grid size-10 place-items-center rounded-xl', accent(track.accent).solid)}>
            <TrackIcon name={track.icon} className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-night-950">{track.name}</p>
            <p className="text-[13px] text-night-950/50">
              {lines.length} {lines.length === 1 ? 'entry' : 'entries'} · {shortlistedCount}{' '}
              shortlisted
            </p>
          </div>
          {track.is_team ? (
            <Badge tone="info">
              <UsersIcon className="size-3" />
              Team event
            </Badge>
          ) : null}
        </div>
      ) : null}

      {/* bulk bar */}
      {selected.size > 0 ? (
        <div className="sticky top-2 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-marigold-400 bg-marigold-50 px-5 py-3.5 shadow-lg">
          <span className="text-sm font-bold text-marigold-900">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              loading={busy}
              onClick={() => promote('not_shortlisted', false)}
            >
              Not shortlisted
            </Button>
            <Button
              size="sm"
              loading={busy}
              icon={<TrophyIcon className="size-4" />}
              onClick={() => promote('shortlisted', true)}
            >
              Shortlist → finals
            </Button>
          </div>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon className="size-12" />}
          title="No entries here yet"
          description="Once students register for this competition, they will show up here for judging."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                  <th className="w-12 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={toggleAll}
                      aria-label="Select all"
                      className={cn(
                        'grid size-5 place-items-center rounded-md border-2 transition',
                        selected.size === lines.length && lines.length > 0
                          ? 'border-marigold-500 bg-marigold-500 text-white'
                          : 'border-night-950/25 text-transparent hover:border-marigold-400',
                      )}
                    >
                      <CheckIcon className="size-3" strokeWidth={3.5} />
                    </button>
                  </th>
                  <th className="w-14 px-2 py-3.5">#</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">School</th>
                  <th className="px-4 py-3.5">{track?.selection_label ?? 'Entry'}</th>
                  <th className="w-28 px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/6">
                {lines.map((l, i) => {
                  const isSel = selected.has(l.entryId)
                  const promoted = ['shortlisted', 'finalist', 'winner'].includes(l.outcome)
                  return (
                    <tr
                      key={l.entryId}
                      className={cn(
                        'transition',
                        isSel ? 'bg-marigold-50/70' : 'hover:bg-cream-50/60',
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(l.entryId)}
                          aria-label={`Select ${l.student}`}
                          className={cn(
                            'grid size-5 place-items-center rounded-md border-2 transition',
                            isSel
                              ? 'border-marigold-500 bg-marigold-500 text-white'
                              : 'border-night-950/25 text-transparent hover:border-marigold-400',
                          )}
                        >
                          <CheckIcon className="size-3" strokeWidth={3.5} />
                        </button>
                      </td>

                      <td className="px-2 py-3">
                        {l.score !== null ? (
                          <span
                            className={cn(
                              'grid size-7 place-items-center rounded-full text-[11px] font-black',
                              i === 0
                                ? 'bg-gold-400 text-night-950'
                                : i === 1
                                  ? 'bg-night-950/15 text-night-950'
                                  : i === 2
                                    ? 'bg-marigold-200 text-marigold-900'
                                    : 'text-night-950/40',
                            )}
                          >
                            {i + 1}
                          </span>
                        ) : (
                          <span className="text-night-950/20">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/registrations/${l.registrationId}`}
                          className="font-bold text-night-950 hover:text-marigold-700"
                        >
                          {l.student}
                        </Link>
                        <p className="text-[12px] text-night-950/45">
                          Class {l.classLevel} · {l.regCode}
                        </p>
                      </td>

                      <td className="max-w-[12rem] truncate px-4 py-3 text-night-950/70">
                        {l.school}
                      </td>

                      <td className="px-4 py-3 text-night-950/70">
                        {l.selection ?? '—'}
                        {l.teamName ? (
                          <p className="text-[12px] italic text-night-950/45">
                            {l.teamName} · {l.teamSize} members
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          defaultValue={l.score ?? ''}
                          onBlur={(e) => {
                            const raw = e.target.value
                            const next = raw === '' ? null : Number(raw)
                            if (next !== l.score) void saveScore(l.entryId, raw)
                          }}
                          placeholder="—"
                          className="w-20 rounded-xl border-2 border-night-950/10 px-3 py-1.5 text-sm font-bold tabular-nums outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
                        />
                      </td>

                      <td className="px-4 py-3">
                        {promoted ? (
                          <Badge tone={l.outcome === 'winner' ? 'gold' : 'success'}>
                            {l.outcome === 'winner'
                              ? 'Winner'
                              : l.outcome === 'finalist'
                                ? 'Finalist'
                                : 'Shortlisted'}
                          </Badge>
                        ) : l.outcome === 'not_shortlisted' ? (
                          <Badge tone="neutral">Not shortlisted</Badge>
                        ) : (
                          <Badge tone="neutral">Registered</Badge>
                        )}
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
        Scores save when you click away from the box. Ranking is by Stage 1 score, highest first —
        unscored entries sit at the bottom. Shortlisting an entry also moves that student to the
        finals stage, which is what they see on the public status page.
      </p>
    </>
  )
}
