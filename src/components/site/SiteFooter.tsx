import { Link } from 'react-router-dom'
import type { ContactSettings, EventSettings } from '@/lib/types'
import {
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@/components/Icons'
import { MarigoldGarland, PeacockFeather, StarField } from '@/components/Decor'

export function SiteFooter({
  event,
  contact,
}: {
  event: EventSettings
  contact: ContactSettings
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-night text-cream-100">
      <StarField count={40} className="opacity-45" />
      <MarigoldGarland className="absolute inset-x-0 -top-3 opacity-90" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <PeacockFeather className="h-12 w-auto" />
              <div>
                <p className="font-display text-2xl font-black text-cream-50">Utkarsh</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-300">
                  Heritage Festival {event.edition}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-100/65">
              A celebration of art, music, drama and scripture for the students of Guwahati —
              held every year on the eve of Sri Krishna Janmashtami.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-marigold-300">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { to: '/tracks', label: 'Competitions' },
                { to: '/about', label: 'About Utkarsh' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/faq', label: 'FAQ' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-cream-100/70 transition hover:text-marigold-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-marigold-300">
              Participate
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="text-cream-100/70 transition hover:text-marigold-300">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/status" className="text-cream-100/70 transition hover:text-marigold-300">
                  Check status
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-cream-100/70 transition hover:text-marigold-300">
                  Bring Utkarsh to my school
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-cream-100/45 transition hover:text-marigold-300">
                  Organiser login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-marigold-300">
              Reach us
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-cream-100/70">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-peacock-300" />
                <span>
                  {event.venue}
                  <br />
                  {event.city}
                </span>
              </li>
              {contact.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-2.5 text-cream-100/70 transition hover:text-marigold-300"
                  >
                    <PhoneIcon className="size-4 shrink-0 text-peacock-300" />
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2.5 break-all text-cream-100/70 transition hover:text-marigold-300"
                  >
                    <MailIcon className="size-4 shrink-0 text-peacock-300" />
                    {contact.email}
                  </a>
                </li>
              ) : null}
            </ul>

            <div className="mt-5 flex gap-2">
              {contact.whatsapp ? (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="WhatsApp"
                  className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-cream-100 transition hover:border-marigold-300 hover:text-marigold-300"
                >
                  <WhatsAppIcon className="size-5" />
                </a>
              ) : null}
              {contact.instagram ? (
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                  className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-cream-100 transition hover:border-marigold-300 hover:text-marigold-300"
                >
                  <InstagramIcon className="size-5" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-7 text-center text-xs text-cream-100/45 sm:flex-row sm:justify-between sm:text-left">
          <p>© {year} Utkarsh Heritage Festival · ISKCON Ulubari, Guwahati</p>
          <p className="font-festive text-sm text-marigold-300/70">
            हरे कृष्ण
          </p>
        </div>
      </div>
    </footer>
  )
}
