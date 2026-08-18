/** Mirrors supabase/schema.sql (v2). Keep in step when you change the schema. */

export type AdminRole = 'super_admin' | 'judge'
export type RegStatus = 'confirmed' | 'withdrawn' | 'disqualified'
export type EntryOutcome = 'registered' | 'participated' | 'absent' | 'winner'
export type EventMode = 'online' | 'onsite'
export type PaymentMethod = 'razorpay' | 'upi_manual' | 'pay_at_venue'
export type PaymentStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'paid'
  | 'failed'
  | 'waived'
export type CertificateStatus = 'pending' | 'collected' | 'emailed' | 'whatsapp_sent'

export type AccentKey =
  | 'saffron'
  | 'peacock'
  | 'magenta'
  | 'gold'
  | 'indigo'
  | 'rose'
  | 'teal'
  | 'amber'

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
  mode: EventMode
  event_date: string | null
  /** "09:00:00" — when this competition runs on its day. */
  start_time: string | null
  end_time: string | null
  /** Derived in the database: one hour before start_time. */
  reporting_time: string | null
  /** Entries for this competition close after this date. Per day, not festival-wide. */
  registration_closes_at: string | null
  min_class: number
  max_class: number
  is_team: boolean
  min_team_size: number
  max_team_size: number
  requires_selection: boolean
  selection_label: string | null
  selection_help: string | null
  /** Essay topics or Gita verses to prepare, grouped by class band. */
  syllabus: Syllabus | null
  is_active: boolean
  sort_order: number
}

/**
 * Reference material shown on a competition page — what the student has to
 * prepare. Two shapes share one structure: `topics` is a plain list, `verses`
 * carries Sanskrit and a link to the verse on Vedabase.
 */
export interface Syllabus {
  kind: 'topics' | 'verses'
  heading: string
  /** The one line students must not miss — rendered bold, above the intro. */
  lead?: string
  intro?: string
  groups: SyllabusGroup[]
}

export interface SyllabusGroup {
  /** Labelled by class ("Class 5 to 7"), never by group letter — the festival's
   *  A/B/C bands are coarser, and two numbering schemes would confuse students. */
  label: string
  /** How much to prepare, e.g. "Learn any THREE verses". */
  note?: string
  items: SyllabusItem[]
}

export interface SyllabusItem {
  /** The topic, or the Sanskrit of the verse with newlines between lines. */
  text: string
  /** Verses only: the citation, e.g. "BG 2.13". */
  ref?: string
  /** A one-line meaning in plain English. */
  gist?: string
  /** Anything a student should know before choosing this one. */
  note?: string
  /** Verses only: Vedabase path segment, e.g. "2/13" or "12/13-14". */
  path?: string
}

export interface SelectionItem {
  id: string
  track_id: string
  title: string
  subtitle: string | null
  reference_url: string | null
  notes: string | null
  max_slots: number
  taken_count: number
  /** A category rather than one song — the student names the piece. */
  requires_detail: boolean
  detail_label: string | null
  /** No cap — show "Open to all" rather than a count. */
  unlimited: boolean
  is_active: boolean
  sort_order: number
}

/** The public `selection_availability` view. */
export interface SelectionAvailability {
  id: string
  track_id: string
  title: string
  subtitle: string | null
  reference_url: string | null
  notes: string | null
  max_slots: number
  taken_count: number
  slots_left: number
  is_full: boolean
  requires_detail: boolean
  detail_label: string | null
  unlimited: boolean
  sort_order: number
}

export interface Registration {
  id: string
  reg_code: string
  full_name: string
  date_of_birth: string
  gender: string
  class_level: number
  /** Derived in the database from class_level. A = I-IV, B = V-VII, C = VIII-X. */
  class_group: 'A' | 'B' | 'C'
  school_name: string
  guardian_name: string
  guardian_phone: string
  student_phone: string | null
  email: string | null
  whatsapp: string | null
  address: string | null
  fee_amount: number
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  upi_reference: string | null
  payment_verified_by: string | null
  payment_verified_at: string | null
  paid_at: string | null
  payment_notes: string | null
  hold_expires_at: string | null
  attended: boolean
  certificate_status: CertificateStatus
  certificate_sent_at: string | null
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
  selection_detail: string | null
  team_name: string | null
  outcome: EntryOutcome
  score: number | null
  rank: number | null
  remarks: string | null
  award: string | null
  created_at: string
}

