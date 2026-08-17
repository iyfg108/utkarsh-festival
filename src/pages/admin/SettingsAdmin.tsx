import { useEffect, useState } from 'react'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import { logAudit, saveSetting } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { formatLongDate, formatMoney } from '@/lib/utils'
import type {
  ContactSettings,
  EventSettings,
  PaymentSettings,
  RegistrationSettings,
} from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Toggle } from '@/components/ui/Form'
import { LoadingBlock } from '@/components/ui/Primitives'
import { CalendarIcon, MailIcon, QrIcon, SettingsIcon } from '@/components/Icons'

export default function SettingsAdmin() {
  const { settings, loading, reload, onlineTracks, onsiteTracks } = useFestival()
  const toast = useToast()

  const [registration, setRegistration] = useState<RegistrationSettings | null>(null)
  const [event, setEvent] = useState<EventSettings | null>(null)
  const [contact, setContact] = useState<ContactSettings | null>(null)
  const [payment, setPayment] = useState<PaymentSettings | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setRegistration(settings.registration)
    setEvent(settings.event)
    setContact(settings.contact)
    setPayment(settings.payment)
  }, [settings])

  if (loading || !registration || !event || !contact || !payment) return <LoadingBlock />

  async function save(key: string, value: unknown) {
    setSaving(key)
    try {
      await saveSetting(key, value)
      await logAudit('update', 'settings', key, value)
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <AdminHeader
        title="Settings"
        subtitle="The switches that change what the public site says and does."
      />

      <div className="space-y-5">
        {/* registration */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-marigold-400 to-marigold-600 text-white">
              <SettingsIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-night-950">Registration &amp; fee</h2>
              <p className="text-[13px] text-night-950/50">Whether students can sign up right now.</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-night-950/8 p-4">
            <Toggle
              checked={registration.open}
              label="Registration open"
              onChange={(v) => setRegistration({ ...registration, open: v })}
            />
            <div>
              <p className="text-sm font-bold text-night-950">
                {registration.open ? 'Registration is OPEN' : 'Registration is CLOSED'}
              </p>
              <p className="text-[13px] text-night-950/55">
                {registration.open
                  ? 'Students can submit the form. The database refuses submissions when this is off.'
                  : 'The form is hidden and any submission is refused server-side.'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Fee per competition (₹)"
              type="number"
              min={0}
              value={registration.fee}
              onChange={(e) => setRegistration({ ...registration, fee: Number(e.target.value) })}
              hint={`Charged for EACH competition entered — a student entering three pays ${formatMoney(
                (registration.fee || 0) * 3,
              )}.`}
            />
            <Input
              label="Registration closes on"
              type="date"
              value={registration.closes_at ?? ''}
              onChange={(e) =>
                setRegistration({ ...registration, closes_at: e.target.value || null })
              }
              hint="Shown to students. Does not close it automatically — use the switch."
            />
          </div>

          <div className="mt-4 rounded-2xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-[13px] leading-relaxed text-marigold-900">
            Changing the fee only affects new registrations. Anyone who already registered keeps
            the amount they were quoted.
          </div>

          <Button
            className="mt-5"
            loading={saving === 'registration'}
            onClick={() => save('registration', registration)}
          >
            Save registration settings
          </Button>
        </section>

        {/* event */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-peacock-400 to-peacock-600 text-white">
              <CalendarIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-night-950">The two days</h2>
              <p className="text-[13px] text-night-950/50">
                Shown across the site and used for the countdown.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="First day"
              type="date"
              value={event.online_date}
              onChange={(e) => setEvent({ ...event, online_date: e.target.value })}
              hint={
                onlineTracks.length > 0
                  ? onlineTracks.map((t) => t.name).join(', ')
                  : 'No competitions on this date yet.'
              }
            />
            <Input
              label="Second day"
              type="date"
              value={event.onsite_date}
              onChange={(e) => setEvent({ ...event, onsite_date: e.target.value })}
              hint={
                onsiteTracks.length > 0
                  ? onsiteTracks.map((t) => t.name).join(', ')
                  : 'No competitions on this date yet.'
              }
            />
          </div>

          <div className="mt-4 rounded-2xl border border-peacock-200 bg-peacock-50 px-4 py-3 text-[13px] leading-relaxed text-peacock-900">
            These dates are for display. Each competition carries its own date in the database — if
            you move a day, update the competitions too so the two agree.
            {event.online_date ? (
              <>
                {' '}
                Countdown currently targets <strong>{formatLongDate(event.online_date)}</strong>.
              </>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Edition"
              value={event.edition}
              onChange={(e) => setEvent({ ...event, edition: e.target.value })}
              placeholder="2026"
            />
            <Input
              label="Venue"
              value={event.venue}
              onChange={(e) => setEvent({ ...event, venue: e.target.value })}
            />
            <Input
              label="City"
              value={event.city}
              onChange={(e) => setEvent({ ...event, city: e.target.value })}
            />
            <Input
              label="Map link"
              value={event.venue_map_url ?? ''}
              onChange={(e) => setEvent({ ...event, venue_map_url: e.target.value })}
              placeholder="https://maps.google.com/?q=…"
            />
          </div>

          <Button className="mt-5" loading={saving === 'event'} onClick={() => save('event', event)}>
            Save event settings
          </Button>
        </section>

        {/* payment */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
              <QrIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-night-950">How students pay</h2>
              <p className="text-[13px] text-night-950/50">
                Switch methods on and off without a redeploy.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <MethodRow
              on={payment.methods.upi_manual}
              onChange={(v) =>
                setPayment({ ...payment, methods: { ...payment.methods, upi_manual: v } })
              }
              title="UPI"
              body="Student pays to your UPI ID, then reports the reference number. You confirm it against the bank statement in Verify payments. No gateway, no fees."
            />
            <MethodRow
              on={payment.methods.pay_at_venue}
              onChange={(v) =>
                setPayment({ ...payment, methods: { ...payment.methods, pay_at_venue: v } })
              }
              title="Cash at the temple"
              body="Only offered to students who entered at least one competition held at the temple. Collect it on the day from the day sheet."
            />
            <MethodRow
              on={payment.methods.razorpay}
              onChange={(v) =>
                setPayment({ ...payment, methods: { ...payment.methods, razorpay: v } })
              }
              title="Card & net banking (Razorpay)"
              body="Only switch this on once your Razorpay keys are deployed — see supabase/PAYMENTS.md. Students will see a broken checkout otherwise."
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="UPI ID"
              value={payment.upi_id}
              onChange={(e) => setPayment({ ...payment, upi_id: e.target.value.trim() })}
              placeholder="iyfguwahati@sbi"
              hint="Money goes straight here. Check it character by character."
            />
            <Input
              label="Payee name"
              value={payment.upi_name}
              onChange={(e) => setPayment({ ...payment, upi_name: e.target.value })}
              placeholder="ISKCON Guwahati"
              hint="What the student sees in their UPI app."
            />
          </div>

          {payment.methods.upi_manual && !payment.upi_id.trim() ? (
            <p className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-800">
              UPI is switched on but no UPI ID is set — students will be told to contact you
              instead of being shown a QR code.
            </p>
          ) : null}

          {!payment.methods.upi_manual &&
          !payment.methods.pay_at_venue &&
          !payment.methods.razorpay ? (
            <p className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-800">
              Every payment method is switched off. Nobody can complete a registration.
            </p>
          ) : null}

          <Button
            className="mt-5"
            loading={saving === 'payment'}
            onClick={() => save('payment', payment)}
          >
            Save payment settings
          </Button>
        </section>

        {/* contact */}
        <section className="rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-rose-festival-400 to-fuchsia-600 text-white">
              <MailIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-night-950">Contact details</h2>
              <p className="text-[13px] text-night-950/50">
                Shown in the footer and on the contact page.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            />
            <Input
              label="WhatsApp"
              value={contact.whatsapp ?? ''}
              onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
              hint="With country code, e.g. +91 98640 00000"
            />
            <Input
              label="Instagram"
              value={contact.instagram ?? ''}
              onChange={(e) => setContact({ ...contact, instagram: e.target.value })}
              placeholder="https://instagram.com/…"
            />
          </div>

          <Button
            className="mt-5"
            loading={saving === 'contact'}
            onClick={() => save('contact', contact)}
          >
            Save contact details
          </Button>
        </section>
      </div>
    </>
  )
}

function MethodRow({
  on,
  onChange,
  title,
  body,
}: {
  on: boolean
  onChange: (next: boolean) => void
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border-2 border-night-950/8 p-4">
      <div className="pt-0.5">
        <Toggle checked={on} onChange={onChange} label={title} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-night-950">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-night-950/60">{body}</p>
      </div>
    </div>
  )
}
