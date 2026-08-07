import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { fetchRegistrations } from '@/lib/queries'
import { accent, cn, downloadCsv, formatDate, toCsv } from '@/lib/utils'
import type { RegistrationRow } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '@/components/ui/Primitives'
import { ClipboardIcon, DownloadIcon, SearchIcon, TrackIcon } from '@/components/Icons'

const STAGE_LABEL = { school_round: 'School round', finals: 'Finals' } as const

export default function Registrations() {
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])
  const { tracks, categories, schools } = useFestival()

  const [q, setQ] = useState('')
  const [trackId, setTrackId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [stage, setStage] = useState('')

  const rows = data ?? []

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (needle) {
        const haystack = [
          r.full_name,
          r.reg_code,
          r.guardian_name,
          r.guardian_phone,
          r.email ?? '',
          r.school?.name ?? r.school_name_other ?? '',
          ...r.registration_tracks.map((e) => e.selection_item?.title ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (trackId && !r.registration_tracks.some((e) => e.track_id === trackId)) return false
      if (categoryId && r.category_id !== categoryId) return false
      if (schoolId && r.school_id !== schoolId) return false
      if (stage && r.stage !== stage) return false
      return true
    })
  }, [rows, q, trackId, categoryId, schoolId, stage])

  function exportCsv() {
    // One row per entry — that is what organisers actually work from.
    const flat = filtered.flatMap((r) =>
      r.registration_tracks.map((e) => ({
        registration_code: r.reg_code,
        student_name: r.full_name,
        class: r.class_level,
        section: r.section ?? '',
        age_group: r.category?.name ?? '',
        school: r.school?.name ?? r.school_name_other ?? '',
        guardian_name: r.guardian_name,
        guardian_phone: r.guardian_phone,
        student_phone: r.student_phone ?? '',
        email: r.email ?? '',
        competition: e.track?.name ?? '',
        selection: e.selection_item?.title ?? '',
        team_name: e.team_name ?? '',
        team_size: e.team_members ? e.team_members.length + 1 : '',
        stage: STAGE_LABEL[r.stage],
        outcome: e.outcome,
        stage1_score: e.stage1_score ?? '',
        stage2_score: e.stage2_score ?? '',
        award: e.award ?? '',
        registered_on: formatDate(r.created_at),
      })),
    )
    downloadCsv(
      `utkarsh-registrations-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(flat),
    )
  }

  if (loading && rows.length === 0) return <LoadingBlock label="Loading registrations…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <AdminHeader
        title="Registrations"
        subtitle={`${filtered.length} of ${rows.length} shown`}
        actions={
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            icon={<DownloadIcon className="size-4" />}
          >
            Export CSV
          </Button>
        }
      />

      {/* filters */}
      <div className="mb-5 rounded-3xl border border-night-950/8 bg-white p-4 stack-shadow">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-night-950/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, code, phone, school or song…"
            className="w-full rounded-2xl border-2 border-night-950/10 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
            <option value="">All competitions</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All age groups</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
            <option value="">All schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">Any stage</option>
            <option value="school_round">School round</option>
            <option value="finals">Finals</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardIcon className="size-12" />}
          title={rows.length === 0 ? 'No registrations yet' : 'Nothing matches those filters'}
          description={
            rows.length === 0
              ? 'As soon as students register, they will appear here.'
              : 'Try clearing the search or the filters.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead>
                <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">School</th>
                  <th className="px-4 py-3.5">Group</th>
                  <th className="px-4 py-3.5">Competitions</th>
                  <th className="px-4 py-3.5">Stage</th>
                  <th className="px-4 py-3.5">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/6">
                {filtered.map((r) => (
                  <Row key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function Row({ r }: { r: RegistrationRow }) {
  return (
    <tr className="transition hover:bg-cream-50/60">
      <td className="px-5 py-3.5">
        <Link
          to={`/admin/registrations/${r.id}`}
          className="font-bold text-night-950 hover:text-marigold-700"
        >
          {r.full_name}
        </Link>
        <p className="text-[12px] text-night-950/45">
          Class {r.class_level}
          {r.section ? ` · ${r.section}` : ''} · {r.guardian_phone}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <span className="font-mono text-[12px] font-bold text-night-950/70">{r.reg_code}</span>
      </td>
      <td className="max-w-[13rem] truncate px-4 py-3.5 text-night-950/70">
        {r.school?.name ?? r.school_name_other}
      </td>
      <td className="px-4 py-3.5">
        <Badge tone="neutral">{r.category?.name ?? '—'}</Badge>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1">
          {r.registration_tracks.map((e) => {
            const a = accent(e.track?.accent)
            return (
              <span
                key={e.id}
                title={e.selection_item?.title ?? e.track?.name ?? ''}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold',
                  a.chip,
                )}
              >
                <TrackIcon name={e.track?.icon ?? 'sparkles'} className="size-3" />
                {e.track?.name}
              </span>
            )
          })}
        </div>
      </td>
      <td className="px-4 py-3.5">
        {r.stage === 'finals' ? (
          <Badge tone="gold">Finals</Badge>
        ) : (
          <Badge tone="neutral">School</Badge>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-night-950/45">
        {formatDate(r.created_at)}
      </td>
    </tr>
  )
}
