import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: unknown
  reload: () => void
  setData: (updater: T | ((prev: T | null) => T | null)) => void
}

/**
 * Minimal data-fetching hook. Keeps the last good value while refetching so
 * lists do not flash empty, and ignores results from a stale request.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const runId = useRef(0)

  // The caller passes an inline closure; deps decide when it re-runs.
  const stableFn = useRef(fn)
  stableFn.current = fn

  useEffect(() => {
    const id = ++runId.current
    let cancelled = false
    setLoading(true)
    setError(null)

    stableFn
      .current()
      .then((value) => {
        if (cancelled || id !== runId.current) return
        setData(value)
      })
      .catch((err) => {
        if (cancelled || id !== runId.current) return
        setError(err)
      })
      .finally(() => {
        if (cancelled || id !== runId.current) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  const update = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    setData((prev) =>
      typeof updater === 'function' ? (updater as (p: T | null) => T | null)(prev) : updater,
    )
  }, [])

  return { data, loading, error, reload, setData: update }
}
