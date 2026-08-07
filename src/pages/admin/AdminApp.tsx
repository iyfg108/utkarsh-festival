import { Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingBlock } from '@/components/ui/Primitives'
import { AdminLayout } from './AdminLayout'
import AdminLogin from './Login'
import Dashboard from './Dashboard'
import Registrations from './Registrations'
import RegistrationDetail from './RegistrationDetail'
import Shortlist from './Shortlist'
import SelectionsAdmin from './SelectionsAdmin'
import SchoolsAdmin from './SchoolsAdmin'
import ContentAdmin from './ContentAdmin'
import SettingsAdmin from './SettingsAdmin'
import UsersAdmin from './UsersAdmin'
import { NoAccess } from './NoAccess'

export default function AdminApp() {
  const { loading, session, isAdmin, isSuperAdmin } = useAuth()

  if (loading) return <LoadingBlock label="Checking your access…" />
  if (!session) return <AdminLogin />
  // Signed in, but not on the organiser list.
  if (!isAdmin) return <NoAccess />

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="registrations/:id" element={<RegistrationDetail />} />
        <Route path="shortlist" element={<Shortlist />} />
        <Route
          path="selections"
          element={isSuperAdmin ? <SelectionsAdmin /> : <NoAccess inline />}
        />
        <Route path="schools" element={isSuperAdmin ? <SchoolsAdmin /> : <NoAccess inline />} />
        <Route path="content" element={isSuperAdmin ? <ContentAdmin /> : <NoAccess inline />} />
        <Route path="settings" element={isSuperAdmin ? <SettingsAdmin /> : <NoAccess inline />} />
        <Route path="users" element={isSuperAdmin ? <UsersAdmin /> : <NoAccess inline />} />
        <Route path="*" element={<NoAccess inline title="Page not found" />} />
      </Route>
    </Routes>
  )
}
