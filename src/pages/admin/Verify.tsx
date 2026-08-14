import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/context/ToastContext'
import {
  confirmUpiPayment,
  fetchRegistrations,
  logAudit,
  rejectUpiPayment,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatDate, formatMoney } from '@/lib/utils'
import type { RegistrationRow } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { CheckIcon, ClipboardIcon, SearchIcon } from '@/components/Icons'

export default function Verify() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => fetchRegistrations(), [])
  const [busy, setBusy] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<RegistrationRow | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const rows = data ?? []

  const queue = useMemo(
    () =>
      rows
        .filter((r) => r.payment_status === 'awaiting_verification')
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at)),
    [rows],
  )

  const totals = useMemo(() => {
    const upi = rows.filter((r) => r.payment_method === 'upi_manual')
    return {
      waiting: queue.length,
      waitingAmount: queue.reduce((n, r) => n + r.fee_amount, 0),
      upiPaid: upi.filter((r) => r.payment_status === 'paid').length,
      upiUnstarted: upi.filter((r) => r.payment_status === 'pending').length,
    }
  }, [rows, queue])

  async function confirm(r: RegistrationRow) {
    setBusy(r.id)
    try {
      await confirmUpiPayment(r.id, `UPI ${r.upi_reference} verified`)
      await logAudit('payment.verified', 'registration', r.id, {
        reference: r.upi_reference,
        amount: r.fee_amount,
      })
      toast.success(`${r.full_name} marked paid.`)
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(null)
    }
  }

  async function reject() {
    if (!rejecting) return
    setBusy(rejecting.id)
    try {
      await rejectUpiPayment(
        rejecting.id,
        rejectNote.trim() || `UPI reference ${rejecting.upi_reference} not found on statement`,
      )
      await logAudit('payment.rejected', 'registration', rejecting.id, {
        reference: rejecting.upi_reference,
        note: rejectNote,
      })
      toast.success(`${rejecting.full_name} sent back to unpaid — they can submit again.`)
      setRejecting(null)
      setRejectNote('')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusy(null)
    }
  }

  async function copyRef(ref: string) {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(ref)
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      /* clipboard blocked — the reference is on screen */
    }
  }

  if (loading && rows.length === 0) return <LoadingBlock label="Loading the queue…" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <AdminHeader
        title="Verify UPI payments"
        subtitle="Students who have paid by UPI and reported a reference number. Match each one against the bank statement, then confirm."
        actions={
          <Button variant="outline" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Waiting to be checked" value={String(totals.waiting)} tone="marigold" />
        <Stat label="Money to confirm" value={formatMoney(totals.waitingAmount)} tone="marigold" />
        <Stat label="UPI confirmed" value={String(totals.upiPaid)} />
        <Stat label="Chose UPI, not yet paid" value={String(totals.upiUnstarted)} />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={<CheckIcon className="size-12" />}
          title="Nothing waiting"
          description="Every reported UPI payment has been checked. New ones appear here as students submit them."
        />
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-peacock-200 bg-peacock-50 px-5 py-4 text-[13px] leading-relaxed text-peacock-900">
            <strong>How to check:</strong> open your bank or UPI statement, search for the
            reference number, and confirm the amount and date match. Confirming records who
            verified it and when. If you cannot find it, reject with a note — the student goes back
            to unpaid and can submit a corrected reference themselves.
          </div>

          <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Reference number</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Reported</th>
                    <th className="px-4 py-3.5 text-right">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-night-950/6">
                  {queue.map((r) => (
                    <tr key={r.id} className="transition hover:bg-cream-50/60">
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/admin/registrations/${r.id}`}
                          className="font-bold text-night-950 hover:text-marigold-700"
                        >
                          {r.full_name}
                        </Link>
                        <p className="text-[12px] text-night-950/45">
                          {r.reg_code} · Class {r.class_level} · {r.guardian_phone}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => r.upi_reference && copyRef(r.upi_reference)}
                          title="Copy, then search your statement for it"
                          className="group inline-flex items-center gap-2 rounded-lg border border-night-950/12 bg-white px-3 py-1.5 font-mono text-[13px] font-bold tracking-wide text-night-950 transition hover:border-peacock-300 hover:bg-peacock-50"
                        >
                          {r.upi_reference}
                          {copied === r.upi_reference ? (
                            <CheckIcon className="size-3.5 text-emerald-600" strokeWidth={3} />
                          ) : (
                            <ClipboardIcon className="size-3.5 opacity-40 group-hover:opacity-80" />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 font-bold tabular-nums text-night-950">
                        {formatMoney(r.fee_amount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-night-950/50">
                        {formatDate(r.updated_at, true)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === r.id}
                            onClick={() => {
                              setRejecting(r)
                              setRejectNote('')
                            }}
                          >
                            Not found
                          </Button>
                          <Button
                            size="sm"
                            loading={busy === r.id}
                            onClick={() => confirm(r)}
                            icon={<CheckIcon className="size-4" strokeWidth={3} />}
                          >
                            Confirm
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-night-950/50">
        <SearchIcon className="mt-0.5 size-4 shrink-0" />
        Tip: most bank apps let you search the statement by the last six digits of the reference.
        Click a reference to copy it.
      </p>

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="Reference not found?"
        description={rejecting ? `${rejecting.full_name} · ${rejecting.upi_reference}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reject} loading={busy === rejecting?.id}>
              Send back as unpaid
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-night-950/70">
          This clears the reference and puts {rejecting?.full_name.split(' ')[0]} back to
          <strong> not paid</strong>, so they can submit a corrected one from the status page. It
          does not delete their registration.
        </p>
        <label className="mt-4 block text-sm font-semibold text-night-950">
          Note (optional)
          <input
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. not on statement for 30 Aug"
            className="mt-1.5 w-full rounded-2xl border-2 border-night-950/10 px-4 py-3 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
          />
        </label>
        <p className="mt-2 text-[13px] text-night-950/55">
          Worth a phone call first — a student typing one digit wrong is far more likely than a
          student inventing a payment.
        </p>
      </Modal>
    </>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'marigold'
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'marigold'
          ? 'border-marigold-300 bg-marigold-50'
          : 'border-night-950/8 bg-white',
      )}
    >
      <p
        className={cn(
          'font-display text-2xl font-black tabular-nums',
          tone === 'marigold' ? 'text-marigold-800' : 'text-night-950',
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-semibold leading-snug text-night-950/50">{label}</p>
    </div>
  )
}
