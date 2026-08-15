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

  /**
   * One row per student, with a column per competition. This is the sheet the
   * organisers actually work from on the day, so it opens straight into Excel
   * with everything needed to verify a payment and hand over a certificate.
   */
  function exportCsv() {
    const flat = filtered.map((r) => {
      const base: Record<string, unknown> = {
        'Registration code': r.reg_code,
        Name: r.full_name,
        Class: r.class_level,
        Group: r.class_group,
        School: r.school_name,
        'Date of birth': formatDate(r.date_of_birth),
        Gender: r.gender,
        Guardian: r.guardian_name,
        'Guardian phone': r.guardian_phone,
        'Student phone': r.student_phone ?? '',
        Email: r.email ?? '',
        WhatsApp: r.whatsapp ?? '',
      }

      // A yes/no column per competition keeps the printed sheet readable.
      for (const t of tracks) {
        const entry = r.registration_tracks.find((e) => e.track_id === t.id)
        base[t.name] = entry ? (entry.selection_item?.title ?? 'Yes') : ''
      }

      base['Fee'] = r.fee_amount
      base['Payment method'] = r.payment_method ? PAYMENT_METHOD_LABEL[r.payment_method] : ''
      base['Paid'] = r.payment_status === 'paid' ? 'YES' : 'NO'
      base['Paid on'] = r.paid_at ? formatDate(r.paid_at, true) : ''
      base['Payment ref'] = r.razorpay_payment_id ?? r.upi_reference ?? ''
      base['Payment status'] = PAYMENT_STATUS_LABEL[r.payment_status]
      base['Payment note'] = r.payment_notes ?? ''
      base['Attended'] = r.attended ? 'YES' : 'NO'
      base['Certificate'] = CERTIFICATE_LABEL[r.certificate_status]
      base['Prizes'] = r.registration_tracks
        .filter((e) => e.award)
        .map((e) => `${e.track?.name}: ${e.award}`)
        .join('; ')
      base['Registered on'] = formatDate(r.created_at)

      return base
    })

    downloadCsv(
      `utkarsh-registrations-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(flat),
    )
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
            disabled={filtered.length === 0}
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
