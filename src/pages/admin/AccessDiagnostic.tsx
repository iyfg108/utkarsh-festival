import { useAuth } from '@/context/AuthContext'

/**
 * Shown when a screen loads zero registrations.
 *
 * Every read policy on `registrations` is `is_admin()`, which returns rows for
 * any active admin and nothing at all — not an error — for anyone else. So a
 * permissions problem and a genuinely empty festival look identical: a blank
 * list. This says which one it is, in place, rather than leaving an organiser
 * to guess or to ask someone with SQL access.
 */
export function AccessDiagnostic({ context }: { context: string }) {
  const { session, admin, isAdmin, isSuperAdmin } = useAuth()

  const email = session?.user?.email ?? '—'
  const uid = session?.user?.id ?? '—'

  /*
    admin_users.id is a foreign key to auth.users(id), so a row cannot point at
    a user who does not exist. That rules out the mistake this would otherwise
    most likely be — a mistyped UUID — and leaves two real possibilities: no
    row at all, or a row switched off.
  */
  const problem = !admin
    ? 'There is no organiser record for this account.'
    : !admin.is_active
      ? 'This organiser record is switched off.'
      : null

  return (
    <div className="mt-5 rounded-3xl border-2 border-marigold-300 bg-marigold-50 p-5 sm:p-6">
      <p className="font-bold text-marigold-900">
        {problem ? 'You cannot see this data' : `No ${context} to show`}
      </p>

      <p className="mt-1 text-[13px] leading-relaxed text-marigold-900/80">
        {problem
          ? `${problem} The database returns nothing rather than an error, which is why the list is simply empty.`
          : `Your account has access, so this is genuinely empty rather than blocked — nobody matches the filters above.`}
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
        <Row label="Signed in as" value={email} />
        <Row label="Organiser record" value={admin ? 'Found' : 'Not found'} />
        <Row label="Role" value={admin ? admin.role.replace('_', ' ') : '—'} />
        <Row
          label="Active"
          value={admin ? (admin.is_active ? 'Yes' : 'No — switched off') : '—'}
        />
      </dl>

      {problem ? (
        <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-[12px] leading-relaxed text-marigold-900/85">
          <p className="font-bold">To fix it</p>
          {!admin ? (
            <p className="mt-1">
              A super admin adds this person in <strong>Admin → Organisers</strong>. Being able to
              sign in is not enough on its own — signing in proves who you are, the organiser
              record decides what you may see.
            </p>
          ) : (
            <p className="mt-1">
              A super admin can switch this record back on in{' '}
              <strong>Admin → Organisers</strong>.
            </p>
          )}
          <p className="mt-2 text-marigold-900/60">
            User id for reference: <code className="font-mono">{uid}</code>
          </p>
        </div>
      ) : null}

      {!problem && !isSuperAdmin && isAdmin ? (
        <p className="mt-3 text-[12px] text-marigold-900/70">
          You are signed in as a judge. Judges see registrations, scores and the day sheet, but
          not settings or the catalogue.
        </p>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-marigold-900/50">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-marigold-900">{value}</dd>
    </div>
  )
}
