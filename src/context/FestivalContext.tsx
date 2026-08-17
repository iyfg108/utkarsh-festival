import { createContext, use, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchSettings, fetchTracks } from '@/lib/queries'
import type { FestivalSettings, Track } from '@/lib/types'

/** A group of competitions sharing a date and a time slot, e.g. 30 Aug 4–6 pm. */
export interface DaySlot {
  date: string
  start: string | null
  end: string | null
  tracks: Track[]
}

interface FestivalValue {
  settings: FestivalSettings | null
  tracks: Track[]
  /** Competitions on the first day. */
  onlineTracks: Track[]
  /** Competitions on the second day. */
  onsiteTracks: Track[]
  /** Every competition grouped by date and time slot, in running order. */
  daySlots: DaySlot[]
  loading: boolean
  error: unknown
  reload: () => void
}

const FestivalContext = createContext<FestivalValue | null>(null)

/**
 * The catalogue barely changes during a session, so it is fetched once and
 * shared. Live numbers (song availability) are fetched separately by the
 * screens that need them, so they always reflect the moment.
 */
export function FestivalProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FestivalSettings | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([fetchSettings(), fetchTracks()])
      .then(([s, t]) => {
        if (!active) return
        setSettings(s)
        setTracks(t)
      })
      .catch((err) => {
        if (active) setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [nonce])

  const value = useMemo<FestivalValue>(() => {
    /*
      Split by DATE, not by `mode`. Every competition is held at the temple now
      — the quiz is answered on a device but sat on site — so `mode` no longer
      separates the two days, and filtering on it left the first day empty.
      The two `*_date` settings keep their old key names; read them as "first
      day" and "second day".
    */
    const firstDay = settings?.event.online_date ?? null
    const secondDay = settings?.event.onsite_date ?? null

    // One row per date + time slot, so 30 August's morning and evening read as
    // the two separate sittings they are.
    const groups = new Map<string, DaySlot>()
    for (const t of tracks) {
      if (!t.event_date) continue
      const key = `${t.event_date}|${t.start_time ?? ''}|${t.end_time ?? ''}`
      const existing = groups.get(key)
      if (existing) existing.tracks.push(t)
      else
        groups.set(key, {
          date: t.event_date,
          start: t.start_time,
          end: t.end_time,
          tracks: [t],
        })
    }

    const daySlots = [...groups.values()].sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''),
    )

    return {
      settings,
      tracks,
      onlineTracks: tracks.filter((t) => t.event_date === firstDay),
      onsiteTracks: tracks.filter((t) => t.event_date === secondDay),
      daySlots,
      loading,
      error,
      reload: () => setNonce((n) => n + 1),
    }
  }, [settings, tracks, loading, error])

  return <FestivalContext value={value}>{children}</FestivalContext>
}

export function useFestival(): FestivalValue {
  const ctx = use(FestivalContext)
  if (!ctx) throw new Error('useFestival must be used inside <FestivalProvider>')
  return ctx
}
