import { useState } from 'react'
import { useFestival } from '@/context/FestivalContext'
import { cn, formatLongDate, formatMoney } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { Reveal } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import { ChevronDownIcon } from '@/components/Icons'

export default function Faq() {
  const { settings, tracks, onlineTracks, onsiteTracks } = useFestival()
  const event = settings?.event
  const fee = settings?.registration.fee ?? 99

  const onlineDate = event?.online_date ? formatLongDate(event.online_date) : '23 August'
  const onsiteDate = event?.onsite_date ? formatLongDate(event.onsite_date) : '30 August'
  const venue = event?.venue ?? 'ISKCON Guwahati, Ulubari'

  const FAQS: { q: string; a: React.ReactNode }[] = [
    {
      q: 'Who can take part?',
      a: 'Any student from Class 1 to Class 10 studying in and around Guwahati. There are no separate age groups — everyone enters the same competitions.',
    },
    {
      q: 'What does it cost?',
      a: `${formatMoney(fee)} in total, however many competitions you enter. One student, one fee — whether you enter one competition or all ${tracks.length}.`,
    },
    {
      q: 'When and where does it happen?',
      a: (
        <>
          Two days. <strong>{onlineDate}</strong> is the online day —{' '}
          {onlineTracks.map((t) => t.name).join(' and ') || 'the Vedic Quiz'} — which you take part
          in from home. <strong>{onsiteDate}</strong> is the day at {venue}, where{' '}
          {onsiteTracks.map((t) => t.name).join(', ') || 'the remaining competitions'} are held in
          person.
        </>
      ),
    },
    {
      q: 'How do I pay?',
      a: (
        <>
          By UPI when you register — scan the QR or tap through to GPay, PhonePe or Paytm, then
          enter the reference number so we can match your payment. If you have entered at least one
          competition held at the temple, you may instead choose to pay {formatMoney(fee)} in cash
          at the venue on {onsiteDate}. If all your competitions are online there is no venue to pay
          at, so the fee has to be paid online.
        </>
      ),
    },
    {
      q: 'Can I enter more than one competition?',
      a: `Yes — enter as many as you like, including all ${tracks.length}. The fee does not change. Just check that the timings on the day work for you.`,
    },
    {
      q: 'Why does it say a song is "full"?',
      a: 'So the audience does not hear the same bhajan eight times in a row. Each song can be taken by at most 3 students. Once those are gone the song is marked full and you choose another. First come, first served — registering early gives you more choice.',
    },
    {
      q: 'How do I get my certificate?',
      a: (
        <>
          Every participant gets one. Collect it in person at {venue} on {onsiteDate}, along with
          your prizes and prasadam. If you cannot come, we send a digital copy to the email address
          or WhatsApp number on your registration — which is why one of those is required.
        </>
      ),
    },
    {
      q: 'I entered only the online competitions. Can I still come to the temple?',
      a: `Absolutely, and we would love you to. Come on ${onsiteDate} to collect your certificate, take prasadam and watch the other competitions. If you cannot make it, your certificate reaches you online.`,
    },
    {
      q: 'What if I need to change my song or add a competition?',
      a: 'Write or call us with your registration code before registration closes and we will sort it out, provided the slot you want is still open.',
    },
    {
      q: 'Do I need to be an expert?',
      a: 'Not at all. A large share of our participants are taking part for the first time. Judging looks at effort, expression and preparation, not years of training.',
    },
    {
      q: 'Will there be prizes?',
      a: 'Trophies and medals for the top places in every competition, a certificate for every single participant, and prasadam for everyone who comes to the temple.',
    },
    {
      q: 'I lost my registration code.',
      a: (
        <>
          Use the{' '}
          <a
            href="/status"
            className="font-semibold text-peacock-700 underline decoration-peacock-300 underline-offset-2"
          >
            Check status
          </a>{' '}
          page with your code and the guardian phone number you registered with. If the code is
          gone entirely, call us and we will look it up.
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Questions"
        title={
          <>
            Everything you might <span className="text-gradient-festival">want to ask</span>
          </>
        }
        subtitle="And if your question is not here, just call or write — we answer quickly."
      />

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 0.03, 0.18)}>
              <FaqItem question={f.q} answer={f.a} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-4xl border border-peacock-200 bg-peacock-50 px-6 py-11 text-center">
          <h2 className="text-2xl font-black text-night-950 sm:text-3xl">Still have a question?</h2>
          <p className="max-w-md text-[15px] text-night-950/65">
            Call, message on WhatsApp, or send us an email — whichever is easiest.
          </p>
          <ButtonLink to="/contact" size="lg" variant="secondary" className="mt-2">
            Contact the organisers
          </ButtonLink>
        </div>
      </section>
    </>
  )
}

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border-2 bg-white transition-colors',
        open ? 'border-marigold-300' : 'border-night-950/8 hover:border-night-950/15',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span className="text-[15px] font-bold text-night-950 sm:text-base">{question}</span>
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300',
            open ? 'rotate-180 bg-marigold-500 text-white' : 'bg-night-950/6 text-night-950/50',
          )}
        >
          <ChevronDownIcon className="size-4" />
        </span>
      </button>

      {/* Plain conditional render — a height animation on a long list is a
          common source of jank on low-end phones. */}
      {open ? (
        <div className="px-5 pb-5 text-[15px] leading-relaxed text-night-950/70 sm:px-6 sm:pb-6">
          {answer}
        </div>
      ) : null}
    </div>
  )
}
