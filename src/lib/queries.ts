import { supabase } from './supabase'
import type {
  AdminUser,
  CreateOrderResult,
  FestivalSettings,
  PublicStats,
  Registration,
  RegistrationDraft,
  RegistrationRow,
  SelectionAvailability,
  SelectionItem,
  StatusResult,
  SubmitResult,
  Track,
} from './types'

function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error
  return data as T
}

/* =========================================================================
   Public catalogue
   ========================================================================= */

export async function fetchTracks(includeInactive = false): Promise<Track[]> {
  let q = supabase.from('tracks').select('*').order('sort_order')
  if (!includeInactive) q = q.eq('is_active', true)
  return unwrap(await q)
}

/**
 * Hands back song slots held by registrations that were started and abandoned.
 * Safe for anyone to call — it only removes rows that are already expired by
 * the strict definition in the database.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const { data, error } = await supabase.rpc('release_expired_holds')
  if (error) throw error
  return (data as number) ?? 0
}

/**
 * Live availability for the bhajan song list. No personal data.
 *
 * Expired holds are released first, so a student is never shown a song as
 * full when the only thing holding it is somebody who walked away. Failure is
 * non-fatal: the counts are simply a little stale, and the database still
 * refuses to oversubscribe on submit.
 */
export async function fetchAvailability(trackId?: string): Promise<SelectionAvailability[]> {
  await releaseExpiredHolds().catch(() => {})

  let q = supabase.from('selection_availability').select('*').order('sort_order')
  if (trackId) q = q.eq('track_id', trackId)
  return unwrap(await q)
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.from('public_stats').select('*').single()
  if (error) throw error
  return data as PublicStats
}

const SETTING_FALLBACK: FestivalSettings = {
  registration: { open: false, fee: 99, closes_at: null },
  event: {
    edition: '2026',
    online_date: '',
    onsite_date: '',
    venue: 'ISKCON Guwahati, Ulubari',
    city: 'Guwahati, Assam',
  },
  payment: {
    upi_id: '',
    upi_name: '',
    methods: { upi_manual: true, pay_at_venue: true, razorpay: false },
  },
  contact: { email: '', phone: '' },
}

export async function fetchSettings(): Promise<FestivalSettings> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) throw error

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<
    string,
    unknown
  >

  return {
    registration: { ...SETTING_FALLBACK.registration, ...((map.registration as object) ?? {}) },
    event: { ...SETTING_FALLBACK.event, ...((map.event as object) ?? {}) },
    payment: {
      ...SETTING_FALLBACK.payment,
      ...((map.payment as object) ?? {}),
      // `methods` is nested, so a shallow spread would drop any key the stored
      // row happens to omit.
      methods: {
        ...SETTING_FALLBACK.payment.methods,
        ...(((map.payment as { methods?: object } | undefined)?.methods) ?? {}),
      },
    },
    contact: { ...SETTING_FALLBACK.contact, ...((map.contact as object) ?? {}) },
  }
}

/* =========================================================================
   Registration (public)
   ========================================================================= */

export async function submitRegistration(draft: RegistrationDraft): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_registration', {
    payload: {
      ...draft,
      class_level: draft.class_level != null ? String(draft.class_level) : '',
      entries: draft.entries.map((e) => ({
        ...e,
        members: e.members?.map((m, i) => ({
          ...m,
          class_level: m.class_level != null ? String(m.class_level) : '',
          sort_order: String(i),
        })),
      })),
    },
  })
  if (error) throw error
  return data as SubmitResult
}

export async function lookupRegistration(
  code: string,
  phone: string,
): Promise<StatusResult | null> {
  const { data, error } = await supabase.rpc('lookup_registration', {
    p_code: code,
    p_phone: phone,
  })
  if (error) throw error
  return (data as StatusResult | null) ?? null
}

/* =========================================================================
   Payments — every call here lands on an Edge Function, never on a table.
   The browser is never trusted with an amount or a payment status.
   ========================================================================= */

export async function createPaymentOrder(registrationId: string): Promise<CreateOrderResult> {
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { registration_id: registrationId },
  })
  if (error) throw error
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as CreateOrderResult
}

/**
 * A student reports the UTR for a UPI payment they just made. This does not
 * mark them paid — it moves them into the organiser's verification queue.
 */
