import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders a QR code as inline SVG.
 *
 * The encoder is imported on demand, so the ~12 KB library only reaches
 * students who actually open a payment screen — not everyone browsing
 * competitions. Drawing the modules as one SVG `path` keeps the DOM to a
 * single node instead of ~900 rects.
 */
export function QrCode({
  value,
  size = 208,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const [path, setPath] = useState<{ d: string; count: number } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setPath(null)
    setFailed(false)

    void import('qrcode-generator')
      .then(({ default: qrcode }) => {
        if (!active) return
        // Level M tolerates a bit of camera blur without bloating the code.
        const qr = qrcode(0, 'M')
        qr.addData(value)
        qr.make()

        const count = qr.getModuleCount()
        let d = ''
        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.isDark(r, c)) d += `M${c},${r}h1v1h-1z`
          }
        }
        setPath({ d, count })
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [value])

  if (failed) {
    return (
      <div
        className={cn(
          'grid place-items-center rounded-2xl border-2 border-dashed border-night-950/15 p-4 text-center text-[12px] text-night-950/50',
          className,
        )}
        style={{ width: size, height: size }}
      >
        Could not draw the QR code — use the UPI ID below instead.
      </div>
    )
  }

  if (!path) {
    return (
      <div
        className={cn('animate-pulse rounded-2xl bg-night-950/8', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <svg
      viewBox={`0 0 ${path.count} ${path.count}`}
      width={size}
      height={size}
      className={cn('rounded-2xl bg-white', className)}
      role="img"
      aria-label="UPI payment QR code"
      shapeRendering="crispEdges"
    >
      <rect width={path.count} height={path.count} fill="#fff" />
      <path d={path.d} fill="#1a1240" />
    </svg>
  )
}
