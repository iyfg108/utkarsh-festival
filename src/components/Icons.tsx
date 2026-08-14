import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* ---------------------------------------------------------------- tracks */

export function PaletteIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.5a2 2 0 0 0-1.4 3.4c.4.4.4 1.1 0 1.5-.6.6-1.4.1-3.1.1Z" />
      <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MaskIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 6.5c3-1 5.3-1 8-1s5 0 8 1c0 6.5-1.4 10-4.2 12.1a6 6 0 0 1-7.6 0C5.4 16.5 4 13 4 6.5Z" />
      <path d="M8.5 10.5c.8-.7 1.9-.7 2.7 0M12.8 10.5c.8-.7 1.9-.7 2.7 0" />
      <path d="M10 15.2c1.3.9 2.7.9 4 0" />
    </svg>
  )
}

export function ScrollIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M5 6a2 2 0 1 1 4 0v1H5V6Z" />
      <path d="M9 9h7M9 12.5h7M9 16h4.5" />
    </svg>
  )
}

export function MusicIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 18V6.2a1 1 0 0 1 .8-1l7.4-1.5a1 1 0 0 1 1.2 1V15" />
      <circle cx="6.6" cy="18" r="2.6" />
      <circle cx="15.8" cy="15.6" r="2.6" />
      <path d="M9 9.6 18.4 7.7" />
    </svg>
  )
}

export function DanceIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12.6" cy="4.3" r="1.9" />
      <path d="M12.4 7.3 10 11.5l-3.4 1.9M12.4 7.3l3 1.6 3 4.6" />
      <path d="M10 11.5l1.4 4.2-2.8 4.6M11.4 15.7l4 4.6" />
    </svg>
  )
}

export function DramaIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 5.5c2.3-.7 4.1-.7 6.2-.7s3.9 0 6.2.7c0 5.2-1.1 8-3.3 9.7a4.6 4.6 0 0 1-5.8 0C4.6 13.5 3.5 10.7 3.5 5.5Z" />
      <path d="M14 8.6c2-.5 3.4-.5 4.8-.2.9.2 1.7.4 1.7.4 0 5.2-1.1 8-3.3 9.7a4.6 4.6 0 0 1-5.5.2" />
      <path d="M7 8.6c.6-.5 1.4-.5 2 0M10.8 8.6c.6-.5 1.4-.5 2 0" />
    </svg>
  )
}

export function BrainIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5.2a2.7 2.7 0 0 0-5 1.3c-1.5.3-2.5 1.5-2.5 3 0 .8.3 1.5.8 2-.5.6-.8 1.3-.8 2.1 0 1.8 1.5 3.2 3.4 3.2.5 1.3 1.7 2.2 3.1 2.2h1V5.2Z" />
      <path d="M12 5.2a2.7 2.7 0 0 1 5 1.3c1.5.3 2.5 1.5 2.5 3 0 .8-.3 1.5-.8 2 .5.6.8 1.3.8 2.1 0 1.8-1.5 3.2-3.4 3.2-.5 1.3-1.7 2.2-3.1 2.2h-1" />
    </svg>
  )
}

export function MicIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="9" y="2.6" width="6" height="11" rx="3" />
      <path d="M5.5 11.2a6.5 6.5 0 0 0 13 0M12 17.7V21M8.8 21h6.4" />
    </svg>
  )
}

export function SparklesIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.2 13.6 8l4.8 1.6-4.8 1.6L12 16l-1.6-4.8L5.6 9.6 10.4 8 12 3.2Z" />
      <path d="M18.5 15.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2ZM5.6 3l.5 1.5 1.5.5-1.5.5L5.6 7l-.5-1.5L3.6 5l1.5-.5L5.6 3Z" />
    </svg>
  )
}

const TRACK_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  palette: PaletteIcon,
  mask: MaskIcon,
  scroll: ScrollIcon,
  music: MusicIcon,
  dance: DanceIcon,
  drama: DramaIcon,
  brain: BrainIcon,
  mic: MicIcon,
  sparkles: SparklesIcon,
}

