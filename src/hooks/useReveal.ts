import { useEffect, useRef, useState } from 'react'

/**
 * Reveals an element the first time it scrolls into view. Elements start
 * hidden only when IntersectionObserver is available and the user has not
 * asked for reduced motion — otherwise everything renders visible immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(() => {
    if (typeof window === 'undefined') return true
    if (!('IntersectionObserver' in window)) return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (shown) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shown, threshold])

  return { ref, shown }
}
