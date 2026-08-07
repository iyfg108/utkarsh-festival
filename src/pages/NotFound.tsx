import { ButtonLink } from '@/components/ui/Button'
import { AuroraBlobs, PeacockFeather, Rangoli } from '@/components/Decor'
import { ArrowRightIcon } from '@/components/Icons'

export default function NotFound() {
  return (
    <section className="relative isolate grid min-h-[70vh] place-items-center overflow-hidden px-4 py-20">
      <AuroraBlobs />
      <Rangoli
        className="absolute left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 text-marigold-300/25 animate-spin-slower"
        petals={20}
      />

      <div className="relative flex flex-col items-center text-center">
        <PeacockFeather className="h-32 w-auto animate-float" />

        <p className="mt-8 font-display text-7xl font-black text-gradient-festival sm:text-8xl">
          404
        </p>
        <h1 className="mt-3 text-3xl font-black text-night-950 sm:text-4xl">
          This page wandered off to Vrindavan
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-night-950/65">
          We could not find what you were looking for. Let us get you back to the festival.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" size="lg" iconRight={<ArrowRightIcon className="size-5" />}>
            Back to home
          </ButtonLink>
          <ButtonLink to="/tracks" size="lg" variant="outline">
            Browse competitions
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
