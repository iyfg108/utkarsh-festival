import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import {
  CERTIFICATE_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  accent,
  cn,
  downloadCsv,
  formatDate,
  formatMoney,
  toCsv,
} from '@/lib/utils'
import { fetchRegistrations } from '@/lib/queries'
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

interface ExportColumn {
  key: string
  label: string
  /** Grouping shown in the picker; competitions are listed together. */
  group?: string
  value: (r: RegistrationRow) => unknown
}

const EXPORT_COLUMNS_KEY = 'utkarsh-export-columns'

/** What a desk needs to find a student and take their money. */
const ESSENTIAL_COLUMNS = [
  'code', 'name', 'class', 'group', 'school', 'guardian_phone', 'whatsapp', 'fee', 'paid',
]

export default function Registrations() {
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])
  const { tracks } = useFestival()

  const [q, setQ] = useState('')
  const [trackId, setTrackId] = useState('')
  const [payment, setPayment] = useState('')
  const [certificate, setCertificate] = useState('')

  const rows = data ?? []

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (needle) {
        const hay = [
          r.full_name,
          r.reg_code,
          r.guardian_name,
          r.guardian_phone,
          r.email ?? '',
          r.whatsapp ?? '',
          r.school_name,
          ...r.registration_tracks.map((e) => e.selection_item?.title ?? ''),
          ...r.registration_tracks.map((e) => e.selection_detail ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (trackId && !r.registration_tracks.some((e) => e.track_id === trackId)) return false
      if (payment === 'due' && r.payment_status === 'paid') return false
      if (payment === 'paid' && r.payment_status !== 'paid') return false
      if (payment === 'at_venue' && r.payment_method !== 'pay_at_venue') return false
      if (payment === 'awaiting' && r.payment_status !== 'awaiting_verification') return false
      if (certificate === 'pending' && r.certificate_status !== 'pending') return false
      if (certificate === 'done' && r.certificate_status === 'pending') return false
      return true
    })
  }, [rows, q, trackId, payment, certificate])

  /*
    The export is built from a declared list of columns rather than an object
    literal, so the organiser can choose which ones they want. Each competition
    is its own column, which is what makes a category-wise sheet possible:
    filter to Gita Shloka, untick everything else, and you get a list of just
    those students.
  */
  const columns = useMemo<ExportColumn[]>(() => {
    const base: ExportColumn[] = [
      { key: 'code', label: 'Registration code', value: (r) => r.reg_code },
      { key: 'name', label: 'Name', value: (r) => r.full_name },
      { key: 'class', label: 'Class', value: (r) => r.class_level },
      { key: 'group', label: 'Group', value: (r) => r.class_group },
      { key: 'school', label: 'School', value: (r) => r.school_name },
      { key: 'dob', label: 'Date of birth', value: (r) => formatDate(r.date_of_birth) },
      { key: 'gender', label: 'Gender', value: (r) => r.gender },
      { key: 'guardian', label: 'Guardian', value: (r) => r.guardian_name },
      { key: 'guardian_phone', label: 'Guardian phone', value: (r) => r.guardian_phone },
      { key: 'student_phone', label: 'Student phone', value: (r) => r.student_phone ?? '' },
      { key: 'email', label: 'Email', value: (r) => r.email ?? '' },
      { key: 'whatsapp', label: 'WhatsApp', value: (r) => r.whatsapp ?? '' },
    ]

    // A column per competition: the cell holds the song or "Yes".
    const comp: ExportColumn[] = tracks.map((t) => ({
      key: `track:${t.id}`,
      label: t.name,
      group: 'Competitions',
      value: (r) => {
        const entry = r.registration_tracks.find((e) => e.track_id === t.id)
        if (!entry) return ''
        return entry.selection_detail?.trim()
          ? `${entry.selection_detail.trim()}${
              entry.selection_item ? ` (${entry.selection_item.title})` : ''
            }`
          : (entry.selection_item?.title ?? 'Yes')
      },
    }))

    const tail: ExportColumn[] = [
      { key: 'fee', label: 'Fee', value: (r) => r.fee_amount },
      {
        key: 'method',
        label: 'Payment method',
        value: (r) => (r.payment_method ? PAYMENT_METHOD_LABEL[r.payment_method] : ''),
      },
      { key: 'paid', label: 'Paid', value: (r) => (r.payment_status === 'paid' ? 'YES' : 'NO') },
      { key: 'paid_on', label: 'Paid on', value: (r) => (r.paid_at ? formatDate(r.paid_at, true) : '') },
      {
        key: 'payment_ref',
        label: 'Payment ref',
        value: (r) => r.razorpay_payment_id ?? r.upi_reference ?? '',
      },
      {
        key: 'payment_status',
        label: 'Payment status',
        value: (r) => PAYMENT_STATUS_LABEL[r.payment_status],
      },
      { key: 'payment_note', label: 'Payment note', value: (r) => r.payment_notes ?? '' },
      { key: 'attended', label: 'Attended', value: (r) => (r.attended ? 'YES' : 'NO') },
      { key: 'certificate', label: 'Certificate', value: (r) => CERTIFICATE_LABEL[r.certificate_status] },
      {
        key: 'prizes',
        label: 'Prizes',
        value: (r) =>
          r.registration_tracks
            .filter((e) => e.award)
            .map((e) => `${e.track?.name}: ${e.award}`)
            .join('; '),
      },
      { key: 'registered_on', label: 'Registered on', value: (r) => formatDate(r.created_at) },
    ]

    return [...base, ...comp, ...tail]
  }, [tracks])

  /*
    Which columns are ticked. Remembered per browser: an organiser who wants a
    phone list is usually going to want it again, and re-ticking twenty boxes
    each time is the sort of friction that ends in someone exporting the lot
    and editing it in Excel.
  */
  const [chosen, setChosen] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(EXPORT_COLUMNS_KEY)
      if (saved) return JSON.parse(saved) as string[]
    } catch {
      /* corrupt or unavailable — fall through to the default */
    }
    return []
  })

  // Empty means "not chosen yet", which is every column.
  const activeKeys = chosen.length > 0 ? chosen : columns.map((c) => c.key)

  function setColumns(keys: string[]) {
    setChosen(keys)
    try {
      localStorage.setItem(EXPORT_COLUMNS_KEY, JSON.stringify(keys))
    } catch {
      /* private browsing — the choice just will not persist */
    }
  }

  function toggleColumn(key: string) {
    const next = activeKeys.includes(key)
      ? activeKeys.filter((k) => k !== key)
      : columns.map((c) => c.key).filter((k) => activeKeys.includes(k) || k === key)
    setColumns(next)
  }

  /**
   * One row per student, one column per ticked field. This is the sheet the
   * organisers work from on the day, so it opens straight into Excel.
   */
  function exportCsv() {
    const active = columns.filter((c) => activeKeys.includes(c.key))
    if (active.length === 0) return

    const flat = filtered.map((r) => {
      const row: Record<string, unknown> = {}
      for (const col of active) row[col.label] = col.value(r)
      return row
    })

    const track = tracks.find((t) => t.id === trackId)
    const name = track ? track.slug : 'registrations'
    downloadCsv(`utkarsh-${name}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(flat))
  }

  const dueCount = filtered.filter((r) => r.payment_status !== 'paid').length

  if (loading && rows.length === 0) return <LoadingBlock label="Loading registrations…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <AdminHeader
        title="Registrations"
        subtitle={`${filtered.length} of ${rows.length} shown · ${dueCount} with the fee still due`}
        actions={
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={filtered.length === 0 || activeKeys.length === 0}
            icon={<DownloadIcon className="size-4" />}
          >
            Export for Excel
          </Button>
        }
      />

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

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Select value={trackId} onChange={(e) => setTrackId(e.target.value)}>
            <option value="">All competitions</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">Any payment status</option>
            <option value="due">Fee still due</option>
            <option value="paid">Paid</option>
            <option value="awaiting">UPI — waiting to be checked</option>
            <option value="at_venue">Paying at the venue</option>
          </Select>
          <Select value={certificate} onChange={(e) => setCertificate(e.target.value)}>
            <option value="">Any certificate status</option>
            <option value="pending">Certificate not issued</option>
            <option value="done">Certificate issued</option>
          </Select>
        </div>

        {/* Which columns land in the spreadsheet. Collapsed, because most of
            the time the answer is "all of them". */}
        <details className="mt-3 rounded-2xl border border-night-950/10">
          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-bold text-night-950/70 [&::-webkit-details-marker]:hidden">
            Columns in the export — {activeKeys.length} of {columns.length} selected
          </summary>

          <div className="border-t border-night-950/8 px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColumns(columns.map((c) => c.key))}
                className="rounded-lg border border-night-950/12 px-2.5 py-1 text-[12px] font-bold text-night-950/70 transition hover:bg-night-950/5"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setColumns(ESSENTIAL_COLUMNS)}
                className="rounded-lg border border-night-950/12 px-2.5 py-1 text-[12px] font-bold text-night-950/70 transition hover:bg-night-950/5"
              >
                Just the essentials
              </button>
              <button
                type="button"
                onClick={() =>
                  setColumns([
                    ...ESSENTIAL_COLUMNS,
                    ...columns.filter((c) => c.group === 'Competitions').map((c) => c.key),
                  ])
                }
                className="rounded-lg border border-night-950/12 px-2.5 py-1 text-[12px] font-bold text-night-950/70 transition hover:bg-night-950/5"
              >
                Essentials + competitions
              </button>
            </div>

            <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex cursor-pointer items-center gap-2 text-[13px] text-night-950/75"
                >
                  <input
                    type="checkbox"
                    checked={activeKeys.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="size-4 rounded border-night-950/25 accent-marigold-600"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>

            {activeKeys.length === 0 ? (
              <p className="mt-3 text-[12px] font-semibold text-rose-600">
                Nothing selected — the export button stays disabled until you tick a column.
              </p>
            ) : null}
          </div>
        </details>
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
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">School</th>
                  <th className="px-4 py-3.5">Competitions</th>
                  <th className="px-4 py-3.5">Fee</th>
                  <th className="px-4 py-3.5">Certificate</th>
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
  const paid = r.payment_status === 'paid'
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
          Class {r.class_level} · Group {r.class_group} · {r.guardian_phone}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <span className="font-mono text-[12px] font-bold text-night-950/70">{r.reg_code}</span>
      </td>
      <td className="max-w-[12rem] truncate px-4 py-3.5 text-night-950/70">{r.school_name}</td>
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap gap-1">
          {r.registration_tracks.map((e) => {
            const a = accent(e.track?.accent)
            return (
              <span
                key={e.id}
                title={e.selection_detail?.trim() || e.selection_item?.title || e.track?.name || ''}
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
        {paid ? (
          <Badge tone="success">{formatMoney(r.fee_amount)} paid</Badge>
        ) : r.payment_status === 'awaiting_verification' ? (
          <div className="flex flex-col gap-0.5">
            <Badge tone="info">Checking</Badge>
            <span className="font-mono text-[10px] text-night-950/45">{r.upi_reference}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <Badge tone="danger">{formatMoney(r.fee_amount)} due</Badge>
            {r.payment_method ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-night-950/40">
                {PAYMENT_METHOD_LABEL[r.payment_method]}
              </span>
            ) : null}
          </div>
        )}
      </td>
      <td className="px-4 py-3.5">
        <Badge tone={r.certificate_status === 'pending' ? 'neutral' : 'success'}>
          {CERTIFICATE_LABEL[r.certificate_status]}
        </Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-night-950/45">
        {formatDate(r.created_at)}
      </td>
    </tr>
  )
}
