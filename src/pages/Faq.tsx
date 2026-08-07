import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useFestival } from '@/context/FestivalContext'
import { cn, formatLongDate } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { Reveal } from '@/components/ui/Primitives'
import { ButtonLink } from '@/components/ui/Button'
import { ChevronDownIcon } from '@/components/Icons'

export default function Faq() {
  const { settings, tracks } = useFestival()
  const event = settings?.event
  const reg = settings?.registration
  const maxTracks = reg?.max_tracks_per_student ?? 3

  const FAQS: { q: string; a: React.ReactNode }[] = [
    {
      q: 'Who can take part?',
      a: 'Any student from Class 1 to Class 12 studying in a school in and around Guwahati. Students are grouped into three age bands — Junior (Class 1–4), Middle (Class 5–8) and Senior (Class 9–12) — and only compete against others in their own band.',
    },
    {
      q: 'Does it cost anything?',
      a: 'No. Utkarsh is completely free — registration, participation and the certificate. Bring your own materials where a competition asks for them (colours, costume, instrument), and nothing else.',
    },
    {
      q: 'How do the two stages work?',
      a: (
        <>
          <strong>Stage 1</strong> happens inside your own school, so you do not need to travel
          anywhere. Our team, along with your teachers, judges the entries and shortlists the best
          performers from each school. <strong>Stage 2</strong> — the grand finale — is held at{' '}
          {event?.venue ?? 'ISKCON Ulubari'}
          {event?.stage2_date ? ` on ${formatLongDate(event.stage2_date)}` : ''}, on the eve of
          Janmashtami.
        </>
      ),
    },
    {
      q: 'How many competitions can I enter?',
      a: `Up to ${maxTracks} with a single registration. There are ${tracks.length} to choose from, so pick the ones you will genuinely enjoy — spreading yourself thin rarely helps.`,
    },
    {
      q: 'Why does it say a song or sloka is "full"?',
      a: 'So that the audience does not hear the same bhajan eight times in a row. Each song, sloka and fancy-dress character has a limited number of slots — usually two to four. Once those are taken, the option is marked full and you choose another. It is first come, first served, so registering early gives you more choice.',
    },
    {
      q: 'What if my school is not on the list?',
      a: 'Choose "My school is not listed" while registering and type its name — we will add it. If you are a teacher and would like your school to host a Stage 1 round, please get in touch with us directly.',
    },
    {
      q: 'Do I need to be an expert?',
      a: 'Not at all. A large share of our participants are performing for the first time. The judging looks at effort, expression and preparation, not at years of training.',
    },
    {
      q: 'What happens if I am shortlisted?',
      a: 'We contact the number given on your registration form, and your school is informed too. You will get the schedule, your slot time and everything you need to bring for the finale.',
    },
    {
      q: 'Can I change my song or competition after registering?',
      a: 'Yes, before registration closes — write or call us with your registration code and we will make the change, provided the slot you want is still open.',
    },
    {
      q: 'Will there be prizes?',
      a: 'Trophies and medals for the top places in every competition and every age band, and a certificate for every single participant. Prasadam for everyone who attends the finale.',
    },
    {
      q: 'Can parents come to the finale?',
      a: 'Yes, families are very welcome — that is half the atmosphere. The temple hall is open to all on the evening of the finale.',
    },
    {
      q: 'I lost my registration code. What now?',
      a: (
        <>
          Use the{' '}
          <a
            href="/status"
            className="font-semibold text-peacock-700 underline decoration-peacock-300 underline-offset-2"
          >
            Check status
          </a>{' '}
          page with your code and the guardian phone number you registered with. If you have lost
          the code entirely, call us and we will look it up.
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

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 0.03, 0.2)}>
              <FaqItem question={f.q} answer={f.a} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-4xl border border-peacock-200 bg-peacock-50 px-6 py-12 text-center">
            <h2 className="text-2xl font-black text-night-950 sm:text-3xl">
              Still have a question?
            </h2>
            <p className="max-w-md text-[15px] text-night-950/65">
              Call, message on WhatsApp, or send us an email — whichever is easiest for you.
            </p>
            <ButtonLink to="/contact" size="lg" variant="secondary" className="mt-2">
              Contact the organisers
            </ButtonLink>
          </div>
        </Reveal>
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
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[16px] font-bold text-night-950">{question}</span>
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full transition-all duration-300',
            open ? 'rotate-180 bg-marigold-500 text-white' : 'bg-night-950/6 text-night-950/50',
          )}
        >
          <ChevronDownIcon className="size-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-6 text-[15px] leading-relaxed text-night-950/70">{answer}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
