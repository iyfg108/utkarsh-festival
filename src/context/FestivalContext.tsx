import { createContext, use, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchSettings, fetchTracks } from '@/lib/queries'
import type { FestivalSettings, Track } from '@/lib/types'

interface FestivalValue {
  settings: FestivalSettings | null
  tracks: Track[]
  /** Competitions held online on the first date. */
  onlineTracks: Track[]
  /** Competitions held at the temple on the second date. */
  onsiteTracks: Track[]
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

  const value = useMemo<FestivalValue>(
    () => ({
      settings,
      tracks,
      onlineTracks: tracks.filter((t) => t.mode === 'online'),
      onsiteTracks: tracks.filter((t) => t.mode === 'onsite'),
      loading,
      error,
      reload: () => setNonce((n) => n + 1),
    }),
    [settings, tracks, loading, error],
  )

  return <FestivalContext value={value}>{children}</FestivalContext>
}

export function useFestival(): FestivalValue {
  const ctx = use(FestivalContext)
  if (!ctx) throw new Error('useFestival must be used inside <FestivalProvider>')
  return ctx
}
