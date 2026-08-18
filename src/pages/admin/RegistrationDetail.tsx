import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  deleteRegistration,
  fetchRegistration,
  logAudit,
  markPaidAtVenue,
  setAttendance,
  setCertificateStatus,
  updateEntry,
  updateRegistration,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import {
  CERTIFICATE_LABEL,
  PAYMENT_METHOD_LABEL,
  accent,
  cn,
  formatDate,
  formatLongDate,
  formatMoney,
} from '@/lib/utils'
import type { CertificateStatus, RegStatus } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Select, Toggle } from '@/components/ui/Form'
import { Badge, ErrorState, LoadingBlock, Modal } from '@/components/ui/Primitives'
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  TrackIcon,
  TrophyIcon,
  WhatsAppIcon,
} from '@/components/Icons'

const OUTCOMES = [
  { value: 'registered', label: 'Registered' },
  { value: 'participated', label: 'Participated' },
  { value: 'absent', label: 'Absent' },
  { value: 'winner', label: 'Winner' },
]

export default function RegistrationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { isSuperAdmin } = useAuth()
  const { settings } = useFestival()
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
  const paid = r.payment_status === 'paid'
  const awaiting = r.payment_status === 'awaiting_verification'
  const event = settings?.event

  async function patch(p: Parameters<typeof updateRegistration>[1]) {
    if (!id) return
    setSaving(true)
    try {
      await updateRegistration(id, p)
      await logAudit('update', 'registration', id, p)
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function collectCash() {
    if (!id) return
    setSaving(true)
    try {
      await markPaidAtVenue(id)
      await logAudit('payment.collected', 'registration', id, { amount: r.fee_amount })
      toast.success(`${formatMoney(r.fee_amount)} recorded.`)
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function setCertificate(status: CertificateStatus) {
    if (!id) return
    setSaving(true)
    try {
      await setCertificateStatus([id], status)
      await logAudit('certificate', 'registration', id, { status })
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function patchEntry(entryId: string, p: Parameters<typeof updateEntry>[1]) {
    setSaving(true)
    try {
      await updateEntry(entryId, p)
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

      {/* payment banner */}
      <div
        className={cn(
          'mb-5 flex flex-wrap items-center gap-4 rounded-3xl border-2 p-5',
          paid
            ? 'border-emerald-200 bg-emerald-50'
            : awaiting
              ? 'border-peacock-300 bg-peacock-50'
              : 'border-rose-300 bg-rose-50',
        )}
      >
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-2xl text-white',
            paid ? 'bg-emerald-500' : awaiting ? 'bg-peacock-500' : 'bg-rose-500',
          )}
        >
          {paid ? <CheckIcon className="size-5" strokeWidth={3} /> : <TrophyIcon className="size-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-bold',
              paid ? 'text-emerald-900' : awaiting ? 'text-peacock-900' : 'text-rose-900',
            )}
          >
            {paid
              ? `${formatMoney(r.fee_amount)} paid`
              : `${formatMoney(r.fee_amount)} still due`}
            {r.payment_method ? ` · ${PAYMENT_METHOD_LABEL[r.payment_method]}` : ''}
          </p>
          <p
            className={cn(
              'text-[13px] leading-relaxed',
              paid
                ? 'text-emerald-800/80'
                : awaiting
                  ? 'text-peacock-900/80'
                  : 'text-rose-800/80',
            )}
          >
            {paid
              ? `Recorded ${r.paid_at ? formatDate(r.paid_at, true) : ''}${
                  r.razorpay_payment_id ? ` · ${r.razorpay_payment_id}` : ''
                }${r.upi_reference ? ` · UPI ${r.upi_reference}` : ''}${
                  r.payment_notes ? ` · ${r.payment_notes}` : ''
                }`
              : r.payment_status === 'awaiting_verification'
                ? `Reported UPI reference ${r.upi_reference} — check it against the bank statement, then confirm.`
                : r.payment_method === 'pay_at_venue'
                  ? `Chose to pay at the venue on ${
                      event?.onsite_date ? formatLongDate(event.onsite_date) : 'the day'
                    }.`
                  : r.payment_method === 'upi_manual'
                    ? 'Chose UPI but has not reported a reference number yet.'
                    : 'Started an online payment but did not complete it.'}
          </p>
        </div>

        {!paid ? (
          <Button loading={saving} onClick={collectCash}>
            {awaiting ? 'Confirm payment received' : `Record ${formatMoney(r.fee_amount)} received`}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* entries */}
        <div className="space-y-4">
          {r.registration_tracks.map((e) => {
            const a = accent(e.track?.accent)
            return (
              <section
                key={e.id}
                className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={cn('grid size-11 place-items-center rounded-2xl', a.solid)}>
                      <TrackIcon name={e.track?.icon ?? 'sparkles'} className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-night-950">{e.track?.name}</h2>
                      <p className="text-[13px] text-night-950/55">
                        {e.track?.event_date ? formatLongDate(e.track.event_date) : 'At the temple'}
                        {e.selection_detail?.trim()
                          ? ` · ${e.selection_detail.trim()}${
                              e.selection_item ? ` (${e.selection_item.title})` : ''
                            }`
                          : e.selection_item
                            ? ` · ${e.selection_item.title}`
                            : ''}
                      </p>
                    </div>
                  </div>

                  {e.award ? (
                    <Badge tone="gold">
                      <TrophyIcon className="size-3" />
                      {e.award}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Score"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    defaultValue={e.score ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value
                      const next = v === '' ? null : Number(v)
                      if (next !== e.score) patchEntry(e.id, { score: next })
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
                  <Input
                    label="Prize"
                    placeholder="e.g. First prize"
                    defaultValue={e.award ?? ''}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim() || null
                      if (v !== e.award) patchEntry(e.id, { award: v })
                    }}
                  />
                </div>

                <Input
                  wrapperClassName="mt-4"
                  label="Judge's remarks"
                  placeholder="Optional"
                  defaultValue={e.remarks ?? ''}
                  onBlur={(ev) => {
                    const v = ev.target.value.trim() || null
                    if (v !== e.remarks) patchEntry(e.id, { remarks: v })
                  }}
                />
              </section>
            )
          })}
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">Student</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Class" value={`Class ${r.class_level}`} />
              <Detail label="School" value={r.school_name} />
              <Detail label="Date of birth" value={formatDate(r.date_of_birth)} />
              <Detail label="Gender" value={r.gender} />
            </dl>
          </section>

          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">Contact</h2>
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
              {r.whatsapp ? (
                <Detail
                  label="WhatsApp"
                  value={
                    <a
                      href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
                    >
                      <WhatsAppIcon className="size-4" />
                      {r.whatsapp}
                    </a>
                  }
                />
              ) : null}
              {r.email ? (
                <Detail
                  label="Email"
                  value={
                    <a
                      href={`mailto:${r.email}`}
                      className="inline-flex items-center gap-1.5 break-all text-peacock-700 hover:underline"
                    >
                      <MailIcon className="size-4 shrink-0" />
                      {r.email}
                    </a>
                  }
                />
              ) : null}
              {r.student_phone ? <Detail label="Student phone" value={r.student_phone} /> : null}
              {r.address ? <Detail label="Address" value={r.address} /> : null}
              <Detail label="Media consent" value={r.consent_media ? 'Given' : 'Not given'} />
            </dl>
          </section>

          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">
              On the day
            </h2>

            <div className="mt-4 flex items-center gap-3">
              <Toggle
                checked={r.attended}
                label="Attended"
                onChange={(v) => {
                  if (!id) return
                  setAttendance([id], v).then(reload).catch((err) => toast.error(friendlyError(err)))
                }}
              />
              <span className="text-sm font-semibold text-night-950/60">
                {r.attended ? 'Came to the temple' : 'Not marked present'}
              </span>
            </div>

            <div className="mt-5">
              <Select
                label="Certificate"
                value={r.certificate_status}
                disabled={saving}
                onChange={(e) => setCertificate(e.target.value as CertificateStatus)}
              >
                <option value="pending">Not issued</option>
                <option value="collected">Collected in person</option>
                <option value="emailed">Sent by email</option>
                <option value="whatsapp_sent">Sent on WhatsApp</option>
              </Select>
              {r.certificate_sent_at ? (
                <p className="mt-1.5 text-[12px] text-night-950/45">
                  {CERTIFICATE_LABEL[r.certificate_status]} · {formatDate(r.certificate_sent_at, true)}
                </p>
              ) : null}
            </div>

            <div className="mt-5">
              <Select
                label="Registration status"
                value={r.status}
                disabled={saving}
                onChange={(e) => patch({ status: e.target.value as RegStatus })}
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
          their entries will be removed. Any song slot they were holding is freed up for another
          student.
          {paid ? ' This does NOT refund the payment — do that in Razorpay separately.' : ''}
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
