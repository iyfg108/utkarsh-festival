import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useFestival } from '@/context/FestivalContext'
import { friendlyError } from '@/lib/supabase'
import { SiteNav } from './SiteNav'
import { SiteFooter } from './SiteFooter'
import { ErrorState, LoadingBlock } from '@/components/ui/Primitives'

export function SiteLayout() {
  const { settings, loading, error, reload } = useFestival()
  const { pathname } = useLocation()

  // Land at the top on every navigation — but let in-page anchors work.
  useEffect(() => {
    if (window.location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteNav registrationOpen={settings?.registration.open ?? false} />

      <main id="main" className="flex-1 pt-20">
        {loading && !settings ? (
          <LoadingBlock label="Preparing the festival…" />
        ) : error && !settings ? (
          /*
            The catalogue could not be loaded, so there is no page to render.
            This branch used to be missing, which meant a failed or stalled
            first request left the loading block on screen for good — the site
            looked hung rather than broken, and there was nothing to press.
          */
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <ErrorState error={friendlyError(error)} onRetry={reload} />
            <p className="mt-4 text-center text-[13px] leading-relaxed text-night-950/50">
              If this keeps happening, the festival team can still register you by
              phone — the number is on the poster.
            </p>
          </div>
        ) : (
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        )}
      </main>

      {settings ? (
        <SiteFooter event={settings.event} contact={settings.contact} />
      ) : null}
    </div>
  )
}
