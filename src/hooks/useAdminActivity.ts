import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type ActivityKind = 'registered' | 'reported_payment' | 'paid'

export interface ActivityItem {
  id: string
  kind: ActivityKind
  regCode: string
  name: string
  amount: number
  reference: string | null
  at: string
}

const SEEN_KEY = 'utkarsh-admin-last-seen'
const POLL_MS = 45_000

/**
 * A small activity feed for the organiser portal.
 *
 * Polling rather than Supabase Realtime, on purpose: it needs no publication
 * setup, survives a dropped websocket, and cannot silently stop working — the
 * failure mode of a realtime subscription that quietly died is far worse than
 * a 45-second delay. The query is deliberately slim (no joins) so this is a
 * cheap request to repeat.
 *
 * "Seen" lives in localStorage rather than the database: it is per-person, per
 * device, and needs no schema, which is the right trade for a team of a few.
 */
export function useAdminActivity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSeen, setLastSeen] = useState<string>(
    () => localStorage.getItem(SEEN_KEY) ?? new Date(0).toISOString(),
  )
  const notifiedIds = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('registrations')
      .select(
        'id, reg_code, full_name, fee_amount, payment_status, upi_reference, created_at, updated_at, paid_at',
      )
      .order('updated_at', { ascending: false })
      .limit(40)

    if (error) {
      // A judge without permission, or a dropped connection. Neither is worth
      // shouting about in a notification bell.
      setLoading(false)
      return
    }

    const rows = (data ?? []) as {
      id: string
      reg_code: string
      full_name: string
      fee_amount: number
      payment_status: string
      upi_reference: string | null
      created_at: string
      updated_at: string
      paid_at: string | null
    }[]

    setItems(
      rows.map((r) => {
        const kind: ActivityKind =
          r.payment_status === 'awaiting_verification'
            ? 'reported_payment'
            : r.payment_status === 'paid'
              ? 'paid'
              : 'registered'

        return {
          id: r.id,
          kind,
          regCode: r.reg_code,
          name: r.full_name,
          amount: r.fee_amount,
          reference: r.upi_reference,
          // For a brand-new registration created_at and updated_at match; for
          // a payment the row was touched again, which is the event we want.
          at: kind === 'registered' ? r.created_at : r.updated_at,
        }
      }),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), POLL_MS)

    // Catch up immediately when someone returns to the tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const unread = useMemo(
    () => items.filter((i) => i.at > lastSeen),
    [items, lastSeen],
  )

  const needsVerification = useMemo(
    () => items.filter((i) => i.kind === 'reported_payment').length,
    [items],
  )

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString()
    localStorage.setItem(SEEN_KEY, now)
    setLastSeen(now)
  }, [])

  /* ---- optional desktop notifications --------------------------------- */

  const [desktopEnabled, setDesktopEnabled] = useState(
    () => localStorage.getItem('utkarsh-admin-desktop') === 'yes',
  )

  const enableDesktop = useCallback(async () => {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    const ok = permission === 'granted'
    localStorage.setItem('utkarsh-admin-desktop', ok ? 'yes' : 'no')
    setDesktopEnabled(ok)
    return ok
  }, [])

  useEffect(() => {
    if (!desktopEnabled || loading) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    for (const item of unread) {
      // One notification per event, however many times we poll.
      const key = `${item.id}:${item.at}`
      if (notifiedIds.current.has(key)) continue
      notifiedIds.current.add(key)

      const title =
        item.kind === 'reported_payment'
          ? 'UPI payment to check'
          : item.kind === 'paid'
            ? 'Payment received'
            : 'New registration'

      new Notification(`Utkarsh — ${title}`, {
        body: `${item.name} (${item.regCode})`,
        tag: key,
      })
    }
  }, [unread, desktopEnabled, loading])

  return {
    items,
    unread,
    unreadCount: unread.length,
    needsVerification,
    loading,
    reload: load,
    markAllSeen,
    desktopEnabled,
    enableDesktop,
    desktopSupported: typeof window !== 'undefined' && 'Notification' in window,
  }
}
