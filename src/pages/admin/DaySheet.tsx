import { useMemo, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  fetchRegistrations,
  logAudit,
  markPaidAtVenue,
  setAttendance,
  setCertificateStatus,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatLongDate, formatMoney } from '@/lib/utils'
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
import { CheckIcon, ClipboardIcon, DownloadIcon, SearchIcon } from '@/components/Icons'

type DayFilter = 'all' | 'online' | 'onsite'
type PayFilter = 'all' | 'due' | 'paid'

export default function DaySheet() {
  const { settings } = useFestival()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])

  const [day, setDay] = useState<DayFilter>('onsite')
  const [pay, setPay] = useState<PayFilter>('all')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const event = settings?.event
  const rows = data ?? []

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (day !== 'all') {
          const has = r.registration_tracks.some((e) => e.track?.mode === day)
          if (!has) return false
        }
        if (pay === 'due' && r.payment_status === 'paid') return false
        if (pay === 'paid' && r.payment_status !== 'paid') return false
        if (needle) {
          const hay = `${r.full_name} ${r.reg_code} ${r.school_name} ${r.guardian_phone}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [rows, day, pay, q])

  const totals = useMemo(() => {
    // Cash to collect at the desk excludes anyone who has already paid by UPI
    // and is only waiting on our own verification.
    const due = filtered.filter(
      (r) => r.payment_status !== 'paid' && r.payment_status !== 'awaiting_verification',
    )
    return {
      count: filtered.length,
      due: due.length,
      dueAmount: due.reduce((sum, r) => sum + r.fee_amount, 0),
      certified: filtered.filter((r) => r.certificate_status !== 'pending').length,
    }
  }, [filtered])

  async function collect(r: RegistrationRow) {
    setBusy(r.id)
    try {
      await markPaidAtVenue(r.id)
      await logAudit('payment.collected', 'registration', r.id, { amount: r.fee_amount })
      toast.success(`${formatMoney(r.fee_amount)} recorded for ${r.full_name}.`)
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(null)
    }
  }

  async function handOver(r: RegistrationRow) {
    setBusy(r.id)
    try {
      await setCertificateStatus([r.id], 'collected')
      await setAttendance([r.id], true)
      await logAudit('certificate.collected', 'registration', r.id, null)
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(null)
    }
  }

  function exportSheet() {
    const header = ['Name', 'Code', 'Class', 'Group', 'School', 'Phone', 'Competitions', 'Fee', 'Paid', 'Certificate']
    const lines = filtered.map((r) => [
      r.full_name,
      r.reg_code,
      r.class_level,
      r.class_group,
      r.school_name,
      r.guardian_phone,
      r.registration_tracks.map((e) => e.track?.name).join(' / '),
      r.fee_amount,
      r.payment_status === 'paid' ? 'YES' : 'NO',
      r.certificate_status === 'pending' ? '' : r.certificate_status,
    ])
    const csv = [header, ...lines]
      .map((row) =>
        row
          .map((v) => {
            const s = String(v ?? '')
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
          })
          .join(','),
      )
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `utkarsh-day-sheet-${day}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && rows.length === 0) return <LoadingBlock label="Loading the day sheet…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const dayDate =
    day === 'online' ? event?.online_date : day === 'onsite' ? event?.onsite_date : null

  return (
    <>
      <AdminHeader
        title="Day sheet"
        subtitle="The list to print and carry to the desk — who has paid, who still owes, and who has taken their certificate."
        actions={
          <>
            <Button variant="outline" onClick={exportSheet} icon={<DownloadIcon className="size-4" />}>
              Export CSV
            </Button>
            <Button onClick={() => window.print()} icon={<ClipboardIcon className="size-4" />}>
              Print
            </Button>
          </>
        }
      />

      {/* filters — hidden when printing */}
      <div className="mb-5 grid gap-3 rounded-3xl border border-night-950/8 bg-white p-4 stack-shadow sm:grid-cols-3 no-print">
        <Select label="Which day" value={day} onChange={(e) => setDay(e.target.value as DayFilter)}>
          <option value="onsite">
            At the temple{event?.onsite_date ? ` · ${formatLongDate(event.onsite_date)}` : ''}
          </option>
          <option value="online">
            Online{event?.online_date ? ` · ${formatLongDate(event.online_date)}` : ''}
          </option>
          <option value="all">Everyone</option>
        </Select>

        <Select label="Payment" value={pay} onChange={(e) => setPay(e.target.value as PayFilter)}>
          <option value="all">All</option>
          <option value="due">Fee still due</option>
          <option value="paid">Already paid</option>
        </Select>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-night-950">Search</span>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-night-950/35" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, code, school…"
              className="w-full rounded-2xl border-2 border-night-950/10 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
            />
          </div>
        </div>
      </div>

      {/* print header — only visible on paper */}
      <div className="hidden print:mb-4 print:block">
        <h1 className="font-display text-2xl font-black">Utkarsh Heritage Festival — Day sheet</h1>
        <p className="text-sm">
          {day === 'onsite' ? 'At the temple' : day === 'online' ? 'Online' : 'All participants'}
          {dayDate ? ` · ${formatLongDate(dayDate)}` : ''} · {filtered.length} students ·{' '}
          {totals.due} still to pay ({formatMoney(totals.dueAmount)})
        </p>
      </div>

      {/* summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="On this sheet" value={String(totals.count)} />
        <Summary label="Fee still due" value={String(totals.due)} tone="rose" />
        <Summary label="Cash to collect" value={formatMoney(totals.dueAmount)} tone="rose" />
        <Summary label="Certificates given" value={`${totals.certified}/${totals.count}`} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardIcon className="size-12" />}
          title="Nobody matches those filters"
          description="Try widening the day or payment filter."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow print:rounded-none print:border-0 print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm print:min-w-0 print:text-[11px]">
              <thead>
                <tr className="border-b border-night-950/12 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50 print:bg-transparent">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3">School</th>
                  <th className="px-3 py-3">Competitions</th>
                  <th className="px-3 py-3">Fee</th>
                  <th className="px-3 py-3 text-center">Paid</th>
                  <th className="px-3 py-3 text-center">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/8">
                {filtered.map((r) => {
                  const paid = r.payment_status === 'paid'
                  // Reported a UPI reference but nobody has checked it yet —
                  // do NOT ask the desk to take cash from them again.
                  const checking = r.payment_status === 'awaiting_verification'
                  const certified = r.certificate_status !== 'pending'
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'align-top print:break-inside-avoid',
                        !paid && !checking && 'bg-rose-50/60 print:bg-transparent',
                        checking && 'bg-peacock-50/60 print:bg-transparent',
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-night-950">{r.full_name}</p>
                        <p className="text-[11px] text-night-950/50">{r.guardian_phone}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-night-950/70">
                        {r.reg_code}
                      </td>
                      <td className="px-3 py-2.5 text-night-950/70">{r.class_level}</td>
                      <td className="max-w-[11rem] truncate px-3 py-2.5 text-night-950/70">
                        {r.school_name}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-night-950/70">
                        {r.registration_tracks.map((e) => e.track?.name).join(', ')}
                      </td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums text-night-950">
                        {paid ? (
                          <span className="text-night-950/35 line-through">
                            {formatMoney(r.fee_amount)}
                          </span>
                        ) : (
                          formatMoney(r.fee_amount)
                        )}
                      </td>

                      {/* Paid — a tick box on paper, a button on screen */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="hidden print:inline-block print:size-4 print:border print:border-night-950" />
                        <span className="print:hidden">
                          {paid ? (
                            <Badge tone="success">
                              <CheckIcon className="size-3" strokeWidth={3} />
                              Paid
                            </Badge>
                          ) : checking ? (
                            <Badge tone="info">UPI · checking</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={busy === r.id}
                              onClick={() => collect(r)}
                            >
                              Collect {formatMoney(r.fee_amount)}
                            </Button>
                          )}
                        </span>
                      </td>

                      {/* Certificate */}
                      <td className="px-3 py-2.5 text-center">
                        <span className="hidden print:inline-block print:size-4 print:border print:border-night-950" />
                        <span className="print:hidden">
                          {certified ? (
                            <Badge tone="success">Given</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={busy === r.id}
                              onClick={() => handOver(r)}
                            >
                              Mark given
                            </Button>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-[13px] leading-relaxed text-night-950/50 no-print">
        Printing gives you empty tick boxes in the last two columns for marking by hand. On screen
        those become buttons — “Collect” records the cash payment, “Mark given” records the
        certificate and marks the student as present.
      </p>
    </>
  )
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'rose'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'rose' ? 'border-rose-200 bg-rose-50' : 'border-night-950/8 bg-white',
      )}
    >
      <p
        className={cn(
          'font-display text-2xl font-black tabular-nums',
          tone === 'rose' ? 'text-rose-700' : 'text-night-950',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-semibold text-night-950/50">{label}</p>
    </div>
  )
}
