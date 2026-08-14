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
  min_class: number
  max_class: number
  is_team: boolean
  min_team_size: number
  max_team_size: number
  requires_selection: boolean
  selection_label: string | null
  selection_help: string | null
  is_active: boolean
  sort_order: number
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
  sort_order: number
}

export interface Registration {
  id: string
  reg_code: string
  full_name: string
  date_of_birth: string
  gender: string
  class_level: number
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

export interface GalleryItem {
  id: string
  year: number
  title: string | null
  caption: string | null
  image_url: string
  is_featured: boolean
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
    selection: string | null
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
    track: Pick<Track, 'id' | 'name' | 'slug' | 'accent' | 'icon' | 'mode'> | null
    selection_item: Pick<SelectionItem, 'id' | 'title'> | null
    team_members?: TeamMember[]
  })[]
}
