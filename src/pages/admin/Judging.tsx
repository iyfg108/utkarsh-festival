import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  fetchRegistrations,
  logAudit,
  setEntryOutcomes,
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
import { CheckIcon, DownloadIcon, TrackIcon, TrophyIcon } from '@/components/Icons'

interface Line {
  entryId: string
  registrationId: string
  student: string
  regCode: string
  classLevel: number
  school: string
  group: string
  selection: string | null
  score: number | null
  outcome: EntryOutcome
  award: string | null
  paid: boolean
}

const AWARDS = ['First prize', 'Second prize', 'Third prize', 'Special mention']

export default function Judging() {
  const { tracks } = useFestival()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])

  const [trackId, setTrackId] = useState('')
  const [group, setGroup] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!trackId && tracks.length > 0) setTrackId(tracks[0].id)
  }, [tracks, trackId])

  const rows = data ?? []

  const lines = useMemo<Line[]>(() => {
    const out: Line[] = []
    for (const r of rows as RegistrationRow[]) {
      // Groups are how the poster advertises it and how prizes are given.
      if (group && r.class_group !== group) continue
      for (const e of r.registration_tracks) {
        if (trackId && e.track_id !== trackId) continue
        out.push({
          entryId: e.id,
          registrationId: r.id,
          student: r.full_name,
          regCode: r.reg_code,
          classLevel: r.class_level,
          school: r.school_name,
          group: r.class_group,
          selection: e.selection_detail?.trim() || e.selection_item?.title || null,
          score: e.score,
          outcome: e.outcome,
          award: e.award,
          paid: r.payment_status === 'paid',
        })
      }
    }
    return out.sort((a, b) => {
      if (a.score === null && b.score === null) return a.student.localeCompare(b.student)
      if (a.score === null) return 1
      if (b.score === null) return -1
      return b.score - a.score
    })
  }, [rows, trackId, group])

  const track = tracks.find((t) => t.id === trackId)
  const scored = lines.filter((l) => l.score !== null).length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function saveScore(entryId: string, raw: string, previous: number | null) {
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (Number.isNaN(value) || value < 0 || value > 100)) {
      toast.error('Score must be between 0 and 100.')
      return
    }
    if (value === previous) return
    try {
      await updateEntry(entryId, { score: value })
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  async function saveAward(entryId: string, award: string) {
    try {
      await updateEntry(entryId, {
        award: award || null,
        outcome: award ? 'winner' : 'participated',
      })
      await logAudit('award', 'registration_track', entryId, { award })
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  async function bulkOutcome(outcome: EntryOutcome) {
    const ids = [...selected]
    if (ids.length === 0) return
    setBusy(true)
    try {
      await setEntryOutcomes(ids, outcome)
      await logAudit('outcome', 'registration_track', null, { count: ids.length, outcome })
      toast.success(`${ids.length} ${ids.length === 1 ? 'entry' : 'entries'} updated.`)
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
      `utkarsh-${track?.slug ?? 'results'}-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        lines.map((l, i) => ({
          rank: l.score !== null ? i + 1 : '',
          student: l.student,
          code: l.regCode,
          class: l.classLevel,
          group: l.group,
          school: l.school,
          selection: l.selection ?? '',
          score: l.score ?? '',
          award: l.award ?? '',
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
        title="Judging & prizes"
        subtitle="Enter scores, then mark the winners. Ranking updates as you type."
        actions={
          <Button
            variant="outline"
            onClick={exportList}
            disabled={lines.length === 0}
            icon={<DownloadIcon className="size-4" />}
          >
            Export results
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 rounded-3xl border border-night-950/8 bg-white p-4 stack-shadow sm:grid-cols-2">
        <Select label="Competition" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          label="Group"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          hint="Prizes are given per group, as advertised on the poster."
        >
          <option value="">All groups</option>
          <option value="A">A · Class I–IV</option>
          <option value="B">B · Class V–VII</option>
          <option value="C">C · Class VIII–X</option>
        </Select>
      </div>

      {track ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-night-950/8 bg-white px-5 py-4">
          <span className={cn('grid size-10 place-items-center rounded-xl', accent(track.accent).solid)}>
            <TrackIcon name={track.icon} className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-night-950">{track.name}</p>
            <p className="text-[13px] text-night-950/50">
              {lines.length} {lines.length === 1 ? 'entry' : 'entries'} · {scored} scored
            </p>
          </div>
        </div>
      ) : null}

      {selected.size > 0 ? (
        <div className="sticky top-2 z-30 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-marigold-400 bg-marigold-50 px-5 py-3.5 shadow-lg">
          <span className="text-sm font-bold text-marigold-900">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button size="sm" variant="outline" loading={busy} onClick={() => bulkOutcome('absent')}>
              Mark absent
            </Button>
            <Button size="sm" loading={busy} onClick={() => bulkOutcome('participated')}>
              Mark participated
            </Button>
          </div>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <EmptyState
          icon={<TrophyIcon className="size-12" />}
          title="No entries here yet"
          description="Once students register for this competition they show up here for judging."
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
                      onClick={() =>
                        setSelected((prev) =>
                          prev.size === lines.length
                            ? new Set()
                            : new Set(lines.map((l) => l.entryId)),
                        )
                      }
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
                  <th className="w-12 px-2 py-3.5">#</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">School</th>
                  {track?.requires_selection ? (
                    <th className="px-4 py-3.5">{track.selection_label}</th>
                  ) : null}
                  <th className="w-24 px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/6">
                {lines.map((l, i) => {
                  const isSel = selected.has(l.entryId)
                  return (
                    <tr
                      key={l.entryId}
                      className={cn('transition', isSel ? 'bg-marigold-50/70' : 'hover:bg-cream-50/60')}
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
                        <p className="flex items-center gap-1.5 text-[12px] text-night-950/45">
                          Class {l.classLevel} · Group {l.group} · {l.regCode}
                          {!l.paid ? (
                            <span className="rounded bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">
                              FEE DUE
                            </span>
                          ) : null}
                        </p>
                      </td>

                      <td className="max-w-[11rem] truncate px-4 py-3 text-night-950/70">
                        {l.school}
                      </td>

                      {track?.requires_selection ? (
                        <td className="px-4 py-3 text-night-950/70">{l.selection ?? '—'}</td>
                      ) : null}

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.5"
                          defaultValue={l.score ?? ''}
                          onBlur={(e) => void saveScore(l.entryId, e.target.value, l.score)}
                          placeholder="—"
                          className="w-20 rounded-xl border-2 border-night-950/10 px-3 py-1.5 text-sm font-bold tabular-nums outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={l.award ?? ''}
                          onChange={(e) => void saveAward(l.entryId, e.target.value)}
                          className={cn(
                            'w-40 cursor-pointer rounded-xl border-2 px-3 py-1.5 text-[13px] font-semibold outline-none transition',
                            l.award
                              ? 'border-gold-400 bg-yellow-50 text-yellow-900'
                              : 'border-night-950/10 bg-white text-night-950/60',
                          )}
                        >
                          <option value="">No prize</option>
                          {AWARDS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                        {l.outcome === 'absent' ? (
                          <Badge tone="neutral" className="ml-2">
                            Absent
                          </Badge>
                        ) : null}
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
        Scores save when you click away from the box. Ranking is by score, highest first — unscored
        entries sit at the bottom. Choosing a prize also marks that entry as a winner, which is what
        the student sees on the public status page.
      </p>
    </>
  )
}
