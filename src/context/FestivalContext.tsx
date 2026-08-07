import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  fetchCategories,
  fetchSchools,
  fetchSettings,
  fetchTrackCategories,
  fetchTracks,
} from '@/lib/queries'
import type {
  Category,
  FestivalSettings,
  School,
  Track,
  TrackCategory,
} from '@/lib/types'

interface FestivalValue {
  settings: FestivalSettings | null
  tracks: Track[]
  categories: Category[]
  trackCategories: TrackCategory[]
  schools: School[]
  loading: boolean
  error: unknown
  reload: () => void
  /** Categories a given track is open to. */
  categoriesForTrack: (trackId: string) => Category[]
  /** Tracks open to a given category. */
  tracksForCategory: (categoryId: string | null) => Track[]
}

const FestivalContext = createContext<FestivalValue | null>(null)

/**
 * The catalogue barely changes during a session, so it is fetched once here
 * and shared. Pages that need live numbers (slot availability) fetch those
 * separately so they always reflect the moment.
 */
export function FestivalProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FestivalSettings | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [trackCategories, setTrackCategories] = useState<TrackCategory[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    Promise.all([
      fetchSettings(),
      fetchTracks(),
      fetchCategories(),
      fetchTrackCategories(),
      fetchSchools(),
    ])
      .then(([s, t, c, tc, sc]) => {
        if (!active) return
        setSettings(s)
        setTracks(t)
        setCategories(c)
        setTrackCategories(tc)
        setSchools(sc)
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

  const categoriesForTrack = useCallback(
    (trackId: string) => {
      const ids = new Set(
        trackCategories.filter((tc) => tc.track_id === trackId).map((tc) => tc.category_id),
      )
      return categories.filter((c) => ids.has(c.id))
    },
    [categories, trackCategories],
  )

  const tracksForCategory = useCallback(
    (categoryId: string | null) => {
      if (!categoryId) return tracks
      const ids = new Set(
        trackCategories.filter((tc) => tc.category_id === categoryId).map((tc) => tc.track_id),
      )
      return tracks.filter((t) => ids.has(t.id))
    },
    [tracks, trackCategories],
  )

  const value = useMemo<FestivalValue>(
    () => ({
      settings,
      tracks,
      categories,
      trackCategories,
      schools,
      loading,
      error,
      reload: () => setNonce((n) => n + 1),
      categoriesForTrack,
      tracksForCategory,
    }),
    [
      settings,
      tracks,
      categories,
      trackCategories,
      schools,
      loading,
      error,
      categoriesForTrack,
      tracksForCategory,
    ],
  )

  return <FestivalContext value={value}>{children}</FestivalContext>
}

export function useFestival(): FestivalValue {
  const ctx = use(FestivalContext)
  if (!ctx) throw new Error('useFestival must be used inside <FestivalProvider>')
  return ctx
}
