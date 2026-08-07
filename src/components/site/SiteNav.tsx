import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/ui/Button'
import { ArrowRightIcon, CloseIcon, MenuIcon } from '@/components/Icons'
import { PeacockFeather } from '@/components/Decor'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/tracks', label: 'Competitions' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export function SiteNav({ registrationOpen }: { registrationOpen: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the drawer on navigation.
  useEffect(() => setOpen(false), [location.pathname])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-xl focus:bg-night-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-night-950/8 bg-cream-50/85 py-2 backdrop-blur-xl'
            : 'border-b border-transparent py-4',
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Utkarsh home">
            <span className="relative grid size-10 place-items-center overflow-hidden rounded-2xl bg-night-950 shadow-lift">
              <PeacockFeather className="h-8 w-auto transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-black tracking-tight text-night-950">
                Utkarsh
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-marigold-600">
                Heritage Festival
              </span>
            </span>
          </Link>

          <div className="mx-auto hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'text-marigold-700'
                      : 'text-night-950/70 hover:text-night-950',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-marigold-100"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              to="/status"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-night-950/70 transition hover:text-night-950 sm:block"
            >
              Check status
            </Link>

            {registrationOpen ? (
              <ButtonLink
                to="/register"
                size="sm"
                shimmer
                className="hidden sm:inline-flex"
                iconRight={<ArrowRightIcon className="size-4" />}
              >
                Register
              </ButtonLink>
            ) : (
              <span className="hidden rounded-xl border border-night-950/12 px-3 py-2 text-xs font-bold uppercase tracking-wide text-night-950/50 sm:block">
                Registration closed
              </span>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-xl border border-night-950/12 bg-white/70 text-night-950 backdrop-blur transition hover:bg-white lg:hidden"
            >
              {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-night-950/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="absolute inset-x-3 top-20 rounded-3xl border border-night-950/10 bg-cream-50 p-3 shadow-2xl"
            >
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-bold transition',
                      isActive
                        ? 'bg-marigold-100 text-marigold-800'
                        : 'text-night-950 hover:bg-night-950/5',
                    )
                  }
                >
                  {l.label}
                  <ArrowRightIcon className="size-4 opacity-40" />
                </NavLink>
              ))}

              <div className="mt-2 grid gap-2 border-t border-night-950/8 pt-3">
                <ButtonLink to="/status" variant="outline" size="md">
                  Check my registration
                </ButtonLink>
                {registrationOpen ? (
                  <ButtonLink to="/register" size="md" shimmer iconRight={<ArrowRightIcon className="size-4" />}>
                    Register now
                  </ButtonLink>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