export async function submitUpiReference(
  registrationId: string,
  reference: string,
): Promise<{ status: string; reference?: string; already?: boolean }> {
  const { data, error } = await supabase.rpc('submit_upi_reference', {
    p_registration_id: registrationId,
    p_reference: reference,
  })
  if (error) throw error
  return data as { status: string; reference?: string }
}

/** Organiser confirms a UPI reference against the bank statement. */
export async function confirmUpiPayment(id: string, note?: string): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_verified_by: session.user?.id ?? null,
      payment_verified_at: new Date().toISOString(),
      payment_notes: note ?? 'UPI reference verified',
      hold_expires_at: null,
    })
    .eq('id', id)
  if (error) throw error
}

/** Organiser could not find the reference on the statement. */
export async function rejectUpiPayment(id: string, note: string): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'pending',
      upi_reference: null,
      payment_verified_by: session.user?.id ?? null,
      payment_verified_at: new Date().toISOString(),
      payment_notes: note,
      // Give them a full day to sort it out rather than the usual short hold —
      // this is our judgement call, not their abandonment, and it should not
      // quietly delete a registration while someone is on the phone to them.
      hold_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function verifyPayment(payload: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<{ ok: boolean; reg_code: string }> {
  const { data, error } = await supabase.functions.invoke('verify-payment', { body: payload })
  if (error) throw error
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as { ok: boolean; reg_code: string }
}

/* =========================================================================
   Admin
   ========================================================================= */

const REGISTRATION_SELECT = `
  *,
  registration_tracks (
    *,
    track:tracks ( id, name, slug, accent, icon, mode ),
    selection_item:selection_items ( id, title ),
    team_members ( * )
  )
`

export async function fetchRegistrations(): Promise<RegistrationRow[]> {
  return unwrap(
    await supabase
      .from('registrations')
      .select(REGISTRATION_SELECT)
      .order('created_at', { ascending: false }),
  ) as RegistrationRow[]
}

export async function fetchRegistration(id: string): Promise<RegistrationRow | null> {
  const { data, error } = await supabase
    .from('registrations')
    .select(REGISTRATION_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as RegistrationRow | null
}

export async function updateRegistration(
  id: string,
  patch: Partial<Registration>,
): Promise<void> {
  const { error } = await supabase.from('registrations').update(patch).eq('id', id)
  if (error) throw error
}

/** Records a cash payment taken at the temple. */
export async function markPaidAtVenue(id: string, note?: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_notes: note ?? 'Collected at the venue',
      hold_expires_at: null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function setCertificateStatus(
  ids: string[],
  status: 'pending' | 'collected' | 'emailed' | 'whatsapp_sent',
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('registrations')
    .update({
      certificate_status: status,
      certificate_sent_at: status === 'pending' ? null : new Date().toISOString(),
    })
    .in('id', ids)
  if (error) throw error
}

export async function setAttendance(ids: string[], attended: boolean): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('registrations').update({ attended }).in('id', ids)
  if (error) throw error
}

export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase.from('registrations').delete().eq('id', id)
  if (error) throw error
}

export async function updateEntry(
  id: string,
  patch: Partial<{
    outcome: string
    score: number | null
    rank: number | null
    remarks: string | null
    award: string | null
  }>,
): Promise<void> {
  const { error } = await supabase.from('registration_tracks').update(patch).eq('id', id)
  if (error) throw error
}

export async function setEntryOutcomes(ids: string[], outcome: string): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('registration_tracks')
    .update({ outcome })
    .in('id', ids)
  if (error) throw error
}

/* ---- Catalogue management (super admin) --------------------------------- */

export async function fetchSelectionItems(trackId?: string): Promise<SelectionItem[]> {
  let q = supabase.from('selection_items').select('*').order('sort_order')
  if (trackId) q = q.eq('track_id', trackId)
  return unwrap(await q)
}

export async function upsertSelectionItem(
  item: Partial<SelectionItem> & { track_id: string; title: string },
): Promise<void> {
  const { error } = await supabase.from('selection_items').upsert(item)
  if (error) throw error
}

