import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useFestival } from '@/context/FestivalContext'
import { SiteNav } from './SiteNav'
import { SiteFooter } from './SiteFooter'
import { LoadingBlock } from '@/components/ui/Primitives'

export function SiteLayout() {
  const { settings, loading } = useFestival()
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
