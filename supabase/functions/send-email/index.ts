// ============================================================================
//  send-email — sends a templated message to a batch of registrations.
//
//  ADMIN ONLY. Unlike the payment functions, this one is not open to the
//  public: an unauthenticated endpoint that sends mail is a spam relay. The
//  caller's JWT is verified by the platform (verify_jwt is left ON in
//  config.toml) and then checked against admin_users here.
//
//  Deploy:  supabase functions deploy send-email
//  Secrets: BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME
//
//  Why Brevo: it lets you verify a single sender address, so a Gmail account
//  works. Resend and most others require you to own and verify a whole domain,
//  which the festival does not have. Swap providers by replacing sendOne().
// ============================================================================

import { corsHeaders, db, fail, json, requireEnv } from '../_shared/util.ts'

interface Registration {
  id: string
  reg_code: string
  full_name: string
  email: string | null
  fee_amount: number
  payment_status: string
  registration_tracks?: { track: { name: string } | null }[]
}

/** Values a template may reference as {{name}}, {{code}} and so on. */
function mergeFields(reg: Registration, extra: Record<string, string>) {
  const first = reg.full_name.trim().split(/\s+/)[0] ?? reg.full_name
  const competitions = (reg.registration_tracks ?? [])
    .map((e) => e.track?.name)
    .filter(Boolean)
    .join(', ')

  return {
    name: reg.full_name,
    first_name: first,
    code: reg.reg_code,
    amount: `₹${reg.fee_amount}`,
    competitions: competitions || 'your competitions',
    ...extra,
  }
}

function render(template: string, fields: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => fields[key] ?? '')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain text becomes a simple, readable HTML mail. */
function wrapHtml(body: string, subject: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:#fffcf6;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1240">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(26,18,64,.08)">
<tr><td style="background:#1a1240;padding:20px 28px">
  <div style="font-size:20px;font-weight:800;color:#fffcf6">Utkarsh</div>
  <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ffc44d;margin-top:2px">Heritage Festival</div>
</td></tr>
<tr><td style="padding:28px">
  <h1 style="margin:0 0 18px;font-size:20px;line-height:1.3">${escapeHtml(subject)}</h1>
  ${paragraphs}
</td></tr>
<tr><td style="padding:16px 28px;background:#fff7ea;font-size:12px;color:rgba(26,18,64,.6)">
  ISKCON Guwahati, Ulubari · You are receiving this because you registered for Utkarsh.
</td></tr>
</table></td></tr></table></body></html>`
}

async function sendOne(
  to: { email: string; name: string },
  subject: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const key = requireEnv('BREVO_API_KEY')
  const fromEmail = requireEnv('MAIL_FROM_EMAIL')
  const fromName = Deno.env.get('MAIL_FROM_NAME') ?? 'Utkarsh Heritage Festival'

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': key,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to.email, name: to.name }],
      subject,
      textContent: text,
      htmlContent: wrapHtml(text, subject),
    }),
  })

  if (res.ok) return { ok: true }

  const detail = await res.text()
  return { ok: false, error: `${res.status}: ${detail.slice(0, 300)}` }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    // --- who is calling? -------------------------------------------------
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return fail('Not signed in.', 401)

    const userRes = await fetch(`${requireEnv('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: requireEnv('SUPABASE_ANON_KEY'),
      },
    })
    if (!userRes.ok) return fail('Not signed in.', 401)
    const user = (await userRes.json()) as { id?: string }
    if (!user.id) return fail('Not signed in.', 401)

    // Being signed in is not enough — must be on the organiser list.
    const adminRes = await db(
      `admin_users?id=eq.${encodeURIComponent(user.id)}&is_active=eq.true&select=id`,
    )
    const admins = adminRes.ok ? ((await adminRes.json()) as unknown[]) : []
    if (admins.length === 0) return fail('You are not an organiser.', 403)

    // --- what are we sending? --------------------------------------------
    const body = await req.json().catch(() => ({}))
    const ids = body.registration_ids as string[] | undefined
    const template = (body.template as string | undefined) ?? 'custom'
    const subjectTpl = body.subject as string | undefined
    const bodyTpl = body.body as string | undefined
    const extra = (body.fields as Record<string, string> | undefined) ?? {}

    if (!Array.isArray(ids) || ids.length === 0) return fail('No recipients given.')
    if (ids.length > 60) return fail('Send in batches of 60 or fewer.')
    if (!subjectTpl?.trim() || !bodyTpl?.trim()) return fail('Subject and message are required.')

    const listRes = await db(
      `registrations?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,reg_code,full_name,email,fee_amount,payment_status,registration_tracks(track:tracks(name))`,
    )
    if (!listRes.ok) return fail('Could not read the registrations.', 500)
    const regs = (await listRes.json()) as Registration[]

    // --- send ------------------------------------------------------------
    const results: { id: string; ok: boolean; error?: string }[] = []
    const logRows: Record<string, unknown>[] = []

    for (const reg of regs) {
      const to = reg.email?.trim()
      if (!to) {
        results.push({ id: reg.id, ok: false, error: 'No email address' })
        continue
      }

      const fields = mergeFields(reg, extra)
      const subject = render(subjectTpl, fields)
      const text = render(bodyTpl, fields)

      let outcome: { ok: boolean; error?: string }
      try {
        outcome = await sendOne({ email: to, name: reg.full_name }, subject, text)
      } catch (err) {
        outcome = { ok: false, error: String(err).slice(0, 300) }
      }

      results.push({ id: reg.id, ...outcome })
      logRows.push({
        registration_id: reg.id,
        channel: 'email',
        template,
        recipient: to,
        status: outcome.ok ? 'sent' : 'failed',
        error: outcome.error ?? null,
        sent_by: user.id,
      })
    }

    // Log every attempt, successes and failures alike, so the admin screen can
    // show what happened and skip anyone already done. A duplicate 'sent' row
    // is refused by a unique index, which is not an error worth surfacing.
    if (logRows.length > 0) {
      await db('message_log', {
        method: 'POST',
        prefer: 'return=minimal,resolution=ignore-duplicates',
        body: JSON.stringify(logRows),
      })
    }

    return json({
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    })
  } catch (err) {
    console.error('send-email error', err)
    return fail('Something went wrong sending the messages.', 500)
  }
})
