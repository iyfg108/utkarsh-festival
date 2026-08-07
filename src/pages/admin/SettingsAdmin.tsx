import { useEffect, useState } from 'react'
import { useFestival } from '@/context/FestivalContext'
import { useToast } from '@/context/ToastContext'
import { logAudit, saveSetting } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { formatLongDate } from '@/lib/utils'
import type { ContactSettings, EventSettings, RegistrationSettings } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Toggle } from '@/components/ui/Form'
import { LoadingBlock } from '@/components/ui/Primitives'
import { CalendarIcon, MailIcon, SettingsIcon } from '@/components/Icons'

export default function SettingsAdmin() {
  const { settings, loading, reload } = useFestival()
  const toast = useToast()

  const [registration, setRegistration] = useState<RegistrationSettings | null>(null)
  const [event, setEvent] = useState<EventSettings | null>(null)
  const [contact, setContact] = useState<ContactSettings | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setRegistration(settings.registration)
    setEvent(settings.event)
    setContact(settings.contact)
  }, [settings])

  if (loading || !registration || !event || !contact) return <LoadingBlock />

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
              <h2 className="text-lg font-black text-night-950">Registration</h2>
              <p className="text-[13px] text-night-950/50">
                Whether students can sign up right now.
              </p>
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
                  ? 'Students can submit the form. The database rejects submissions when this is off.'
                  : 'The form is hidden and any submission is refused server-side.'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Maximum competitions per student"
              type="number"
              min={1}
              max={8}
              value={registration.max_tracks_per_student}
              onChange={(e) =>
                setRegistration({
                  ...registration,
                  max_tracks_per_student: Number(e.target.value),
                })
              }
              hint="Enforced in the form and in the database."
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
              <h2 className="text-lg font-black text-night-950">The event</h2>
              <p className="text-[13px] text-night-950/50">
                Dates and venue shown across the site and in the countdown.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Stage 1 label"
              value={event.stage1_label}
              onChange={(e) => setEvent({ ...event, stage1_label: e.target.value })}
            />
            <Input
              label="Stage 1 window"
              value={event.stage1_window}
              onChange={(e) => setEvent({ ...event, stage1_window: e.target.value })}
              placeholder="Mid-August 2026, at your own school"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Stage 2 label"
              value={event.stage2_label}
              onChange={(e) => setEvent({ ...event, stage2_label: e.target.value })}
            />
            <Input
              label="Grand finale date"
              type="date"
              value={event.stage2_date}
              onChange={(e) => setEvent({ ...event, stage2_date: e.target.value })}
              hint={
                event.stage2_date
                  ? `Countdown targets ${formatLongDate(event.stage2_date)}`
                  : 'Drives the countdown on the home page.'
              }
            />
          </div>

          <Textarea
            wrapperClassName="mt-4"
            label="Note about the date"
            value={event.stage2_note ?? ''}
            onChange={(e) => setEvent({ ...event, stage2_note: e.target.value })}
            placeholder="e.g. On the eve of Sri Krishna Janmashtami"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

          <div className="mt-5 rounded-2xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-[13px] leading-relaxed text-marigold-900">
            Janmashtami moves every year with the lunar calendar. Please check the finale date
            against this year's panjika before you publish it.
          </div>

          <Button className="mt-5" loading={saving === 'event'} onClick={() => save('event', event)}>
            Save event settings
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