export interface TeamMember {
  id: string
  registration_track_id: string
  full_name: string
  class_level: number | null
  sort_order: number
}

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: AdminRole
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
   Settings
   ------------------------------------------------------------------------- */
export interface RegistrationSettings {
  open: boolean
  fee: number
  closes_at: string | null
  /** Minutes an unpaid registration holds its bhajan song slot. */
  hold_minutes?: number
}

export interface EventSettings {
  edition: string
  online_date: string
  onsite_date: string
  venue: string
  venue_map_url?: string
  city: string
}

export interface PaymentSettings {
  /** The VPA money is collected to, e.g. "iyfguwahati@sbi". */
  upi_id: string
  /** Payee name shown in the student's UPI app. */
  upi_name: string
  /** Which methods students may choose. Razorpay can be switched on later. */
  methods: {
    upi_manual: boolean
    pay_at_venue: boolean
    razorpay: boolean
  }
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
  payment: PaymentSettings
  contact: ContactSettings
}

/* -------------------------------------------------------------------------
   Registration submission
   ------------------------------------------------------------------------- */
export interface EntryDraft {
  track_id: string
  selection_item_id?: string | null
  /** The piece named, when the chosen item requires_detail. */
  selection_detail?: string | null
  team_name?: string | null
  members?: { full_name: string; class_level?: number | null }[]
}

export interface RegistrationDraft {
  full_name: string
  date_of_birth: string
  gender: string
  class_level: number | null
  school_name: string
  guardian_name: string
  guardian_phone: string
  student_phone?: string | null
  email?: string | null
  whatsapp?: string | null
  address?: string | null
  payment_method: PaymentMethod
  consent_media: boolean
  entries: EntryDraft[]
}

export interface SubmitResult {
  reg_code: string
  registration_id: string
  full_name: string
  fee_amount: number
  payment_method: PaymentMethod
  has_onsite: boolean
  /** When the song slot is released if unpaid. Null = never expires. */
  hold_expires_at: string | null
}

/** Shape returned by lookup_registration(). */
export interface StatusResult {
  registration_id: string
  reg_code: string
  full_name: string
  class_level: number
  /** Derived in the database from class_level. A = I-IV, B = V-VII, C = VIII-X. */
  class_group: 'A' | 'B' | 'C'
  school_name: string
  status: RegStatus
  fee_amount: number
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  upi_reference: string | null
  hold_expires_at: string | null
  certificate_status: CertificateStatus
  created_at: string
  entries: {
    track: string
    track_slug: string
    mode: EventMode
    event_date: string | null
    /** The piece they named, or the catalogue title for ordinary songs. */
    selection: string | null
    /** The list entry they picked, e.g. "Borgeet". */
    selection_category?: string | null
    team_name: string | null
    outcome: EntryOutcome
    award: string | null
  }[]
}

/* -------------------------------------------------------------------------
   Payments
   ------------------------------------------------------------------------- */
export interface CreateOrderResult {
  order_id: string
  amount: number
  currency: string
  key_id: string
  reg_code: string
  name: string
  email: string
  contact: string
  already_paid?: boolean
}

/* -------------------------------------------------------------------------
   Admin composite row
   ------------------------------------------------------------------------- */
export interface RegistrationRow extends Registration {
  registration_tracks: (RegistrationTrack & {
    track: Pick<Track, 'id' | 'name' | 'slug' | 'accent' | 'icon' | 'mode' | 'event_date'> | null
    selection_item: Pick<SelectionItem, 'id' | 'title'> | null
    team_members?: TeamMember[]
  })[]
}
