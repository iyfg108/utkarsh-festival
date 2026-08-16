import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SetupNotice } from '@/components/SetupNotice'
import { FestivalProvider } from '@/context/FestivalContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { SiteLayout } from '@/components/site/SiteLayout'
import { LoadingBlock } from '@/components/ui/Primitives'

// The landing pages a student hits first stay in the main bundle.
import Home from '@/pages/Home'
import Competitions from '@/pages/Competitions'
import CompetitionDetail from '@/pages/CompetitionDetail'
import NotFound from '@/pages/NotFound'

// Everything else loads on demand, so the first paint on a phone stays light.
const Faq = lazy(() => import('@/pages/Faq'))
const Contact = lazy(() => import('@/pages/Contact'))
const Register = lazy(() => import('@/pages/Register'))
const RegisterSuccess = lazy(() => import('@/pages/RegisterSuccess'))
const Status = lazy(() => import('@/pages/Status'))

// The admin portal is its own bundle — students never download it.
const AdminApp = lazy(() => import('@/pages/admin/AdminApp'))

export default function App() {
  if (!isSupabaseConfigured) return <SetupNotice />

  return (
    <ToastProvider>
      <AuthProvider>
        <FestivalProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<Home />} />
              <Route path="competitions" element={<Competitions />} />
              <Route path="competitions/:slug" element={<CompetitionDetail />} />
              {/* The gallery is switched off for 2026 — nothing worth showing
                  yet, and the placeholder tiles read as broken. Kept as a
                  redirect so any link already shared still lands somewhere. */}
              <Route path="gallery" element={<Navigate to="/" replace />} />
              <Route path="faq" element={<Faq />} />
              <Route path="contact" element={<Contact />} />
              <Route path="register" element={<Register />} />
              <Route path="register/success" element={<RegisterSuccess />} />
              <Route path="status" element={<Status />} />

              {/* Older links from the first version of the site. */}
              <Route path="tracks" element={<Navigate to="/competitions" replace />} />
              <Route path="tracks/:slug" element={<Navigate to="/competitions" replace />} />
              <Route path="about" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<LoadingBlock label="Opening the organiser portal…" />}>
                  <AdminApp />
                </Suspense>
              }
            />
          </Routes>
        </FestivalProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