/**
 * Partial patch of one song.
 *
 * Deliberately `.update()` rather than `.upsert()`: an upsert builds its column
 * list from the keys you send, so a partial payload happens to leave the rest
 * alone — but that is a property of PostgREST, not something visible here. The
 * columns at stake are `taken_count` and `max_slots`, which together are the
 * song cap, so this uses the operation whose semantics are partial by
 * definition instead of relying on that.
 */
export async function updateSelectionItem(
  id: string,
  patch: Partial<SelectionItem>,
): Promise<void> {
  const { error } = await supabase.from('selection_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteSelectionItem(id: string): Promise<void> {
  const { error } = await supabase.from('selection_items').delete().eq('id', id)
  if (error) throw error
}

export async function updateTrack(id: string, patch: Partial<Track>): Promise<void> {
  const { error } = await supabase.from('tracks').update(patch).eq('id', id)
  if (error) throw error
}

/**
 * Writes a settings row.
 *
 * Upsert rather than update on purpose: a plain UPDATE against a key that does
 * not exist yet matches zero rows and reports no error, so the UI would show
 * "Saved." while nothing was written. That is exactly what happened when the
 * `payment` key was introduced on a database seeded before it existed.
 *
 * `is_public` is set because every settings key here has to be readable by
 * students — the row-level security policy on `settings` is
 * `using (is_public or is_admin())`, so a row saved with the default `false`
 * would be invisible to the public site.
 */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      { key, value, is_public: true, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    .select('key')

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error(
      `Nothing was saved for "${key}". You may not have permission to change settings — check you are signed in as a super admin.`,
    )
  }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return unwrap(await supabase.from('admin_users').select('*').order('created_at'))
}

export async function updateAdminUser(id: string, patch: Partial<AdminUser>): Promise<void> {
  const { error } = await supabase.from('admin_users').update(patch).eq('id', id)
  if (error) throw error
}

export async function recountSlots(): Promise<void> {
  const { error } = await supabase.rpc('recount_selection_slots')
  if (error) throw error
}

/* =========================================================================
   Messaging
   ========================================================================= */

export interface MessageLogRow {
  id: number
  registration_id: string
  channel: 'email' | 'whatsapp'
  template: string
  recipient: string
  status: 'sent' | 'failed'
  error: string | null
  sent_at: string
}

export async function fetchMessageLog(): Promise<MessageLogRow[]> {
  return unwrap(
    await supabase
      .from('message_log')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(2000),
  )
}

/**
 * Sends a templated email to up to 60 registrations. The Edge Function does
 * the rendering and the sending, and writes the message_log rows — the API key
 * never reaches the browser.
 */
export async function sendEmails(payload: {
  registration_ids: string[]
  template: string
  subject: string
  body: string
  fields?: Record<string, string>
}): Promise<{ sent: number; failed: number; results: { id: string; ok: boolean; error?: string }[] }> {
  const { data, error } = await supabase.functions.invoke('send-email', { body: payload })
  if (error) throw error
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
  return data as { sent: number; failed: number; results: { id: string; ok: boolean; error?: string }[] }
}

/**
 * Records that a WhatsApp message was sent. WhatsApp cannot confirm delivery
 * to us — a person tapped Send — so this is the organiser's own tick, and it
 * is what makes a long run resumable.
 */
export async function logWhatsAppSent(
  registrationId: string,
  template: string,
  recipient: string,
): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase.from('message_log').insert({
    registration_id: registrationId,
    channel: 'whatsapp',
    template,
    recipient,
    status: 'sent',
    sent_by: session.user?.id ?? null,
  })
  // A duplicate means it was already ticked off. Not worth surfacing.
  if (error && !/duplicate key/i.test(error.message)) throw error
}

export async function unlogMessage(
  registrationId: string,
  channel: 'email' | 'whatsapp',
  template: string,
): Promise<void> {
  const { error } = await supabase
    .from('message_log')
    .delete()
    .eq('registration_id', registrationId)
    .eq('channel', channel)
    .eq('template', template)
  if (error) throw error
}

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  detail?: unknown,
): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  await supabase.from('audit_log').insert({
    actor_id: session.user?.id ?? null,
    actor_email: session.user?.email ?? null,
    action,
    entity,
    entity_id: entityId,
    detail: detail ?? null,
  })
}
