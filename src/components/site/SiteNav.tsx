import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Brand } from '@/components/Brand'
import { ButtonLink } from '@/components/ui/Button'
import { ArrowRightIcon, CloseIcon, MenuIcon } from '@/components/Icons'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/competitions', label: 'Competitions' },
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

  useEffect(() => setOpen(false), [location.pathname])

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
          'fixed inset-x-0 top-0 z-50 transition-[padding,background-color] duration-300',
          scrolled
            ? 'border-b border-night-950/8 bg-cream-50/90 py-2 backdrop-blur-md'
            : 'border-b border-transparent py-3.5',
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0" aria-label="Utkarsh home">
            <Brand size="md" />
          </Link>

          <div className="mx-auto hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-marigold-100 text-marigold-700'
                      : 'text-night-950/70 hover:bg-night-950/5 hover:text-night-950',
                  )
                }
              >
                {l.label}
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
              className="grid size-10 place-items-center rounded-xl border border-night-950/12 bg-white/70 text-night-950 lg:hidden"
            >
              {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer — plain CSS transition, no animation library on the
          critical path for phones. */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-night-950/45" onClick={() => setOpen(false)} />
          <div className="animate-rise absolute inset-x-3 top-[4.5rem] rounded-3xl border border-night-950/10 bg-cream-50 p-3 shadow-2xl">
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
                <ButtonLink to="/register" size="md" iconRight={<ArrowRightIcon className="size-4" />}>
                  Register now
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
