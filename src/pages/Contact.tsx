import { useFestival } from '@/context/FestivalContext'
import { PageHeader } from '@/components/site/PageHeader'
import { Reveal } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import {
  ArrowRightIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SchoolIcon,
  WhatsAppIcon,
} from '@/components/Icons'
import { Lotus, MarigoldGarland, StarField } from '@/components/Decor'

export default function Contact() {
  const { settings } = useFestival()
  const contact = settings?.contact
  const event = settings?.event

  const channels = [
    contact?.phone && {
      icon: <PhoneIcon className="size-6" />,
      label: 'Call us',
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, '')}`,
      note: 'Best between 10am and 7pm',
      tone: 'from-marigold-400 to-marigold-600',
    },
    contact?.whatsapp && {
      icon: <WhatsAppIcon className="size-6" />,
      label: 'WhatsApp',
      value: contact.whatsapp,
      href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`,
      note: 'Quickest way to reach us',
      tone: 'from-emerald-400 to-emerald-600',
    },
    contact?.email && {
      icon: <MailIcon className="size-6" />,
      label: 'Email',
      value: contact.email,
      href: `mailto:${contact.email}`,
      note: 'For schools and formal enquiries',
      tone: 'from-peacock-400 to-peacock-600',
    },
    contact?.instagram && {
      icon: <InstagramIcon className="size-6" />,
      label: 'Instagram',
      value: 'Follow along',
      href: contact.instagram,
      note: 'Photos and announcements',
      tone: 'from-rose-festival-400 to-fuchsia-600',
    },
  ].filter(Boolean) as {
    icon: React.ReactNode
    label: string
    value: string
    href: string
    note: string
    tone: string
  }[]

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            We would love to <span className="text-gradient-festival">hear from you</span>
          </>
        }
        subtitle="Questions about registering, bringing Utkarsh to your school, or volunteering — all welcome."
      />

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={(i % 2) * 0.08}>
              <a
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                className="group flex h-full items-start gap-4 rounded-3xl border border-night-950/8 bg-white p-6 stack-shadow card-lift"
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 ${c.tone}`}
                >
                  {c.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-night-950/45">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block break-all font-display text-lg font-black text-night-950">
                    {c.value}
                  </span>
                  <span className="mt-1 block text-[13px] text-night-950/55">{c.note}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* venue */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-night px-6 py-14 sm:px-12">
            <StarField count={36} />
            <MarigoldGarland className="absolute inset-x-0 top-0 opacity-80" />

            <div className="relative flex flex-col items-center gap-5 text-center">
              <Lotus className="size-12 text-marigold-300" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
                  Where the finale happens
                </p>
                <h2 className="mt-2 font-display text-3xl font-black text-cream-50 sm:text-4xl">
                  {event?.venue ?? 'ISKCON Ulubari'}
                </h2>
                <p className="mt-1 text-cream-100/60">{event?.city ?? 'Guwahati, Assam'}</p>
              </div>

              {event?.venue_map_url ? (
                <ButtonLink
                  to={event.venue_map_url}
                  external
                  variant="outline"
                  className="mt-2 border-white/25 bg-white/10 text-cream-50 hover:border-marigold-300 hover:bg-white/15"
                  icon={<MapPinIcon className="size-4" />}
                >
                  Get directions
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Reveal>
      </section>

      {/* schools */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid items-center gap-8 rounded-4xl border border-marigold-200 bg-marigold-50/70 px-7 py-10 sm:grid-cols-[auto_1fr] sm:px-10">
            <span className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-marigold-400 to-marigold-600 text-white">
              <SchoolIcon className="size-8" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-night-950">
                Teachers &amp; school coordinators
              </h2>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-night-950/70">
                Hosting a Stage 1 round takes one afternoon and a hall. We bring the judges, the
                certificates and the materials. Write to us with your school name and a contact
                number, and we will call you back with the details.
              </p>
              {contact?.email ? (
                <ButtonLink
                  to={`mailto:${contact.email}?subject=Hosting%20Utkarsh%20Stage%201%20at%20our%20school`}
                  external
                  className="mt-5"
                  iconRight={<ArrowRightIcon className="size-4" />}
                >
                  Email us about hosting
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
