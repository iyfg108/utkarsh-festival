import { ButtonLink } from '@/components/ui/Button'
import { Lotus, Rangoli, SoftGlow } from '@/components/Decor'
import { ArrowRightIcon } from '@/components/Icons'

export default function NotFound() {
  return (
    <section className="relative isolate grid min-h-[70vh] place-items-center px-4 py-20">
      <SoftGlow />
      <Rangoli
        className="absolute left-1/2 top-1/2 -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 text-marigold-300/25"
        petals={14}
      />

      <div className="relative flex flex-col items-center text-center">
        <Lotus className="size-20 text-marigold-400" />

        <p className="mt-6 font-display text-6xl font-black text-gradient-festival sm:text-8xl">
          404
        </p>
        <h1 className="mt-3 text-2xl font-black text-night-950 sm:text-4xl">
          This page wandered off to Vrindavan
        </h1>
        <p className="mt-3.5 max-w-md text-base leading-relaxed text-night-950/65 sm:text-lg">
          We could not find what you were looking for. Let us get you back to the festival.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
            Back to home
          </ButtonLink>
          <ButtonLink to="/competitions" size="lg" variant="outline">
            Browse competitions
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
