import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatMoney, timeAgo } from '@/lib/utils'
import type { ActivityItem } from '@/hooks/useAdminActivity'
import type { useAdminActivity } from '@/hooks/useAdminActivity'
import { BellIcon, CheckIcon, ClipboardIcon, UsersIcon } from '@/components/Icons'

const KIND: Record<
  ActivityItem['kind'],
  { label: string; tone: string; icon: React.ReactNode; to: string }
> = {
  reported_payment: {
    label: 'reported a UPI payment',
    tone: 'bg-peacock-100 text-peacock-700',
    icon: <ClipboardIcon className="size-4" />,
    to: '/admin/verify',
  },
  paid: {
    label: 'has paid',
    tone: 'bg-emerald-100 text-emerald-700',
    icon: <CheckIcon className="size-4" strokeWidth={3} />,
    to: '/admin/registrations',
  },
  registered: {
    label: 'registered',
    tone: 'bg-marigold-100 text-marigold-700',
    icon: <UsersIcon className="size-4" />,
    to: '/admin/registrations',
  },
}

/**
 * Takes the activity feed as a prop rather than calling the hook itself, so
 * the layout polls once and shares the result with the nav badge.
 */
export function NotificationBell({
  activity,
}: {
  activity: ReturnType<typeof useAdminActivity>
}) {
  const {
    items,
    unreadCount,
    needsVerification,
    markAllSeen,
    desktopEnabled,
    enableDesktop,
    desktopSupported,
    loading,
  } = activity

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open && unreadCount > 0) markAllSeen()
        }}
        aria-label={
          unreadCount > 0 ? `Activity — ${unreadCount} new` : 'Activity'
        }
        className="relative grid size-10 place-items-center rounded-xl border border-night-950/12 bg-white text-night-950/70 transition hover:text-night-950"
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-festival-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-scale-in absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-night-950/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-night-950/8 px-5 py-3.5">
            <p className="font-black text-night-950">Recent activity</p>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-night-950/40">
              Updates every 45s
            </span>
          </div>

          {needsVerification > 0 ? (
            <Link
              to="/admin/verify"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-night-950/8 bg-peacock-50 px-5 py-3.5 transition hover:bg-peacock-100"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-peacock-500 text-white">
                <ClipboardIcon className="size-4" />
              </span>
              <span className="flex-1 text-sm font-bold text-peacock-900">
                {needsVerification} UPI {needsVerification === 1 ? 'payment' : 'payments'} to check
              </span>
              <span className="text-sm font-bold text-peacock-700">→</span>
            </Link>
          ) : null}

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-night-950/45">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-night-950/45">
                Nothing yet. New registrations and payments show up here.
              </p>
            ) : (
              <ul className="divide-y divide-night-950/6">
                {items.slice(0, 20).map((item) => {
                  const k = KIND[item.kind]
                  return (
                    <li key={`${item.id}-${item.at}`}>
                      <Link
                        to={k.to}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-5 py-3 transition hover:bg-cream-50"
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
                            k.tone,
                          )}
                        >
                          {k.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-night-950">
                            <strong className="font-bold">{item.name}</strong> {k.label}
                            {item.kind !== 'registered' ? ` · ${formatMoney(item.amount)}` : ''}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-night-950/45">
                            {item.regCode}
                            {item.reference && item.kind === 'reported_payment'
                              ? ` · ${item.reference}`
                              : ''}
                            {' · '}
                            {timeAgo(item.at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {desktopSupported && !desktopEnabled ? (
            <button
              type="button"
              onClick={() => void enableDesktop()}
              className="w-full border-t border-night-950/8 px-5 py-3 text-left text-[13px] font-semibold text-peacock-700 transition hover:bg-peacock-50"
            >
              Also notify me on this computer →
            </button>
          ) : desktopEnabled ? (
            <p className="border-t border-night-950/8 px-5 py-3 text-[12px] text-night-950/45">
              Desktop notifications are on for this browser.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
