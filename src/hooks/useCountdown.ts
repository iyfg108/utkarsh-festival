import { useEffect, useState } from 'react'

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
  total: number
}

function diff(target: number): Countdown {
  const total = Math.max(target - Date.now(), 0)
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
    isPast: total <= 0,
    total,
  }
}

/** Ticks once a second toward an ISO date. Stops when the date has passed. */
export function useCountdown(isoDate: string | null | undefined): Countdown | null {
  const target = isoDate ? new Date(isoDate).getTime() : NaN
  const valid = !Number.isNaN(target)
  const [state, setState] = useState<Countdown | null>(valid ? diff(target) : null)

  useEffect(() => {
    if (!valid) {
      setState(null)
      return
    }
    setState(diff(target))
    const id = window.setInterval(() => {
      const next = diff(target)
      setState(next)
      if (next.isPast) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [target, valid])

  return state
}
