import { useMemo, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import {
  fetchMessageLog,
  fetchRegistrations,
  logWhatsAppSent,
  sendEmails,
  unlogMessage,
} from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatLongDate, formatMoney, formatTime, formatTimeRange } from '@/lib/utils'
import {
  SEGMENTS,
  TEMPLATES,
  renderTemplate,
  type SegmentKey,
} from '@/lib/messageTemplates'
import type { RegistrationRow } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
} from '@/components/ui/Primitives'
import {
  CheckIcon,
  MailIcon,
  SearchIcon,
  WhatsAppIcon,
} from '@/components/Icons'

const EMAIL_BATCH = 40

export default function Messages() {
  const { settings, tracks } = useFestival()
  const toast = useToast()
  const regs = useAsync(() => fetchRegistrations(), [])
  const log = useAsync(() => fetchMessageLog(), [])

  const [templateKey, setTemplateKey] = useState(TEMPLATES[0].key)
  const [segment, setSegment] = useState<SegmentKey>(TEMPLATES[0].segment)
  const [subject, setSubject] = useState(TEMPLATES[0].subject)
  const [body, setBody] = useState(TEMPLATES[0].body)
  const [waBody, setWaBody] = useState(TEMPLATES[0].whatsapp)
  const [link, setLink] = useState('')
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email')
  const [q, setQ] = useState('')
  /** '' = every competition. Otherwise only students who entered this one. */
  const [trackId, setTrackId] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [skipDone, setSkipDone] = useState(true)

  const event = settings?.event
  const rows = regs.data ?? []
  const template = TEMPLATES.find((t) => t.key === templateKey) ?? TEMPLATES[0]

  const selectedTrack = tracks.find((t) => t.id === trackId) ?? null

  /** Event-level merge values, the same for every student. */
  const sharedFields = useMemo(
    () => ({
      online_date: event?.online_date ? formatLongDate(event.online_date) : '',
      venue_date: event?.onsite_date ? formatLongDate(event.onsite_date) : '',
      venue: event?.venue ?? '',
      upi_id: settings?.payment.upi_id ?? '',
      link,
      /*
        Only meaningful once a single competition is chosen. Left blank
        otherwise, which renders as nothing rather than as a stray
        placeholder — see renderTemplate.
      */
      competition: selectedTrack?.name ?? '',
      competition_date: selectedTrack?.event_date
        ? formatLongDate(selectedTrack.event_date)
        : '',
      competition_time:
        formatTimeRange(selectedTrack?.start_time, selectedTrack?.end_time) ?? '',
      report_time: formatTime(selectedTrack?.reporting_time) ?? '',
    }),
    [event, settings, link, selectedTrack],
  )

  function pickTemplate(key: string) {
    const t = TEMPLATES.find((x) => x.key === key)
    if (!t) return
    setTemplateKey(key)
    setSegment(t.segment)
    setSubject(t.subject)
    setBody(t.body)
    setWaBody(t.whatsapp)
  }

  /** Who has already had this exact message on this channel. */
  const alreadySent = useMemo(() => {
    const set = new Set<string>()
    for (const m of log.data ?? []) {
      if (m.status === 'sent' && m.template === templateKey && m.channel === channel) {
        set.add(m.registration_id)
      }
    }
    return set
  }, [log.data, templateKey, channel])

  const firstDay = settings?.event.online_date ?? null
  const secondDay = settings?.event.onsite_date ?? null

  const inSegment = useMemo(() => {
    return rows.filter((r) => {
      if (r.status !== 'confirmed') return false

      switch (segment) {
        case 'unpaid':
          // Someone awaiting our verification has paid — chasing them is rude.
          if (r.payment_status === 'paid' || r.payment_status === 'awaiting_verification')
            return false
          break
        // Split by DATE, not by mode: every competition is at the temple
        // now, so mode no longer tells the two days apart.
        case 'online_day':
          if (!r.registration_tracks.some((e) => e.track?.event_date === firstDay)) return false
          break
        case 'venue_day':
          if (!r.registration_tracks.some((e) => e.track?.event_date === secondDay)) return false
          break
        case 'certificate_pending':
          if (r.certificate_status !== 'pending') return false
          break
        case 'everyone':
          break
      }

      // One competition at a time: "Gita Shloka" should show the students who
      // entered Gita Shloka and nobody else, so the message can name it.
      if (trackId && !r.registration_tracks.some((e) => e.track_id === trackId)) return false

      if (q.trim()) {
        const hay = `${r.full_name} ${r.reg_code} ${r.school_name}`.toLowerCase()
        if (!hay.includes(q.trim().toLowerCase())) return false
      }
      return true
    })
  }, [rows, segment, q, trackId, firstDay, secondDay])

  /** Reachable on the chosen channel, and not already done (if skipping). */
  const targets = useMemo(() => {
    return inSegment.filter((r) => {
      const reachable = channel === 'email' ? Boolean(r.email?.trim()) : Boolean(r.whatsapp?.trim())
      if (!reachable) return false
      if (skipDone && alreadySent.has(r.id)) return false
      return true
    })
  }, [inSegment, channel, skipDone, alreadySent])

  const unreachable = inSegment.length - inSegment.filter((r) =>
    channel === 'email' ? Boolean(r.email?.trim()) : Boolean(r.whatsapp?.trim()),
  ).length

  const needsLink = /\{\{\s*link\s*\}\}/.test(channel === 'email' ? body : waBody)

  /* ------------------------------------------------------------- sending */

  async function sendAllEmail() {
    if (targets.length === 0) return
    if (needsLink && !link.trim()) {
      toast.error('This message contains a link placeholder — fill in the Link field first.')
      return
    }

    setSending(true)
    setProgress({ done: 0, total: targets.length })

    let sent = 0
    let failed = 0

    try {
      // Batched so a long list cannot hit the function timeout, and so the
      // organiser sees it moving rather than staring at a spinner.
      for (let i = 0; i < targets.length; i += EMAIL_BATCH) {
        const slice = targets.slice(i, i + EMAIL_BATCH)
        const result = await sendEmails({
          registration_ids: slice.map((r) => r.id),
          template: templateKey,
          subject,
          body,
          fields: sharedFields,
        })
        sent += result.sent
        failed += result.failed
        setProgress({ done: Math.min(i + slice.length, targets.length), total: targets.length })
      }

      if (failed > 0) {
        toast.error(`${sent} sent, ${failed} failed. Open the log below to see why.`)
      } else {
        toast.success(`${sent} ${sent === 1 ? 'email' : 'emails'} sent.`)
      }
      log.reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSending(false)
      setProgress(null)
    }
  }

  function waLink(r: RegistrationRow): string {
    const number = (r.whatsapp ?? '').replace(/\D/g, '')
    // Indian numbers are usually stored without the country code.
    const full = number.length === 10 ? `91${number}` : number
    const text = renderTemplate(waBody, {
      ...sharedFields,
      name: r.full_name,
      first_name: r.full_name.trim().split(/\s+/)[0],
      code: r.reg_code,
      amount: `₹${r.fee_amount}`,
      competitions: r.registration_tracks.map((e) => e.track?.name).filter(Boolean).join(', '),
    })
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
  }

  async function markWaSent(r: RegistrationRow) {
    try {
      await logWhatsAppSent(r.id, templateKey, r.whatsapp ?? '')
      log.reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  async function undoWaSent(r: RegistrationRow) {
    try {
      await unlogMessage(r.id, 'whatsapp', templateKey)
      log.reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  if (regs.loading && rows.length === 0) return <LoadingBlock label="Loading students…" />
  if (regs.error) return <ErrorState error={regs.error} onRetry={regs.reload} />

  const preview = renderTemplate(channel === 'email' ? body : waBody, {
    ...sharedFields,
    name: 'Aarav Sharma',
    first_name: 'Aarav',
    code: 'UTK26-1042',
    amount: formatMoney((settings?.registration.fee ?? 99) * 2),
    competitions: 'Vedic Quiz, Vedic Art',
  })

  return (
    <>
      <AdminHeader
        title="Messages"
        subtitle="Reminders and certificates, by email in bulk or WhatsApp one by one."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* ------------------------------------------------ compose */}
        <div className="space-y-5">
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Message"
                value={templateKey}
                onChange={(e) => pickTemplate(e.target.value)}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Send to"
                value={segment}
                onChange={(e) => setSegment(e.target.value as SegmentKey)}
                hint={SEGMENTS.find((s) => s.key === segment)?.description}
              >
                {SEGMENTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Select
                label="Competition"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                hint={
                  selectedTrack
                    ? `Only students entered in ${selectedTrack.name}. {{competition}} and its date, time and report time are available in the message.`
                    : 'Every competition. Narrow to one to write a message about it.'
                }
              >
                <option value="">All competitions</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            {template.hint ? (
              <p className="mt-4 rounded-2xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-[13px] text-marigold-900">
                {template.hint}
              </p>
            ) : null}

            {/* channel */}
            <div className="mt-5 flex gap-2">
              {(
                [
                  ['email', 'Email', <MailIcon key="m" className="size-4" />],
                  ['whatsapp', 'WhatsApp', <WhatsAppIcon key="w" className="size-4" />],
                ] as const
              ).map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChannel(key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition',
                    channel === key
                      ? 'border-marigold-500 bg-marigold-500 text-white'
                      : 'border-night-950/12 bg-white text-night-950/65 hover:border-night-950/25',
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {needsLink ? (
              <Input
                wrapperClassName="mt-5"
                label="Link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://forms.gle/… or the certificate folder"
                hint="Replaces {{link}} in the message."
                error={!link.trim() ? 'This message needs a link.' : undefined}
              />
            ) : null}

            {channel === 'email' ? (
              <>
                <Input
                  wrapperClassName="mt-5"
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <Textarea
                  wrapperClassName="mt-4"
                  label="Message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-mono text-[13px]"
                />
              </>
            ) : (
              <Textarea
                wrapperClassName="mt-5"
                label="WhatsApp message"
                value={waBody}
                onChange={(e) => setWaBody(e.target.value)}
                rows={9}
                className="font-mono text-[13px]"
                hint="Keep it short — long WhatsApp messages get collapsed behind “Read more”."
              />
            )}

            <p className="mt-3 text-[12px] leading-relaxed text-night-950/50">
              Merge fields:{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{first_name}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{name}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{code}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{competitions}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{amount}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{online_date}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{venue_date}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{venue}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{upi_id}}'}</code>{' '}
              <code className="rounded bg-night-950/6 px-1">{'{{link}}'}</code>
            </p>
          </section>

          {/* preview */}
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-night-950/45">
              Preview — as Aarav Sharma would see it
            </h2>
            <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-cream-100/70 p-4 text-[14px] leading-relaxed text-night-950">
              {preview}
            </div>
          </section>

          {/* recipients */}
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-night-950">
                {targets.length} {targets.length === 1 ? 'student' : 'students'}
              </h2>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-night-950/65">
                <input
                  type="checkbox"
                  checked={skipDone}
                  onChange={(e) => setSkipDone(e.target.checked)}
                  className="size-4 accent-marigold-500"
                />
                Skip anyone already sent this
              </label>
            </div>

            {unreachable > 0 ? (
              <p className="mt-3 rounded-2xl border border-marigold-200 bg-marigold-50 px-4 py-2.5 text-[13px] text-marigold-900">
                {unreachable} in this group {unreachable === 1 ? 'has' : 'have'} no{' '}
                {channel === 'email' ? 'email address' : 'WhatsApp number'} — try the other channel
                for them.
              </p>
            ) : null}

            <div className="relative mt-4">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-night-950/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by name, code or school…"
                className="w-full rounded-2xl border-2 border-night-950/10 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-peacock-400 focus:ring-4 focus:ring-peacock-400/15"
              />
            </div>

            {/* email: one button for the lot */}
            {channel === 'email' ? (
              <div className="mt-5">
                <Button
                  size="lg"
                  loading={sending}
                  disabled={targets.length === 0}
                  onClick={sendAllEmail}
                  icon={<MailIcon className="size-5" />}
                >
                  {progress
                    ? `Sending ${progress.done} of ${progress.total}…`
                    : `Send to ${targets.length}`}
                </Button>
                <p className="mt-2 text-[12px] text-night-950/50">
                  Sent in batches of {EMAIL_BATCH}. Safe to leave running.
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-peacock-200 bg-peacock-50 px-4 py-3 text-[13px] leading-relaxed text-peacock-900">
                WhatsApp cannot be sent automatically — tapping <strong>Send</strong> is required by
                WhatsApp itself. Work down the list: each button opens WhatsApp with the message
                ready, then tick it off. You can stop and come back, and split the list between
                volunteers.
              </p>
            )}

            {/* the list */}
            {targets.length === 0 ? (
              <EmptyState
                className="mt-5"
                title={
                  inSegment.length === 0
                    ? 'Nobody in this group'
                    : skipDone
                      ? 'Everyone here has already been sent this'
                      : 'Nobody reachable on this channel'
                }
                description={
                  skipDone && inSegment.length > 0
                    ? 'Untick “skip anyone already sent this” to send it again.'
                    : undefined
                }
              />
            ) : (
              <ul className="mt-4 divide-y divide-night-950/6">
                {targets.slice(0, 200).map((r) => {
                  const done = alreadySent.has(r.id)
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-night-950">{r.full_name}</p>
                        <p className="truncate text-[12px] text-night-950/45">
                          {r.reg_code} ·{' '}
                          {channel === 'email' ? r.email : r.whatsapp}
                        </p>
                      </div>

                      {channel === 'whatsapp' ? (
                        done ? (
                          <button
                            type="button"
                            onClick={() => undoWaSent(r)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-700"
                          >
                            <CheckIcon className="size-3.5" strokeWidth={3} />
                            Sent
                          </button>
                        ) : (
                          <div className="flex shrink-0 gap-1.5">
                            <a
                              href={waLink(r)}
                              target="_blank"
                              rel="noreferrer noopener"
                              onClick={() => void markWaSent(r)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[13px] font-bold text-white transition hover:bg-emerald-600"
                            >
                              <WhatsAppIcon className="size-3.5" />
                              Open
                            </a>
                          </div>
                        )
                      ) : done ? (
                        <Badge tone="success">Sent</Badge>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}

            {targets.length > 200 ? (
              <p className="mt-3 text-[12px] text-night-950/45">
                Showing the first 200. Email sends to all {targets.length}.
              </p>
            ) : null}
          </section>
        </div>

        {/* ------------------------------------------------ log */}
        <aside className="space-y-5">
          <section className="rounded-3xl border border-night-950/8 bg-white p-5 stack-shadow">
            <h2 className="text-sm font-bold uppercase tracking-wider text-night-950/45">
              Recently sent
            </h2>
            {log.loading && !log.data ? (
              <p className="mt-4 text-sm text-night-950/45">Loading…</p>
            ) : (log.data ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-night-950/45">Nothing sent yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {(log.data ?? []).slice(0, 25).map((m) => {
                  const student = rows.find((r) => r.id === m.registration_id)
                  return (
                    <li key={m.id} className="flex items-start gap-2.5 text-[13px]">
                      <span
                        className={cn(
                          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg',
                          m.status === 'failed'
                            ? 'bg-rose-100 text-rose-600'
                            : m.channel === 'whatsapp'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-peacock-100 text-peacock-700',
                        )}
                      >
                        {m.channel === 'whatsapp' ? (
                          <WhatsAppIcon className="size-3.5" />
                        ) : (
                          <MailIcon className="size-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-night-950">
                          {student?.full_name ?? m.recipient}
                        </span>
                        <span className="block truncate text-[12px] text-night-950/45">
                          {m.template}
                          {m.status === 'failed' ? ` · failed: ${m.error ?? ''}` : ''}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-peacock-200 bg-peacock-50 p-5">
            <h2 className="font-bold text-peacock-900">Before the first send</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-peacock-900/80">
              Email needs a provider key deployed once —{' '}
              <strong>supabase/MESSAGING.md</strong> walks through it. WhatsApp needs no setup at
              all: it opens the app you are already signed in to.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-peacock-900/80">
              Send one to yourself first. Add your own registration, or filter to your name.
            </p>
          </section>
        </aside>
      </div>
    </>
  )
}
