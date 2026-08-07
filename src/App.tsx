import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SetupNotice } from '@/components/SetupNotice'
import { FestivalProvider } from '@/context/FestivalContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { SiteLayout } from '@/components/site/SiteLayout'
import { LoadingBlock } from '@/components/ui/Primitives'

// The landing pages a student hits first stay in the main bundle.
import Home from '@/pages/Home'
import Tracks from '@/pages/Tracks'
import TrackDetail from '@/pages/TrackDetail'
import NotFound from '@/pages/NotFound'

// Everything else loads on demand, so the first paint on a phone stays light.
const About = lazy(() => import('@/pages/About'))
const Gallery = lazy(() => import('@/pages/Gallery'))
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
              <Route path="tracks" element={<Tracks />} />
              <Route path="tracks/:slug" element={<TrackDetail />} />
              <Route path="about" element={<About />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="faq" element={<Faq />} />
              <Route path="contact" element={<Contact />} />
              <Route path="register" element={<Register />} />
              <Route path="register/success" element={<RegisterSuccess />} />
              <Route path="status" element={<Status />} />
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
