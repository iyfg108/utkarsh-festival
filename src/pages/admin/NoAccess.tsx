import { useAuth } from '@/context/AuthContext'
import { Button, ButtonLink } from '@/components/ui/Button'
import { LockIcon } from '@/components/Icons'
import { PeacockFeather } from '@/components/Decor'

export function NoAccess({
  inline = false,
  title = 'You do not have access to this',
}: {
  inline?: boolean
  title?: string
}) {
  const { signOut, admin } = useAuth()

  const body = (
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-night-950/12 bg-white px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-night-950/6 text-night-950/40">
        <LockIcon className="size-7" />
      </span>
      <h2 className="text-xl font-black text-night-950">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-night-950/60">
        {admin
          ? `Your account is set up as a ${admin.role.replace(/_/g, ' ')}, which does not include this section. Ask a super admin if you need it.`
          : 'This account is signed in, but it is not on the organiser list. Ask a super admin to add you, then sign in again.'}
      </p>
      {!inline ? (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
          <ButtonLink to="/" variant="ghost">
            Back to the site
          </ButtonLink>
        </div>
      ) : null}
    </div>
  )

  if (inline) return body

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center">
          <PeacockFeather className="h-16 w-auto" />
          <p className="mt-3 font-display text-2xl font-black text-night-950">Utkarsh Organisers</p>
        </div>
        {body}
      </div>
    </div>
  )
}
