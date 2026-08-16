import { Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingBlock } from '@/components/ui/Primitives'
import { AdminLayout } from './AdminLayout'
import AdminLogin from './Login'
import Dashboard from './Dashboard'
import Registrations from './Registrations'
import RegistrationDetail from './RegistrationDetail'
import Judging from './Judging'
import Verify from './Verify'
import Messages from './Messages'
import DaySheet from './DaySheet'
import SelectionsAdmin from './SelectionsAdmin'
import SettingsAdmin from './SettingsAdmin'
import UsersAdmin from './UsersAdmin'
import { NoAccess } from './NoAccess'

export default function AdminApp() {
  const { loading, session, isAdmin, isSuperAdmin } = useAuth()

  if (loading) return <LoadingBlock label="Checking your access…" />
  if (!session) return <AdminLogin />
  if (!isAdmin) return <NoAccess />

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="registrations/:id" element={<RegistrationDetail />} />
        <Route path="judging" element={<Judging />} />
        <Route path="verify" element={<Verify />} />
        <Route path="messages" element={<Messages />} />
        <Route path="day-sheet" element={<DaySheet />} />
        <Route path="songs" element={isSuperAdmin ? <SelectionsAdmin /> : <NoAccess inline />} />
        <Route path="settings" element={isSuperAdmin ? <SettingsAdmin /> : <NoAccess inline />} />
        <Route path="users" element={isSuperAdmin ? <UsersAdmin /> : <NoAccess inline />} />
        <Route path="*" element={<NoAccess inline title="Page not found" />} />
      </Route>
    </Routes>
  )
}
