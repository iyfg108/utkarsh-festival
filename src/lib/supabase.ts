import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * True once both env vars are present. When false the app renders a setup
 * screen instead of white-screening on a failed request — much friendlier
 * when someone clones the repo and runs `npm run dev` before reading anything.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('your-project-ref'),
)

export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'utkarsh-auth',
    },
    global: {
      headers: { 'x-application-name': 'utkarsh-heritage-festival' },
    },
  },
)

/**
 * Postgres raises our validation failures as plain exceptions. Supabase wraps
 * them, and the raw message often carries a `P0001:` style prefix or trailing
 * context. Strip the noise so we can show the sentence straight to a student.
 */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback

  const raw =
    typeof error === 'string'
      ? error
      : ((error as { message?: string; error_description?: string }).message ??
        (error as { error_description?: string }).error_description ??
        '')

  if (!raw) return fallback

  const cleaned = raw
    .replace(/^([A-Z]\d{4}|P0\d{3}):\s*/, '')
    .replace(/\s*CONTEXT:[\s\S]*$/i, '')
    .trim()

  // Network / config problems deserve their own wording.
  if (/failed to fetch|networkerror|load failed/i.test(cleaned)) {
    return 'We could not reach the server. Check your internet connection and try again.'
  }
  if (/jwt|api key|invalid.*key/i.test(cleaned)) {
    return 'The site is not configured correctly. Please tell the organisers.'
  }

  return cleaned || fallback
}
