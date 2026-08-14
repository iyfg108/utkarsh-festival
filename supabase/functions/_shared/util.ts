// Shared helpers for the payment functions.
// Deno runtime (Supabase Edge Functions).

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/** HMAC-SHA256, hex encoded — what Razorpay signs with. */
export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Compares two hex strings without leaking where they diverge.
 * A plain `===` on a signature is a timing oracle; this is not.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

/** Minimal Supabase REST call using the service role key (bypasses RLS). */
export async function db(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<Response> {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(init.prefer ? { Prefer: init.prefer } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  }
  return fetch(`${url}/rest/v1/${path}`, { ...init, headers })
}
