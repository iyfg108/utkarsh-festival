/** Mirrors supabase/schema.sql. Keep in step when you change the schema. */

export type AdminRole = 'super_admin' | 'school_coordinator' | 'judge'
export type RegStage = 'school_round' | 'finals'
export type RegStatus = 'confirmed' | 'withdrawn' | 'disqualified'
export type EntryOutcome =
  | 'registered'
  | 'shortlisted'
  | 'not_shortlisted'
  | 'finalist'
  | 'winner'

export interface Category {
  id: string
  code: string
  name: string
  description: string | null
  min_class: number
  max_class: number
  sort_order: number
}

export interface School {
  id: string
  name: string
  slug: string
  area: string | null
  address: string | null
  coordinator_name: string | null
  coordinator_phone: string | null
  coordinator_email: string | null
  stage1_date: string | null
  stage1_venue: string | null
  is_active: boolean
}

export interface Track {
  id: string
  slug: string
  name: string
  sanskrit_name: string | null
  tagline: string | null
  description: string | null
  icon: string
  accent: AccentKey
  rules: string[]
  what_to_bring: string[]
  duration_minutes: number | null
  is_team: boolean
  min_team_size: number
  max_team_size: number
  requires_selection: boolean
  selection_label: string | null
  selection_help: string | null
  is_active: boolean
  sort_order: number
}

export type AccentKey =
  | 'saffron'
  | 'peacock'
  | 'magenta'
  | 'gold'
  | 'indigo'
  | 'rose'
  | 'teal'
  | 'amber'

export interface TrackCategory {
  track_id: string
  category_id: string
}

export interface SelectionItem {
  id: string
  track_id: string
  category_id: string | null
  title: string
  subtitle: string | null
  reference_url: string | null
  notes: string | null
  max_slots: number
  taken_count: number
  is_active: boolean
  sort_order: number
}

/** The public `selection_availability` view. */
export interface SelectionAvailability {
  id: string
  track_id: string
  category_id: string | null
  title: string
  subtitle: string | null
  reference_url: string | null
  notes: string | null
  max_slots: number
  taken_count: number
  slots_left: number
  is_full: boolean
  sort_order: number
}

export interface Registration {
  id: string
  reg_code: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  class_level: number
  section: string | null
  category_id: string
  school_id: string | null
  school_name_other: string | null
  guardian_name: string
  guardian_phone: string
  student_phone: string | null
  email: string | null
  address: string | null
  stage: RegStage
  status: RegStatus
  consent_media: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RegistrationTrack {
  id: string
  registration_id: string
  track_id: string
  selection_item_id: string | null
  team_name: string | null
  outcome: EntryOutcome
  stage1_score: number | null
  stage1_rank: number | null
  stage1_remarks: string | null
  stage2_score: number | null
  stage2_rank: number | null
  stage2_remarks: string | null
  award: string | null
  created_at: string
}

export interface TeamMember {
  id: string
  registration_track_id: string
  full_name: string
  class_level: number | null
  role: string | null
  sort_order: number
}

export interface GalleryItem {
  id: string
  year: number
  title: string | null
  caption: string | null
  image_url: string
  track_id: string | null
  is_featured: boolean
  sort_order: number
}

export interface Testimonial {
  id: string
  student_name: string
  school_name: string | null
  year: number | null
  track_name: string | null
  quote: string
  avatar_url: string | null
  is_published: boolean
  sort_order: number
}

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: AdminRole
  school_id: string | null
  is_active: boolean
  created_at: string
}

export interface PublicStats {
  total_registrations: number
  total_entries: number
  total_schools: number
  total_tracks: number
}

/* -------------------------------------------------------------------------
   Settings — stored as jsonb rows keyed by name
   ------------------------------------------------------------------------- */
export interface RegistrationSettings {
  open: boolean
  max_tracks_per_student: number
  closes_at: string | null
}

export interface EventSettings {
  edition: string
  stage1_label: string
  stage1_window: string
  stage2_label: string
  stage2_date: string
  stage2_note?: string
  venue: string
  venue_map_url?: string
  city: string
}

export interface ContactSettings {
  email: string
  phone: string
  whatsapp?: string
  instagram?: string
}

export interface FestivalSettings {
  registration: RegistrationSettings
  event: EventSettings
  contact: ContactSettings
}

/* -------------------------------------------------------------------------
   Registration submission payload (matches submit_registration)
   ------------------------------------------------------------------------- */
export interface EntryDraft {
  track_id: string
  selection_item_id?: string | null
  team_name?: string | null
  members?: { full_name: string; class_level?: number | null; role?: string | null }[]
}

export interface RegistrationDraft {
  full_name: string
  date_of_birth?: string | null
  gender?: string | null
  class_level: number | null
  section?: string | null
  school_id?: string | null
  school_name_other?: string | null
  guardian_name: string
  guardian_phone: string
  student_phone?: string | null
  email?: string | null
  address?: string | null
  consent_media: boolean
  entries: EntryDraft[]
}

export interface SubmitResult {
  reg_code: string
  registration_id: string
  full_name: string
}

/** Shape returned by lookup_registration(). */
export interface StatusResult {
  reg_code: string
  full_name: string
  class_level: number
  stage: RegStage
  status: RegStatus
  category: string
  school: string
  created_at: string
  entries: {
    track: string
    track_slug: string
    selection: string | null
    team_name: string | null
    outcome: EntryOutcome
    award: string | null
  }[]
}

/* -------------------------------------------------------------------------
   Admin composite rows
   ------------------------------------------------------------------------- */
export interface RegistrationRow extends Registration {
  category: Pick<Category, 'id' | 'name' | 'code'> | null
  school: Pick<School, 'id' | 'name'> | null
  registration_tracks: (RegistrationTrack & {
    track: Pick<Track, 'id' | 'name' | 'slug' | 'accent' | 'icon'> | null
    selection_item: Pick<SelectionItem, 'id' | 'title'> | null
    team_members?: TeamMember[]
  })[]
}