export function TrackIcon({ name, ...rest }: { name: string } & IconProps) {
  const Cmp = TRACK_ICONS[name] ?? SparklesIcon
  return <Cmp {...rest} />
}

/* ------------------------------------------------------------------- ui */

export function ArrowRightIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </svg>
  )
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...p}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  )
}

export function CloseIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M5.5 8.5 12 15l6.5-6.5" />
    </svg>
  )
}

export function MenuIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function BellIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  )
}

export function QrIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17.5 20.5h3M13.5 20.5h1" />
    </svg>
  )
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  )
}

export function UsersIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M17.4 14.2a6.2 6.2 0 0 1 3.8 5.3" />
    </svg>
  )
}

export function SchoolIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="M6.5 10v5.4c0 .6.3 1.1.8 1.4a10.4 10.4 0 0 0 9.4 0c.5-.3.8-.8.8-1.4V10" />
      <path d="M21 7.5v6" />
    </svg>
  )
}

export function TrophyIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M7 4.5h10v4.8a5 5 0 0 1-10 0V4.5Z" />
      <path d="M7 6H4.6a2.4 2.4 0 0 0 2.4 4.8M17 6h2.4a2.4 2.4 0 0 1-2.4 4.8" />
      <path d="M12 14.3V17M8.6 20h6.8M9.8 17h4.4l.6 3H9.2l.6-3Z" />
    </svg>
  )
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function MapPinIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

export function DownloadIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

export function ChartIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 20v-6M12.5 20V8M17 20v-9" />
    </svg>
  )
}

export function SettingsIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  )
}

export function ClipboardIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="7.5" y="4.5" width="9" height="3.5" rx="1.2" />
      <path d="M16.5 6.2h1.8a2 2 0 0 1 2 2v10.3a2 2 0 0 1-2 2H5.7a2 2 0 0 1-2-2V8.2a2 2 0 0 1 2-2h1.8" />
      <path d="M8 12h8M8 15.8h5" />
    </svg>
  )
}

export function ImageIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.8" cy="9.6" r="1.6" />
      <path d="m4.5 16.5 4.2-4 3.3 3 3-2.6 4 3.6" />
    </svg>
  )
}

export function QuoteIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M9.6 5.5c-3.3 1.6-5.4 4.6-5.4 8.4 0 3 1.8 5 4.4 5 2.2 0 3.9-1.6 3.9-3.7 0-2-1.4-3.5-3.3-3.5-.4 0-.8 0-1.1.2.4-1.8 1.8-3.4 3.7-4.4l-2.2-2Zm9.3 0c-3.3 1.6-5.4 4.6-5.4 8.4 0 3 1.8 5 4.4 5 2.2 0 3.9-1.6 3.9-3.7 0-2-1.4-3.5-3.3-3.5-.4 0-.8 0-1.1.2.4-1.8 1.8-3.4 3.7-4.4l-2.2-2Z" />
    </svg>
  )
}

export function SpinnerIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WhatsAppIcon(p: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.1 4c-.2 0-.5 0-.7.4-.2.4-.9.9-.9 2.2s.9 2.5 1 2.7c.2.2 1.8 2.9 4.5 3.9 2.2.8 2.7.7 3.2.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.6-.4-1.6-.8c-.2 0-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.8-.2-.3 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-1.8c-.2-.4-.4-.4-.6-.4h-.2Z" />
    </svg>
  )
}

export function InstagramIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MailIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.6 6.5 7.3 5.4a2 2 0 0 0 2.2 0l7.3-5.4" />
    </svg>
  )
}

export function PhoneIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6.2 3.5h3l1.5 3.7-1.9 1.4a11 11 0 0 0 5.1 5.1l1.4-1.9 3.7 1.5v3a2 2 0 0 1-2.2 2 17.5 17.5 0 0 1-15.8-15.8 2 2 0 0 1 2-2.2Z" />
    </svg>
  )
}
