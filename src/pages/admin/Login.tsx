import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { friendlyError } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Form'
import { ArrowRightIcon, LockIcon } from '@/components/Icons'
import { AuroraBlobs, PeacockFeather, Rangoli } from '@/components/Decor'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      // AuthProvider picks up the session and AdminApp re-renders.
    } catch (err) {
      const message = friendlyError(err, 'Could not sign you in.')
      setError(
        /invalid login credentials/i.test(message)
          ? 'That email and password do not match. Please try again.'
          : message,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-paper px-4 py-16">
      <AuroraBlobs />
      <Rangoli
        className="absolute -right-40 -top-32 -z-10 size-[32rem] text-marigold-300/30 animate-spin-slower"
        petals={18}
      />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <PeacockFeather className="h-16 w-auto" />
          <h1 className="mt-4 font-display text-3xl font-black text-night-950">Organiser portal</h1>
          <p className="mt-1 text-sm text-night-950/55">Utkarsh Heritage Festival</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-4xl border border-night-950/8 bg-white p-7 stack-shadow sm:p-8"
        >
          <div className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
            >
              {error}
            </motion.p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="mt-6 w-full"
            icon={<LockIcon className="size-5" />}
          >
            Sign in
          </Button>

          <p className="mt-5 text-center text-[13px] leading-relaxed text-night-950/50">
            Accounts are created by a super admin in Supabase. If you cannot get in, ask them to
            check your organiser record.
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-950/55 transition hover:text-night-950"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
            Back to the festival site
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
