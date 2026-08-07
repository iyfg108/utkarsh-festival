import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '@/context/AuthContext'
import { cn, initials } from '@/lib/utils'
import {
  ChartIcon,
  ClipboardIcon,
  CloseIcon,
  ImageIcon,
  MenuIcon,
  MusicIcon,
  SchoolIcon,
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
} from '@/components/Icons'
import { PeacockFeather } from '@/components/Decor'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: ChartIcon, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardIcon },
  { to: '/admin/shortlist', label: 'Judging & shortlist', icon: TrophyIcon },
  { to: '/admin/selections', label: 'Songs & slokas', icon: MusicIcon, superOnly: true },
  { to: '/admin/schools', label: 'Schools', icon: SchoolIcon, superOnly: true },
  { to: '/admin/content', label: 'Gallery & quotes', icon: ImageIcon, superOnly: true },
  { to: '/admin/users', label: 'Organisers', icon: UsersIcon, superOnly: true },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon, superOnly: true },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  school_coordinator: 'School coordinator',
  judge: 'Judge',
}

export function AdminLayout() {
  const { admin, signOut, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  const items = NAV.filter((n) => !n.superOnly || isSuperAdmin)

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 py-6">
        <span className="grid size-10 place-items-center rounded-2xl bg-night-950">
          <PeacockFeather className="h-8 w-auto" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-black text-night-950">Utkarsh</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-marigold-600">
            Organisers
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((n) => {
          const Icon = n.icon
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-marigold-500 text-white shadow-glow-marigold'
                    : 'text-night-950/65 hover:bg-night-950/5 hover:text-night-950',
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              {n.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-night-950/8 p-3">
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-peacock-400 to-night-600 text-xs font-black text-white">
            {initials(admin?.full_name ?? admin?.email ?? '?')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-night-950">
              {admin?.full_name ?? 'Organiser'}
            </p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-night-950/45">
              {ROLE_LABEL[admin?.role ?? ''] ?? admin?.role}
            </p>
          </div>
        </div>

        <div className="mt-1 grid gap-1">
          <Link
            to="/"
            className="rounded-xl px-3 py-2 text-[13px] font-semibold text-night-950/55 transition hover:bg-night-950/5 hover:text-night-950"
          >
            View the public site
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-cream-100/60">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-night-950/8 bg-white lg:block">
        {sidebar}
      </aside>

      {/* mobile bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-night-950/8 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid size-10 place-items-center rounded-xl border border-night-950/12"
        >
          <MenuIcon className="size-5" />
        </button>
        <span className="font-display text-lg font-black text-night-950">Utkarsh Organisers</span>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-night-950/50" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 w-72 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-5 grid size-9 place-items-center rounded-xl text-night-950/50 hover:bg-night-950/6"
              >
                <CloseIcon className="size-5" />
              </button>
              {sidebar}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

/** Shared page header for admin screens. */
export function AdminHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-black text-night-950">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-night-950/55">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
