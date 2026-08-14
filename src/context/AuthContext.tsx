import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AdminUser } from '@/lib/types'

interface AuthValue {
  session: Session | null
  admin: AdminUser | null
  loading: boolean
  /** Signed in AND present in admin_users with is_active. */
  isAdmin: boolean
  isSuperAdmin: boolean
  isJudge: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAdmin = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setAdmin(null)
      return
    }
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    // A signed-in user with no admin_users row simply is not an admin.
    setAdmin(error ? null : ((data as AdminUser | null) ?? null))
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return
        setSession(data.session)
        await loadAdmin(data.session?.user.id)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      setSession(next)
      // Not awaited on purpose — the listener must stay synchronous.
      void loadAdmin(next?.user.id)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadAdmin])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAdmin(null)
  }, [])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    await loadAdmin(data.session?.user.id)
  }, [loadAdmin])

  const value = useMemo<AuthValue>(
    () => ({
      session,
      admin,
      loading,
      isAdmin: Boolean(admin?.is_active),
      isSuperAdmin: admin?.is_active === true && admin.role === 'super_admin',
      isJudge: admin?.is_active === true && admin.role === 'judge',
      signIn,
      signOut,
      refresh,
    }),
    [session, admin, loading, signIn, signOut, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthValue {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
