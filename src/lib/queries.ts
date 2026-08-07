import { supabase } from './supabase'
import type {
  AdminUser,
  Category,
  FestivalSettings,
  GalleryItem,
  PublicStats,
  Registration,
  RegistrationDraft,
  RegistrationRow,
  School,
  SelectionAvailability,
  SelectionItem,
  StatusResult,
  SubmitResult,
  Testimonial,
  Track,
  TrackCategory,
} from './types'

/** Throws on error so callers can rely on a value. */
function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error
  return data as T
}

/* =========================================================================
   Public catalogue
   ========================================================================= */

export async function fetchCategories(): Promise<Category[]> {
  return unwrap(
    await supabase.from('categories').select('*').order('sort_order'),
  )
}

export async function fetchTracks(includeInactive = false): Promise<Track[]> {
  let q = supabase.from('tracks').select('*').order('sort_order')
  if (!includeInactive) q = q.eq('is_active', true)
  return unwrap(await q)
}

export async function fetchTrackBySlug(slug: string): Promise<Track | null> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchTrackCategories(): Promise<TrackCategory[]> {
  return unwrap(await supabase.from('track_categories').select('*'))
}

export async function fetchSchools(includeInactive = false): Promise<School[]> {
  let q = supabase.from('schools').select('*').order('name')
  if (!includeInactive) q = q.eq('is_active', true)
  return unwrap(await q)
}

/** Live availability for every song / sloka / character. No personal data. */
export async function fetchAvailability(trackId?: string): Promise<SelectionAvailability[]> {
  let q = supabase.from('selection_availability').select('*').order('sort_order')
  if (trackId) q = q.eq('track_id', trackId)
  return unwrap(await q)
}

export async function fetchGallery(): Promise<GalleryItem[]> {
  return unwrap(
    await supabase
      .from('gallery_items')
      .select('*')
      .order('year', { ascending: false })
      .order('sort_order'),
  )
}

export async function fetchTestimonials(includeUnpublished = false): Promise<Testimonial[]> {
  let q = supabase.from('testimonials').select('*').order('sort_order')
  if (!includeUnpublished) q = q.eq('is_published', true)
  return unwrap(await q)
}

export async function fetchPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.from('public_stats').select('*').single()
  if (error) throw error
  return data as PublicStats
}

const SETTING_FALLBACK: FestivalSettings = {
  registration: { open: false, max_tracks_per_student: 3, closes_at: null },
  event: {
    edition: '2026',
    stage1_label: 'School Round',
    stage1_window: 'At your school',
    stage2_label: 'Grand Finale',
    stage2_date: '',
    venue: 'ISKCON Ulubari, Guwahati',
    city: 'Guwahati, Assam',
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
    registration: {
      ...SETTING_FALLBACK.registration,
      ...((map.registration as object) ?? {}),
    },
    event: { ...SETTING_FALLBACK.event, ...((map.event as object) ?? {}) },
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
   Admin
   ========================================================================= */

const REGISTRATION_SELECT = `
  *,
  category:categories ( id, name, code ),
  school:schools ( id, name ),
  registration_tracks (
    *,
    track:tracks ( id, name, slug, accent, icon ),
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

export async function deleteRegistration(id: string): Promise<void> {
  const { error } = await supabase.from('registrations').delete().eq('id', id)
  if (error) throw error
}

export async function updateEntry(
  id: string,
  patch: Partial<{
    outcome: string
    stage1_score: number | null
    stage1_rank: number | null
    stage1_remarks: string | null
    stage2_score: number | null
    stage2_rank: number | null
    stage2_remarks: string | null
    award: string | null
  }>,
): Promise<void> {
  const { error } = await supabase.from('registration_tracks').update(patch).eq('id', id)
  if (error) throw error
}

/** Promote or demote a batch of entries in one round trip. */
export async function setEntryOutcomes(
  ids: string[],
  outcome: string,
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('registration_tracks')
    .update({ outcome })
    .in('id', ids)
  if (error) throw error
}

/** Move the students behind these entries into the finals (or back). */
export async function setRegistrationStage(
  registrationIds: string[],
  stage: 'school_round' | 'finals',
): Promise<void> {
  if (registrationIds.length === 0) return
  const { error } = await supabase
    .from('registrations')
    .update({ stage })
    .in('id', registrationIds)
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

export async function deleteSelectionItem(id: string): Promise<void> {
  const { error } = await supabase.from('selection_items').delete().eq('id', id)
  if (error) throw error
}

export async function updateTrack(id: string, patch: Partial<Track>): Promise<void> {
  const { error } = await supabase.from('tracks').update(patch).eq('id', id)
  if (error) throw error
}

export async function upsertSchool(school: Partial<School> & { name: string; slug: string }) {
  const { error } = await supabase.from('schools').upsert(school)
  if (error) throw error
}

export async function deleteSchool(id: string): Promise<void> {
  const { error } = await supabase.from('schools').delete().eq('id', id)
  if (error) throw error
}

export async function upsertGalleryItem(
  item: Partial<GalleryItem> & { year: number; image_url: string },
): Promise<void> {
  const { error } = await supabase.from('gallery_items').upsert(item)
  if (error) throw error
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const { error } = await supabase.from('gallery_items').delete().eq('id', id)
  if (error) throw error
}

export async function upsertTestimonial(
  item: Partial<Testimonial> & { student_name: string; quote: string },
): Promise<void> {
  const { error } = await supabase.from('testimonials').upsert(item)
  if (error) throw error
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) throw error
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
  if (error) throw error
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return unwrap(
    await supabase.from('admin_users').select('*').order('created_at'),
  )
}

export async function updateAdminUser(
  id: string,
  patch: Partial<AdminUser>,
): Promise<void> {
  const { error } = await supabase.from('admin_users').update(patch).eq('id', id)
  if (error) throw error
}

export async function recountSlots(): Promise<void> {
  const { error } = await supabase.rpc('recount_selection_slots')
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
