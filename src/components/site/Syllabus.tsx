import { accent, cn } from '@/lib/utils'
import type { AccentKey, Syllabus as SyllabusData } from '@/lib/types'
import { ArrowRightIcon } from '@/components/Icons'

const VEDABASE = 'https://vedabase.io/en/library/bg/'

/**
 * What a student has to prepare for a competition — essay topics, or the Gita
 * verses to learn — grouped by class band.
 *
 * One component for both, because the two are the same object with different
 * contents: a labelled band, how much to prepare, and a list. Verses simply
 * carry a citation and a link as well.
 *
 * Bands are labelled by class ("Class 5 to 7") rather than by letter. The
 * festival's own A/B/C groups are coarser — A is Class 1–4 — so a Class 3
 * student told they are "Group B" here and "Group A" at the quiz desk would be
 * right to be confused. Classes never collide.
 */
export function Syllabus({
  data,
  accentKey,
}: {
  data: SyllabusData
  accentKey?: AccentKey | null
}) {
  const a = accent(accentKey)
  const isVerses = data.kind === 'verses'

  return (
    <section id="prepare" className="scroll-mt-24">
      <h2 className="font-display text-2xl font-black text-night-950 sm:text-3xl">
        {data.heading}
      </h2>
      {data.lead ? (
        <p className="mt-2 max-w-3xl text-[15px] font-bold leading-relaxed text-night-950">
          {data.lead}
        </p>
      ) : null}
      {data.intro ? (
        <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-night-950/65">
          {data.intro}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {data.groups.map((group) => (
          <div
            key={group.label}
            className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow"
          >
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5',
                a.surface,
                a.border,
              )}
            >
              <h3 className={cn('font-display text-lg font-black', a.text)}>{group.label}</h3>
              {group.note ? (
                <span className="rounded-full border border-night-950/12 bg-white px-3 py-1 text-[12px] font-bold text-night-950/70">
                  {group.note}
                </span>
              ) : null}
            </div>

            {isVerses ? (
              <ul className="divide-y divide-night-950/6">
                {group.items.map((item, i) => (
                  <li key={item.ref ?? i} className="px-5 py-4">
                    {item.ref ? (
                      item.path ? (
                        <a
                          href={`${VEDABASE}${item.path}/`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={cn(
                            'inline-flex items-center gap-1.5 font-display text-sm font-black underline decoration-2 underline-offset-4 transition hover:opacity-70',
                            a.text,
                          )}
                        >
                          {item.ref}
                          <ArrowRightIcon className="size-3.5 -rotate-45" />
                        </a>
                      ) : (
                        <span className={cn('font-display text-sm font-black', a.text)}>
                          {item.ref}
                        </span>
                      )
                    ) : null}

                    {/* Sanskrit line breaks are meaningful, so they are kept. */}
                    <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-[1.9] text-night-950">
                      {item.text}
                    </p>

                    {item.gist ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-night-950/60">
                        {item.gist}
                      </p>
                    ) : null}

                    {item.note ? (
                      <p className="mt-2 rounded-xl bg-cream-50 px-3 py-2 text-[12px] leading-relaxed text-night-950/55">
                        {item.note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="divide-y divide-night-950/6">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-3 px-5 py-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-night-950/6 text-[12px] font-black text-night-950/50">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold leading-snug text-night-950">
                        {item.text}
                      </p>
                      {item.note ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-night-950/55">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      {isVerses ? (
        <p className="mt-4 text-[13px] leading-relaxed text-night-950/50">
          The Sanskrit above is written the simple way, without accent marks, so it is easy to
          read and say. Tap a verse number for the Devanagari, word-by-word meanings and the full
          translation on Vedabase.
        </p>
      ) : null}
    </section>
  )
}
