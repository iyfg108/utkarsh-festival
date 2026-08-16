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

/** How long any single Supabase request may take before we give up on it. */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * `fetch` has no timeout of its own. A request that fails outright rejects
 * quickly, but one that opens a connection and then stalls stays pending for
 * minutes — which is the normal shape of a weak mobile signal, and of the
 * mobile networks that blackhole traffic instead of refusing it.
 *
 * Without a deadline the app has no way to know that happened: the promise
 * never settles, so the loading screen never resolves into either content or an
 * error, and the student sits on "Preparing the festival…" indefinitely. A
 * bounded wait turns that into an ordinary failure the UI can report and offer
 * to retry.
 *
 * Written with AbortController rather than `AbortSignal.timeout` +
 * `AbortSignal.any`, which are too recent for the older Android browsers this
 * site is explicitly built for.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  // Never drop a caller's own signal on the floor — supabase-js aborts its
  // auth refresh this way.
  const caller = init?.signal
  if (caller) {
    if (caller.aborted) controller.abort()
    else caller.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

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
      fetch: fetchWithTimeout,
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
  // The abort case is our own REQUEST_TIMEOUT_MS firing, so it is a slow or
  // half-open connection rather than an outright failure — worth saying, since
  // the advice is different: wait and retry, or move to another network.
  if (/abort|timed? ?out|timeout/i.test(cleaned)) {
    return 'The connection timed out. Your internet may be slow — please try again, or switch between mobile data and Wi‑Fi.'
  }
  if (/failed to fetch|networkerror|load failed/i.test(cleaned)) {
    return 'We could not reach the server. Check your internet connection and try again.'
  }
  if (/jwt|api key|invalid.*key/i.test(cleaned)) {
    return 'The site is not configured correctly. Please tell the organisers.'
  }

  return cleaned || fallback
}
