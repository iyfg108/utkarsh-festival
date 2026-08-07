import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { useFestival } from '@/context/FestivalContext'
import { fetchAvailability, fetchRegistrations } from '@/lib/queries'
import { accent, cn, formatDate } from '@/lib/utils'
import { AdminHeader } from './AdminLayout'
import {
  Badge,
  CountUp,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '@/components/ui/Primitives'
import {
  ClipboardIcon,
  SchoolIcon,
  TrackIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'

export default function Dashboard() {
  const { admin, isCoordinator } = useAuth()
  const { tracks, categories, schools } = useFestival()
  const regs = useAsync(() => fetchRegistrations(), [])
  const avail = useAsync(() => fetchAvailability(), [])

  const rows = regs.data ?? []

  const stats = useMemo(() => {
    const entries = rows.flatMap((r) => r.registration_tracks)
    return {
      registrations: rows.length,
      entries: entries.length,
      schools: new Set(
        rows.map((r) => r.school?.name ?? r.school_name_other ?? '—'),
      ).size,
      finalists: rows.filter((r) => r.stage === 'finals').length,
      shortlisted: entries.filter((e) =>
        ['shortlisted', 'finalist', 'winner'].includes(e.outcome),
      ).length,
      unscored: entries.filter((e) => e.stage1_score === null).length,
    }
  }, [rows])

  const byTrack = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      for (const e of r.registration_tracks) {
        const key = e.track?.name ?? 'Unknown'
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return tracks
      .map((t) => ({
        name: t.name,
        accent: t.accent,
        icon: t.icon,
        count: counts.get(t.name) ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [rows, tracks])

  const byCategory = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const key = r.category?.name ?? '—'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return categories.map((c) => ({ name: c.name, count: counts.get(c.name) ?? 0 }))
  }, [rows, categories])

  const bySchool = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const key = r.school?.name ?? r.school_name_other ?? 'Unlisted school'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [rows])

  const hotItems = useMemo(
    () =>
      (avail.data ?? [])
        .filter((i) => i.taken_count > 0)
        .sort((a, b) => b.taken_count / b.max_slots - a.taken_count / a.max_slots)
        .slice(0, 8),
    [avail.data],
  )

  const maxTrack = Math.max(...byTrack.map((t) => t.count), 1)
  const maxSchool = Math.max(...bySchool.map((s) => s.count), 1)

  if (regs.loading && rows.length === 0) return <LoadingBlock label="Loading the dashboard…" />
  if (regs.error) return <ErrorState error={regs.error} onRetry={regs.reload} />

  return (
    <>
      <AdminHeader
        title={`Namaste, ${admin?.full_name?.split(' ')[0] ?? 'friend'}`}
        subtitle={
          isCoordinator
            ? `Showing registrations for ${schools.find((s) => s.id === admin?.school_id)?.name ?? 'your school'} only.`
            : 'A live view of how the festival is filling up.'
        }
      />

      {/* stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={<UsersIcon className="size-5" />}
          label="Registrations"
          value={stats.registrations}
          tone="from-marigold-400 to-marigold-600"
        />
        <Tile
          icon={<ClipboardIcon className="size-5" />}
          label="Competition entries"
          value={stats.entries}
          tone="from-peacock-400 to-peacock-600"
        />
        <Tile
          icon={<SchoolIcon className="size-5" />}
          label="Schools"
          value={stats.schools}
          tone="from-rose-festival-400 to-fuchsia-600"
        />
        <Tile
          icon={<TrophyIcon className="size-5" />}
          label="Through to finals"
          value={stats.finalists}
          tone="from-night-500 to-night-700"
        />
      </div>

      {stats.unscored > 0 ? (
        <Link
          to="/admin/shortlist"
          className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-marigold-300 bg-marigold-50 px-5 py-4 transition hover:border-marigold-400"
        >
          <TrophyIcon className="size-5 shrink-0 text-marigold-700" />
          <p className="flex-1 text-sm font-semibold text-marigold-900">
            {stats.unscored} {stats.unscored === 1 ? 'entry has' : 'entries have'} no Stage 1 score
            yet.
          </p>
          <span className="text-sm font-bold text-marigold-700">Open judging →</span>
        </Link>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* by track */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <h2 className="text-lg font-black text-night-950">Entries by competition</h2>
          {stats.entries === 0 ? (
            <EmptyState
              title="No entries yet"
              description="They will appear here as students register."
              className="mt-4 border-0 py-8"
            />
          ) : (
            <ul className="mt-5 space-y-3.5">
              {byTrack.map((t) => {
                const a = accent(t.accent)
                return (
                  <li key={t.name}>
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <span className={cn('grid size-7 place-items-center rounded-lg', a.solid)}>
                        <TrackIcon name={t.icon} className="size-4" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-night-950">{t.name}</span>
                      <span className="font-display text-sm font-black tabular-nums text-night-950">
                        {t.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-night-950/6">
                      <div
                        className={cn('h-full rounded-full bg-gradient-to-r', a.gradient)}
                        style={{ width: `${(t.count / maxTrack) * 100}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          {/* by category */}
          <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
            <h2 className="text-lg font-black text-night-950">By age group</h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {byCategory.map((c) => (
                <div
                  key={c.name}
                  className="rounded-2xl border border-night-950/8 bg-cream-50/70 p-4 text-center"
                >
                  <p className="font-display text-2xl font-black tabular-nums text-night-950">
                    {c.count}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-night-950/50">
                    {c.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* top schools */}
          <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
            <h2 className="text-lg font-black text-night-950">Most active schools</h2>
            {bySchool.length === 0 ? (
              <p className="mt-4 text-sm text-night-950/50">Nothing yet.</p>
            ) : (
              <ul className="mt-5 space-y-2.5">
                {bySchool.map((s) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-night-950/75">
                      {s.name}
                    </span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-night-950/6">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-peacock-400 to-peacock-600"
                        style={{ width: `${(s.count / maxSchool) * 100}%` }}
                      />
                    </div>
                    <span className="w-7 text-right font-display text-sm font-black tabular-nums text-night-950">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* filling up */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-night-950">Filling up fastest</h2>
            <Link
              to="/admin/selections"
              className="text-[13px] font-bold text-peacock-700 hover:underline"
            >
              Manage
            </Link>
          </div>
          <p className="mt-1 text-[13px] text-night-950/50">
            Songs, slokas and characters closest to their cap.
          </p>

          {hotItems.length === 0 ? (
            <p className="mt-5 text-sm text-night-950/50">Nothing has been picked yet.</p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {hotItems.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-night-950/80">
                    {i.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums',
                      i.is_full
                        ? 'bg-rose-100 text-rose-700'
                        : i.slots_left === 1
                          ? 'bg-marigold-100 text-marigold-800'
                          : 'bg-night-950/6 text-night-950/60',
                    )}
                  >
                    {i.taken_count}/{i.max_slots}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* recent */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-night-950">Latest registrations</h2>
            <Link
              to="/admin/registrations"
              className="text-[13px] font-bold text-peacock-700 hover:underline"
            >
              See all
            </Link>
          </div>

          {rows.length === 0 ? (
            <p className="mt-5 text-sm text-night-950/50">No registrations yet.</p>
          ) : (
            <ul className="mt-5 divide-y divide-night-950/6">
              {rows.slice(0, 7).map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/admin/registrations/${r.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-night-950/4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-night-950">{r.full_name}</p>
                      <p className="truncate text-[12px] text-night-950/50">
                        {r.school?.name ?? r.school_name_other} · Class {r.class_level}
                      </p>
                    </div>
                    <Badge tone="neutral">{r.registration_tracks.length}</Badge>
                    <span className="hidden shrink-0 text-[11px] text-night-950/40 sm:block">
                      {formatDate(r.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function Tile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
      <span className={cn('grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white', tone)}>
        {icon}
      </span>
      <p className="mt-4 font-display text-3xl font-black tabular-nums text-night-950">
        <CountUp value={value} duration={900} />
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-night-950/50">{label}</p>
    </div>
  )
}
