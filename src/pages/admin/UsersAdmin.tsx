import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { fetchAdminUsers, logAudit, updateAdminUser } from '@/lib/queries'
import { friendlyError } from '@/lib/supabase'
import { cn, formatDate, initials } from '@/lib/utils'
import type { AdminRole, AdminUser } from '@/lib/types'
import { AdminHeader } from './AdminLayout'
import { Button } from '@/components/ui/Button'
import { Select, Toggle } from '@/components/ui/Form'
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Modal,
} from '@/components/ui/Primitives'
import { UsersIcon } from '@/components/Icons'

const ROLES: { value: AdminRole; label: string; blurb: string }[] = [
  {
    value: 'super_admin',
    label: 'Super admin',
    blurb:
      'Everything — settings, the song list, all registrations, payments, and managing these accounts.',
  },
  {
    value: 'judge',
    label: 'Judge',
    blurb:
      'Sees registrations, enters scores and prizes, and works the day sheet. Cannot change settings or the catalogue.',
  },
]

export default function UsersAdmin() {
  const { admin: me } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => fetchAdminUsers(), [])
  const [howTo, setHowTo] = useState(false)

  const rows = data ?? []

  async function patch(user: AdminUser, changes: Partial<AdminUser>) {
    try {
      await updateAdminUser(user.id, changes)
      await logAudit('update', 'admin_user', user.id, changes)
      toast.success('Saved.')
      reload()
    } catch (err) {
      toast.error(friendlyError(err))
    }
  }

  if (loading && rows.length === 0) return <LoadingBlock />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <AdminHeader
        title="Organisers"
        subtitle="Who can sign in to this portal, and what each of them may do."
        actions={<Button onClick={() => setHowTo(true)}>Add an organiser</Button>}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-12" />}
          title="No organiser accounts yet"
          description="Create the account in Supabase Auth, then add a matching row in admin_users."
          action={<Button onClick={() => setHowTo(true)}>Show me how</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-night-950/8 bg-white stack-shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-night-950/8 bg-cream-50/70 text-[11px] font-bold uppercase tracking-wider text-night-950/50">
                  <th className="px-5 py-3.5">Person</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Active</th>
                  <th className="px-4 py-3.5">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-950/6">
                {rows.map((u) => {
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id} className="transition hover:bg-cream-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-peacock-400 to-night-600 text-xs font-black text-white">
                            {initials(u.full_name || u.email)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-night-950">
                              {u.full_name}
                              {isMe ? (
                                <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-marigold-600">
                                  You
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-[12px] text-night-950/50">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Select
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => patch(u, { role: e.target.value as AdminRole })}
                          className="min-w-40 py-2 text-[13px]"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={u.is_active}
                            disabled={isMe}
                            label={`Toggle ${u.full_name}`}
                            onChange={(v) => patch(u, { is_active: v })}
                          />
                          {!u.is_active ? <Badge tone="neutral">Disabled</Badge> : null}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-night-950/45">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ROLES.map((r) => (
          <div
            key={r.value}
            className={cn(
              'rounded-2xl border border-night-950/8 bg-white p-5',
              r.value === 'super_admin' && 'border-marigold-200 bg-marigold-50/50',
            )}
          >
            <p className="font-bold text-night-950">{r.label}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-night-950/60">{r.blurb}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-night-950/50">
        You cannot change your own role or switch yourself off — that stops the last super admin
        locking everyone out by accident.
      </p>

      <Modal
        open={howTo}
        onClose={() => setHowTo(false)}
        title="Adding an organiser"
        description="Two steps, both in the Supabase dashboard."
        size="lg"
        footer={<Button onClick={() => setHowTo(false)}>Got it</Button>}
      >
        <ol className="space-y-5">
          <li className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-marigold-500 text-xs font-black text-white">
              1
            </span>
            <div>
              <p className="font-bold text-night-950">Create the login</p>
              <p className="mt-1 text-sm leading-relaxed text-night-950/65">
                Go to <strong>Authentication → Users → Add user</strong>. Enter their email and a
                temporary password, and tick <em>Auto Confirm User</em>. Copy the new user's UUID.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-marigold-500 text-xs font-black text-white">
              2
            </span>
            <div>
              <p className="font-bold text-night-950">Give them a role</p>
              <p className="mt-1 text-sm leading-relaxed text-night-950/65">
                In the SQL editor, run this with their UUID and details:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-night-950 p-4 font-mono text-[12px] leading-relaxed text-cream-100">
                <code>{`insert into admin_users (id, full_name, email, role)
values (
  'paste-the-uuid-here',
  'Their Name',
  'their@email.com',
  'judge'   -- or 'super_admin'
);`}</code>
              </pre>
              <p className="mt-3 text-sm leading-relaxed text-night-950/65">
                They can then sign in at <strong>/admin</strong> and change their password.
              </p>
            </div>
          </li>
        </ol>
      </Modal>
    </>
  )
}
