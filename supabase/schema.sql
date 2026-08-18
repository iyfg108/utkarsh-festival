-- ============================================================================
--  UTKARSH HERITAGE FESTIVAL — database schema (v2)
--
--  Run reset.sql first if you already installed v1, then this file, then
--  seed.sql. All three are safe to re-run.
--
--  Design notes
--  ------------
--  * ONE stage. Competitions run on two days: the online events (Quiz, Essay)
--    on 23 August, and the onsite events at ISKCON Ulubari on 30 August.
--  * No age categories. Open to Class 1–10; a student may enter every
--    competition if they want to.
--  * Only Devotional Bhajan uses a capped selection list, so we do not hear
--    the same song fifteen times. The cap is enforced by the database, not the
--    UI — see fn_sync_selection_count.
--  * Money is never trusted from the browser. `payment_status` can only be
--    moved to 'paid' by the service role (the Edge Functions that verify a
--    Razorpay signature) or by an admin recording a cash payment at the venue.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin create type admin_role as enum ('super_admin','judge');
exception when duplicate_object then null; end $$;

do $$ begin create type reg_status as enum ('confirmed','withdrawn','disqualified');
exception when duplicate_object then null; end $$;

do $$ begin create type entry_outcome as enum ('registered','participated','absent','winner');
exception when duplicate_object then null; end $$;

do $$ begin create type event_mode as enum ('online','onsite');
exception when duplicate_object then null; end $$;

do $$ begin create type payment_method as enum ('razorpay','upi_manual','pay_at_venue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum
    ('pending','awaiting_verification','paid','failed','waived');
exception when duplicate_object then null; end $$;

-- Upgrade path: when the types already exist the blocks above do nothing, so
-- add the newer values explicitly. Safe to re-run, and safe on a fresh install
-- where the values are already present.
alter type payment_method add value if not exists 'upi_manual';
alter type payment_status add value if not exists 'awaiting_verification';

do $$ begin
  create type certificate_status as enum ('pending','collected','emailed','whatsapp_sent');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helper
-- ---------------------------------------------------------------------------
create or replace function fn_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Competitions
-- ---------------------------------------------------------------------------
create table if not exists tracks (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  name               text not null,
  sanskrit_name      text,
  tagline            text,
  description        text,
  icon               text not null default 'sparkles',
  accent             text not null default 'saffron',
  rules              text[] not null default '{}',
  what_to_bring      text[] not null default '{}',
  duration_minutes   int,
  mode               event_mode not null default 'onsite',
  event_date         date,
  -- When the competition actually runs on its day. Two competitions on the
  -- same date can sit in different slots (art in the morning, bhajan in the
  -- afternoon), so this belongs to the competition, not to the day.
  start_time         time,
  end_time           time,
  -- Everyone reports an hour before their competition starts, so 9 am becomes
  -- 8 am and 4 pm becomes 3 pm. Derived rather than stored by hand: the times
  -- have moved more than once, and a reporting time that quietly disagrees
  -- with the start time would put children at the temple at the wrong hour.
  reporting_time     time generated always as (start_time - interval '1 hour') stored,
  -- Entries close per competition, not for the festival as a whole: the two
  -- days need different cut-offs so there is time to build each day's running
  -- order. Null means "use the festival-wide date in settings".
  registration_closes_at date,
  min_class          int not null default 1,
  max_class          int not null default 10,
  is_team            boolean not null default false,
  min_team_size      int not null default 1,
  max_team_size      int not null default 1,
  -- Only Bhajan sets this today. Kept generic so Art / Fancy Dress can switch
  -- it on later without a migration (see TODO.md — student profile idea).
  requires_selection boolean not null default false,
  selection_label    text,
  selection_help     text,
  -- What a student has to prepare: essay topics, or the Gita verses to learn,
  -- grouped by class band. Kept as JSON rather than its own table because it is
  -- read-only reference material rendered as one block — nothing joins to it,
  -- and holding it here means changing a topic is one UPDATE with no redeploy.
  -- Shape: { kind, heading, intro, groups: [{ label, note, items: [...] }] }
  syllabus           jsonb,
  is_active          boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  constraint tracks_team_size check (min_team_size >= 1 and max_team_size >= min_team_size),
  constraint tracks_class_range check (min_class >= 1 and max_class <= 12 and min_class <= max_class),
  constraint tracks_selection_label check (not requires_selection or selection_label is not null)
);

-- ---------------------------------------------------------------------------
-- Songs students pick from (Devotional Bhajan)
-- ---------------------------------------------------------------------------
create table if not exists selection_items (
  id            uuid primary key default gen_random_uuid(),
  track_id      uuid not null references tracks(id) on delete cascade,
  title         text not null,
  subtitle      text,
  reference_url text,
  notes         text,
  max_slots     int  not null default 3,
  taken_count   int  not null default 0,
  -- Some choices are a category rather than a specific song: "Borgeet" is a
  -- whole tradition, and "Something else" is by definition open. For those the
  -- student types which piece they will actually sing, so the running order and
  -- the judges know what is coming.
  requires_detail boolean not null default false,
  detail_label  text,
  is_active     boolean not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint selection_items_max_slots check (max_slots >= 1),
  -- The guarantee: nothing can push taken_count past max_slots.
  constraint selection_items_not_oversubscribed
    check (taken_count >= 0 and taken_count <= max_slots)
);

-- `create table if not exists` above is a no-op on a database that already has
-- the table, so columns added after the first release need saying explicitly.
do $$ begin
  alter table tracks add column start_time time;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table tracks add column end_time time;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table tracks add column registration_closes_at date;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table tracks add column reporting_time time
    generated always as (start_time - interval '1 hour') stored;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table tracks add column syllabus jsonb;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table selection_items add column requires_detail boolean not null default false;
exception when duplicate_column then null; end $$;

do $$ begin
  alter table selection_items add column detail_label text;
exception when duplicate_column then null; end $$;


create index if not exists selection_items_track_idx
  on selection_items (track_id) where is_active;

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
create sequence if not exists registration_code_seq start 1001;

create table if not exists registrations (
  id                  uuid primary key default gen_random_uuid(),
  reg_code            text unique not null,

  -- student
  full_name           text not null,
  date_of_birth       date not null,
  gender              text not null,
  class_level         int  not null,
  school_name         text not null,

  -- contact: guardian phone always, plus at least one of email / whatsapp
  guardian_name       text not null,
  guardian_phone      text not null,
  student_phone       text,
  email               text,
  whatsapp            text,
  address             text,

  -- money
  fee_amount          int not null default 99,
  payment_method      payment_method,
  payment_status      payment_status not null default 'pending',
  razorpay_order_id   text,
  razorpay_payment_id text,
  -- UPI paid directly to our account: the student types the UTR reference from
  -- their payment app, an organiser checks it against the bank statement.
  upi_reference       text,
  payment_verified_by uuid references auth.users(id),
  payment_verified_at timestamptz,
  paid_at             timestamptz,
  payment_notes       text,
  -- An unpaid registration is a HOLD, not a confirmation. It occupies a bhajan
  -- song slot, so it must not do so forever: see release_expired_holds().
  -- Null means "never expires" — used for paid entries and for students who
  -- chose to pay cash at the temple, which is a promise, not an abandonment.
  hold_expires_at     timestamptz,

  -- day-of
  attended            boolean not null default false,
  certificate_status  certificate_status not null default 'pending',
  certificate_sent_at timestamptz,

  status              reg_status not null default 'confirmed',
  consent_media       boolean not null default false,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint registrations_class check (class_level between 1 and 10),
  constraint registrations_gender check (gender in ('female','male','other')),
  constraint registrations_school check (length(btrim(school_name)) >= 2),
  constraint registrations_phone
    check (guardian_phone ~ '^[+]?[0-9][0-9 ()-]{7,19}$'),
  -- We must be able to reach them. WhatsApp is required and email optional:
  -- every guardian here has WhatsApp, far from all of them read email, and
  -- joining details and certificates both go out over it.
  constraint registrations_reachable check (
    nullif(btrim(coalesce(whatsapp, '')), '') is not null
  ),
  constraint registrations_paid_has_time
    check (payment_status <> 'paid' or paid_at is not null)
);

-- Upgrade path for a database created before UPI was added. `create table if
-- not exists` above leaves an existing table untouched, so add the columns
-- explicitly. No-ops on a fresh install.
alter table registrations add column if not exists upi_reference       text;
alter table registrations add column if not exists payment_verified_by uuid references auth.users(id);
alter table registrations add column if not exists payment_verified_at timestamptz;
alter table registrations add column if not exists hold_expires_at     timestamptz;

-- The poster advertises three class groups, and judging is done within them.
-- Generated rather than stored by hand: it is purely a function of the class,
-- so it can never drift out of step with it.
--   A = Class I-IV, B = Class V-VII, C = Class VIII-X
do $$ begin
  alter table registrations add column class_group text
    generated always as (
      case when class_level <= 4 then 'A'
           when class_level <= 7 then 'B'
           else 'C' end
    ) stored;
exception when duplicate_column then null; end $$;

create index if not exists registrations_group_idx on registrations (class_group);

create unique index if not exists registrations_dedupe_idx
  on registrations (lower(btrim(full_name)), guardian_phone);

-- Two students must not claim the same UPI transaction.
create unique index if not exists registrations_upi_reference_idx
  on registrations (upper(btrim(upi_reference)))
  where upi_reference is not null;

create index if not exists registrations_payment_idx on registrations (payment_status);
create index if not exists registrations_order_idx   on registrations (razorpay_order_id);
create index if not exists registrations_created_idx on registrations (created_at desc);

drop trigger if exists registrations_touch on registrations;
create trigger registrations_touch before update on registrations
  for each row execute function fn_touch_updated_at();

-- ---------------------------------------------------------------------------
-- One row per competition entered
-- ---------------------------------------------------------------------------
create table if not exists registration_tracks (
  id                uuid primary key default gen_random_uuid(),
  registration_id   uuid not null references registrations(id) on delete cascade,
  track_id          uuid not null references tracks(id) on delete restrict,
  selection_item_id uuid references selection_items(id) on delete restrict,
  -- Filled in when the chosen song has requires_detail set — the actual piece.
  selection_detail  text,
  team_name         text,
  outcome           entry_outcome not null default 'registered',
  score             numeric(5,2),
  rank              int,
  remarks           text,
  award             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (registration_id, track_id),
  constraint reg_tracks_score check (score is null or score between 0 and 100)
);

create index if not exists registration_tracks_track_idx     on registration_tracks (track_id);
create index if not exists registration_tracks_selection_idx on registration_tracks (selection_item_id);

-- Added after the first release, so existing databases need it explicitly.
do $$ begin
  alter table registration_tracks add column selection_detail text;
exception when duplicate_column then null; end $$;
create index if not exists registration_tracks_reg_idx       on registration_tracks (registration_id);

drop trigger if exists registration_tracks_touch on registration_tracks;
create trigger registration_tracks_touch before update on registration_tracks
  for each row execute function fn_touch_updated_at();

create table if not exists team_members (
  id                    uuid primary key default gen_random_uuid(),
  registration_track_id uuid not null references registration_tracks(id) on delete cascade,
  full_name             text not null,
  class_level           int,
  sort_order            int not null default 0
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table if not exists gallery_items (
  id          uuid primary key default gen_random_uuid(),
  year        int  not null,
  title       text,
  caption     text,
  image_url   text not null,
  is_featured boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin, settings, audit, payment events
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  email      text not null,
  role       admin_role not null default 'judge',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists audit_log (
  id          bigserial primary key,
  actor_id    uuid references auth.users(id),
  actor_email text,
  action      text not null,
  entity      text not null,
  entity_id   text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_idx on audit_log (created_at desc);

-- Every gateway callback we act on, kept for reconciliation and idempotency.
create table if not exists payment_events (
  id              bigserial primary key,
  registration_id uuid references registrations(id) on delete set null,
  event_id        text unique,
  event_type      text not null,
  order_id        text,
  payment_id      text,
  amount          int,
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists payment_events_order_idx on payment_events (order_id);

-- ---------------------------------------------------------------------------
-- Every message we send a student, on either channel.
--
-- This is what makes a WhatsApp run resumable. WhatsApp cannot be sent
-- automatically — a person taps Send on each pre-filled message — so without a
-- record of who has been done, a volunteer who stops half way has no way back
-- in, and students get messaged twice. Email rows are written by the
-- send-email function; WhatsApp rows are written when an organiser ticks a
-- student off.
-- ---------------------------------------------------------------------------
create table if not exists message_log (
  id              bigserial primary key,
  registration_id uuid not null references registrations(id) on delete cascade,
  channel         text not null check (channel in ('email', 'whatsapp')),
  -- Which message this was: 'confirmation', 'online_reminder',
  -- 'venue_reminder', 'payment_reminder', 'certificate'. Free text so a new
  -- template needs no migration.
  template        text not null,
  recipient       text not null,
  status          text not null default 'sent' check (status in ('sent', 'failed')),
  error           text,
  sent_by         uuid references auth.users(id),
  sent_at         timestamptz not null default now()
);

create index if not exists message_log_reg_idx
  on message_log (registration_id, template);
create index if not exists message_log_sent_idx on message_log (sent_at desc);

-- One successful send per student per template per channel. A second attempt
-- is refused rather than quietly duplicating — the admin screen reads this to
-- grey out anyone already done.
create unique index if not exists message_log_once_idx
  on message_log (registration_id, channel, template)
  where status = 'sent';

-- ============================================================================
--  Slot accounting  (Devotional Bhajan)
-- ============================================================================

-- Race-safety: two students submit for the last slot of the same song at the
-- same instant. Both reach this trigger and issue
-- `update selection_items set taken_count = taken_count + 1`. Postgres takes a
-- row lock, so the second blocks until the first commits, then re-reads the
-- committed row, computes max_slots + 1, and the
-- selection_items_not_oversubscribed CHECK rejects it. The UI's availability
-- display is a courtesy; this is the actual guarantee.
create or replace function fn_sync_selection_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.selection_item_id is not null then
      update selection_items set taken_count = taken_count + 1
        where id = new.selection_item_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.selection_item_id is not null then
      update selection_items set taken_count = taken_count - 1
        where id = old.selection_item_id;
    end if;
  elsif tg_op = 'UPDATE'
        and old.selection_item_id is distinct from new.selection_item_id then
    if old.selection_item_id is not null then
      update selection_items set taken_count = taken_count - 1
        where id = old.selection_item_id;
    end if;
    if new.selection_item_id is not null then
      update selection_items set taken_count = taken_count + 1
        where id = new.selection_item_id;
    end if;
  end if;
  return null;
end $$;

drop trigger if exists registration_tracks_selection_count on registration_tracks;
create trigger registration_tracks_selection_count
  after insert or update or delete on registration_tracks
  for each row execute function fn_sync_selection_count();

create or replace function recount_selection_slots()
returns void language sql security definer set search_path = public as $$
  update selection_items si
     set taken_count = c.n
    from (
      select si2.id,
             (select count(*) from registration_tracks rt
               where rt.selection_item_id = si2.id) as n
        from selection_items si2
    ) c
   where c.id = si.id and si.taken_count is distinct from c.n;
$$;

-- ---------------------------------------------------------------------------
-- Entry validation
-- ---------------------------------------------------------------------------
create or replace function fn_validate_registration_track()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_track tracks%rowtype;
  v_item  selection_items%rowtype;
  v_class int;
begin
  select * into v_track from tracks where id = new.track_id;
  if not found then
    raise exception 'That competition no longer exists.';
  end if;
  if not v_track.is_active then
    raise exception '% is not open for registration.', v_track.name;
  end if;

  select class_level into v_class from registrations where id = new.registration_id;
  if v_class < v_track.min_class or v_class > v_track.max_class then
    raise exception '% is open to Class % to %.',
      v_track.name, v_track.min_class, v_track.max_class;
  end if;

  if v_track.requires_selection then
    if new.selection_item_id is null then
      raise exception 'Please choose a % for %.',
        lower(v_track.selection_label), v_track.name;
    end if;
    select * into v_item from selection_items where id = new.selection_item_id;
    if not found or not v_item.is_active then
      raise exception 'That choice is no longer available. Please pick another.';
    end if;
    if v_item.track_id <> new.track_id then
      raise exception 'That choice does not belong to %.', v_track.name;
    end if;
  elsif new.selection_item_id is not null then
    raise exception '% does not take a selection.', v_track.name;
  end if;

  return new;
end $$;

drop trigger if exists registration_tracks_validate on registration_tracks;
create trigger registration_tracks_validate
  before insert or update on registration_tracks
  for each row execute function fn_validate_registration_track();

-- ---------------------------------------------------------------------------
-- "Pay at the venue needs an at-the-venue competition" — removed.
--
-- Every competition is now held at the temple, including the quiz: it is taken
-- on a device, but on site, so that everyone sits it under the same conditions.
-- With paying at the temple the only method offered, the old rule could no
-- longer refuse anything — and if a competition were ever marked `online`
-- again it would refuse that student's only way to pay, which is a far worse
-- failure than the one it was guarding against.
-- ---------------------------------------------------------------------------
drop trigger if exists registrations_validate_payment on registrations;
drop function if exists fn_validate_payment_method();

-- ============================================================================
--  Auth helpers
-- ============================================================================
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where id = auth.uid() and is_active);
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users where id = auth.uid() and is_active and role = 'super_admin'
  );
$$;

-- ============================================================================
--  Public read model
-- ============================================================================
-- Dropped and recreated rather than CREATE OR REPLACE: replace can only append
-- columns to the end of a view, and refuses outright if an existing column
-- would shift position ("cannot change name of view column"). Two columns were
-- added in the middle here, which aborted the whole script on any database
-- that already had the old view — taking every statement after it down with
-- it. Nothing in the database depends on this view, so the drop is safe; the
-- grant further down re-applies.
drop view if exists selection_availability;

create view selection_availability
with (security_invoker = true) as
  select si.id,
         si.track_id,
         si.title,
         si.subtitle,
         si.reference_url,
         si.notes,
         si.max_slots,
         si.taken_count,
         greatest(si.max_slots - si.taken_count, 0) as slots_left,
         (si.taken_count >= si.max_slots)           as is_full,
         si.requires_detail,
         si.detail_label,
         si.sort_order
    from selection_items si
   where si.is_active;

-- Aggregates only, so it deliberately runs with the owner's rights and lets
-- anon read the totals without holding SELECT on `registrations`.
create or replace view public_stats
with (security_invoker = false) as
  select
    (select count(*) from registrations where status = 'confirmed')       as total_registrations,
    (select count(*) from registration_tracks)                            as total_entries,
    (select count(distinct lower(btrim(school_name)))
       from registrations where status = 'confirmed')                     as total_schools,
    (select count(*) from tracks where is_active)                         as total_tracks;

-- ============================================================================
--  Registration RPC — the only way the public writes here
-- ============================================================================
create or replace function submit_registration(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open     boolean;
  v_fee      int;
  v_class    int;
  v_reg_id   uuid;
  v_code     text;
  v_entries  jsonb;
  v_entry    jsonb;
  v_track    tracks%rowtype;
  v_item     selection_items%rowtype;
  v_rt_id    uuid;
  v_member   jsonb;
  v_members  jsonb;
  v_count    int;
  v_name     text;
  v_email    text;
  v_whatsapp text;
  v_method   payment_method;
  v_onsite   int;
  v_hold_minutes int;
  v_hold     timestamptz;
begin
  select coalesce((value->>'open')::boolean, false) into v_open
    from settings where key = 'registration';
  if not coalesce(v_open, false) then
    raise exception 'Registrations are closed at the moment.';
  end if;

  -- `fee` is the price of ONE competition. The total is charged per entry, so
  -- a student entering three competitions owes three times this. Computed here
  -- rather than trusted from the browser, for the obvious reason.
  select coalesce((value->>'fee')::int, 99) into v_fee
    from settings where key = 'registration';
  v_fee := coalesce(v_fee, 99);

  select coalesce((value->>'hold_minutes')::int, 60) into v_hold_minutes
    from settings where key = 'registration';
  v_hold_minutes := coalesce(v_hold_minutes, 60);

  -- Give back any song slots abandoned by earlier attempts before we check
  -- availability, so a student is not blocked by someone who walked away.
  perform release_expired_holds();

  v_name := nullif(btrim(payload->>'full_name'), '');
  if v_name is null then
    raise exception 'Please enter the student''s full name.';
  end if;

  v_class := nullif(payload->>'class_level', '')::int;
  if v_class is null or v_class not between 1 and 10 then
    raise exception 'Please choose a class between 1 and 10.';
  end if;

  -- WhatsApp is how the festival actually reaches people: it is required, and
  -- email is a nice-to-have. It is the guardian's number.
  v_email    := nullif(btrim(lower(payload->>'email')), '');
  v_whatsapp := nullif(btrim(payload->>'whatsapp'), '');
  if v_whatsapp is null then
    raise exception 'Please give the guardian''s WhatsApp number — that is how we send the joining details and the certificate.';
  end if;

  v_method := nullif(payload->>'payment_method', '')::payment_method;
  if v_method is null then
    raise exception 'Please choose how you would like to pay.';
  end if;

  v_entries := coalesce(payload->'entries', '[]'::jsonb);
  if jsonb_array_length(v_entries) = 0 then
    raise exception 'Please choose at least one competition to enter.';
  end if;

  v_code := 'UTK' || to_char(now() at time zone 'Asia/Kolkata', 'YY')
            || '-' || lpad(nextval('registration_code_seq')::text, 4, '0');

  -- Paying at the temple is a promise for the day, not something to expire.
  -- Everyone else holds their slot only until they pay.
  v_hold := case
              when v_method = 'pay_at_venue' then null
              else now() + make_interval(mins => v_hold_minutes)
            end;

  begin
    insert into registrations (
      reg_code, full_name, date_of_birth, gender, class_level, school_name,
      guardian_name, guardian_phone, student_phone, email, whatsapp, address,
      fee_amount, payment_method, consent_media, hold_expires_at
    ) values (
      v_code,
      v_name,
      nullif(payload->>'date_of_birth', '')::date,
      nullif(btrim(payload->>'gender'), ''),
      v_class,
      btrim(payload->>'school_name'),
      nullif(btrim(payload->>'guardian_name'), ''),
      nullif(btrim(payload->>'guardian_phone'), ''),
      nullif(btrim(payload->>'student_phone'), ''),
      v_email,
      v_whatsapp,
      nullif(btrim(payload->>'address'), ''),
      -- Priced per competition entered.
      v_fee * jsonb_array_length(v_entries),
      v_method,
      coalesce((payload->>'consent_media')::boolean, false),
      v_hold
    ) returning id into v_reg_id;
  exception
    when unique_violation then
      raise exception 'A student with this name and guardian phone number has already registered. Use the "Check status" page to look it up — if that registration is unpaid you can pay for it there.';
    when not_null_violation then
      raise exception 'Please fill in every required field — name, date of birth, gender, class and school are all needed.';
    when check_violation then
      -- Name the actual constraint so the student knows which box to fix.
      if sqlerrm like '%registrations_phone%' then
        raise exception 'That phone number does not look right. Please enter a 10-digit mobile number.';
      elsif sqlerrm like '%registrations_school%' then
        raise exception 'Please enter your school''s full name.';
      elsif sqlerrm like '%registrations_gender%' then
        raise exception 'Please select a gender.';
      elsif sqlerrm like '%registrations_class%' then
        raise exception 'Please choose a class between 1 and 10.';
      else
        raise exception 'Some of the details entered are not valid. Please check the form and try again.';
      end if;
  end;

  for v_entry in select * from jsonb_array_elements(v_entries) loop
    select * into v_track from tracks where id = nullif(v_entry->>'track_id', '')::uuid;
    if not found then
      raise exception 'One of the selected competitions no longer exists.';
    end if;

    -- Each day closes on its own date. Checked here rather than only in the
    -- browser, because the form may have been left open past the cut-off.
    if v_track.registration_closes_at is not null
       and (now() at time zone 'Asia/Kolkata')::date > v_track.registration_closes_at then
      raise exception 'Entries for % closed on %.',
        v_track.name, to_char(v_track.registration_closes_at, 'DD Mon');
    end if;

    -- Lock the song row before inserting so concurrent submissions serialise
    -- here and we can return a friendly message instead of a constraint error.
    if v_track.requires_selection then
      select * into v_item from selection_items
       where id = nullif(v_entry->>'selection_item_id', '')::uuid
       for update;

      if not found then
        raise exception 'Please choose a % for %.',
          lower(v_track.selection_label), v_track.name;
      end if;
      if v_item.taken_count >= v_item.max_slots then
        raise exception '"%" has just been taken by the maximum number of students. Please go back and choose another song.',
          v_item.title;
      end if;

      -- "Borgeet" and "Something else" are categories, not specific songs, so
      -- the student has to say which piece they will actually sing. Checked
      -- here as well as in the form: without it the running order is useless.
      if v_item.requires_detail
         and nullif(btrim(v_entry->>'selection_detail'), '') is null then
        raise exception 'Please write which song you will sing for "%".', v_item.title;
      end if;
    end if;

    insert into registration_tracks (
      registration_id, track_id, selection_item_id, selection_detail, team_name
    ) values (
      v_reg_id,
      v_track.id,
      nullif(v_entry->>'selection_item_id', '')::uuid,
      nullif(btrim(v_entry->>'selection_detail'), ''),
      nullif(btrim(v_entry->>'team_name'), '')
    ) returning id into v_rt_id;

    v_members := coalesce(v_entry->'members', '[]'::jsonb);
    v_count := jsonb_array_length(v_members);

    if v_track.is_team then
      if v_count + 1 < v_track.min_team_size then
        raise exception '% needs at least % participants.', v_track.name, v_track.min_team_size;
      end if;
      if v_count + 1 > v_track.max_team_size then
        raise exception '% allows at most % participants.', v_track.name, v_track.max_team_size;
      end if;
    elsif v_count > 0 then
      raise exception '% is an individual competition.', v_track.name;
    end if;

    for v_member in select * from jsonb_array_elements(v_members) loop
      if nullif(btrim(v_member->>'full_name'), '') is null then continue; end if;
      insert into team_members (registration_track_id, full_name, class_level, sort_order)
      values (
        v_rt_id,
        btrim(v_member->>'full_name'),
        nullif(v_member->>'class_level', '')::int,
        coalesce(nullif(v_member->>'sort_order', '')::int, 0)
      );
    end loop;
  end loop;

  -- Surfaced so the client knows whether to open Razorpay straight away.
  select count(*) into v_onsite
    from registration_tracks rt
    join tracks t on t.id = rt.track_id
   where rt.registration_id = v_reg_id and t.mode = 'onsite';

  return jsonb_build_object(
    'reg_code',        v_code,
    'registration_id', v_reg_id,
    'full_name',       v_name,
    'fee_amount',      v_fee * jsonb_array_length(v_entries),
    'payment_method',  v_method,
    'has_onsite',      v_onsite > 0,
    'hold_expires_at', v_hold
  );
end $$;

-- ---------------------------------------------------------------------------
-- Releases abandoned registrations.
--
-- A student who reaches the payment screen and walks away leaves a row behind
-- that is holding a bhajan song slot and blocking their own name + phone from
-- registering again. This deletes those, which cascades to
-- registration_tracks and lets the counter trigger give the song slot back.
--
-- Deliberately narrow. It only touches rows that are ALL of:
--   * still 'pending' — never 'paid', and never 'awaiting_verification'
--     (that student has paid and is waiting on us, not the other way round)
--   * paying online — cash-at-the-temple is a promise for the day, not an
--     abandonment, so those rows have hold_expires_at = null and are skipped
--   * past their hold window
--
-- Returns how many were released, so the admin portal can report it.
-- ---------------------------------------------------------------------------
create or replace function release_expired_holds()
returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  with gone as (
    delete from registrations
     where payment_status = 'pending'
       and hold_expires_at is not null
       and hold_expires_at < now()
    returning 1
  )
  select count(*) into v_n from gone;

  return coalesce(v_n, 0);
end $$;

-- ---------------------------------------------------------------------------
-- A student reports the UTR reference for a UPI payment they have just made.
-- This does NOT mark them paid — an organiser still checks it against the bank
-- statement. It only moves them into the verification queue.
--
-- The registration id acts as the capability: it is a random UUIDv4, returned
-- only to the person who just registered or who passed the code + phone check
-- on the status page.
-- ---------------------------------------------------------------------------
create or replace function submit_upi_reference(p_registration_id uuid, p_reference text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reg registrations%rowtype;
  v_ref text;
begin
  v_ref := upper(btrim(coalesce(p_reference, '')));

  -- UPI UTRs are 12 digits, but banks and apps vary, so accept 6-24
  -- alphanumerics and let the organiser be the real judge.
  if v_ref !~ '^[A-Z0-9]{6,24}$' then
    raise exception 'That does not look like a valid UPI reference number. It is usually 12 digits, shown in your payment app next to "UTR" or "Transaction ID".';
  end if;

  select * into v_reg from registrations where id = p_registration_id;
  if not found then
    raise exception 'We could not find that registration.';
  end if;

  if v_reg.payment_status = 'paid' then
    return jsonb_build_object('status', 'paid', 'already', true);
  end if;

  if v_reg.payment_method <> 'upi_manual' then
    raise exception 'This registration is not set up for UPI payment.';
  end if;

  -- Do not silently overwrite a reference the organiser is currently checking.
  -- If the organiser rejected it (clears upi_reference and resets to 'pending'),
  -- the student can try again — that is the intended retry path.
  if v_reg.payment_status = 'awaiting_verification' then
    raise exception 'You have already submitted reference %. Contact the organisers if you need to change it — they may be checking it right now.',
      v_reg.upi_reference;
  end if;

  begin
    update registrations
       set upi_reference   = v_ref,
           payment_status  = 'awaiting_verification',
           -- They have done their part; the slot is no longer at risk.
           hold_expires_at = null,
           updated_at      = now()
     where id = p_registration_id;
  exception
    when unique_violation then
      raise exception 'That reference number has already been submitted by another student. Please check you have copied the right one from your payment app.';
  end;

  return jsonb_build_object('status', 'awaiting_verification', 'reference', v_ref);
end $$;

-- Look up your own registration. Needs BOTH the code and the phone number, so
-- it cannot be used to enumerate participants.
-- Code AND guardian phone. The code on its own would be a single weak secret,
-- and anyone who saw it over a student's shoulder could read that
-- registration; requiring the phone number as well means a leaked code is not
-- enough on its own. Phone comparison strips non-digits, so spacing and a
-- leading +91 do not matter.
create or replace function lookup_registration(p_code text, p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reg registrations%rowtype;
begin
  select * into v_reg from registrations
   where upper(btrim(reg_code)) = upper(btrim(p_code))
     and regexp_replace(guardian_phone, '\D', '', 'g')
         = regexp_replace(btrim(p_phone), '\D', '', 'g');

  if not found then return null; end if;

  return jsonb_build_object(
    'registration_id',    v_reg.id,
    'reg_code',           v_reg.reg_code,
    'full_name',          v_reg.full_name,
    'class_level',        v_reg.class_level,
    'school_name',        v_reg.school_name,
    'status',             v_reg.status,
    'fee_amount',         v_reg.fee_amount,
    'payment_method',     v_reg.payment_method,
    'payment_status',     v_reg.payment_status,
    'upi_reference',      v_reg.upi_reference,
    'hold_expires_at',    v_reg.hold_expires_at,
    'certificate_status', v_reg.certificate_status,
    'created_at',         v_reg.created_at,
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
               'track',      t.name,
               'track_slug', t.slug,
               'mode',       t.mode,
               'event_date', t.event_date,
               -- Show the piece they actually named, falling back to the
               -- catalogue title for ordinary songs.
               'selection',  coalesce(nullif(btrim(rt.selection_detail), ''), si.title),
               'selection_category', si.title,
               'team_name',  rt.team_name,
               'outcome',    rt.outcome,
               'award',      rt.award
             ) order by t.sort_order)
        from registration_tracks rt
        join tracks t on t.id = rt.track_id
        left join selection_items si on si.id = rt.selection_item_id
       where rt.registration_id = v_reg.id
    ), '[]'::jsonb)
  );
end $$;

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table tracks              enable row level security;
alter table selection_items     enable row level security;
alter table registrations       enable row level security;
alter table registration_tracks enable row level security;
alter table team_members        enable row level security;
alter table gallery_items       enable row level security;
alter table admin_users         enable row level security;
alter table settings            enable row level security;
alter table audit_log           enable row level security;
alter table payment_events      enable row level security;
alter table message_log         enable row level security;

-- ---- catalogue: world readable, super admin writable ----------------------
drop policy if exists tracks_read on tracks;
create policy tracks_read on tracks for select using (is_active or is_admin());
drop policy if exists tracks_write on tracks;
create policy tracks_write on tracks for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists selection_items_read on selection_items;
create policy selection_items_read on selection_items
  for select using (is_active or is_admin());
drop policy if exists selection_items_write on selection_items;
create policy selection_items_write on selection_items for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists gallery_read on gallery_items;
create policy gallery_read on gallery_items for select using (true);
drop policy if exists gallery_write on gallery_items;
create policy gallery_write on gallery_items for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists settings_read on settings;
create policy settings_read on settings for select using (is_public or is_admin());
drop policy if exists settings_write on settings;
create policy settings_write on settings for all
  using (is_super_admin()) with check (is_super_admin());

-- ---- registrations: admins only. The public writes via the RPC. -----------
-- Note there is deliberately no anon policy of any kind here, and no
-- service-role policy either: the service role bypasses RLS by design, which
-- is how the payment Edge Functions mark a registration paid.
drop policy if exists registrations_read on registrations;
create policy registrations_read on registrations for select using (is_admin());

drop policy if exists registrations_update on registrations;
create policy registrations_update on registrations for update
  using (is_admin()) with check (is_admin());

drop policy if exists registrations_delete on registrations;
create policy registrations_delete on registrations for delete using (is_super_admin());

drop policy if exists reg_tracks_read on registration_tracks;
create policy reg_tracks_read on registration_tracks for select using (is_admin());
drop policy if exists reg_tracks_update on registration_tracks;
create policy reg_tracks_update on registration_tracks for update
  using (is_admin()) with check (is_admin());
drop policy if exists reg_tracks_delete on registration_tracks;
create policy reg_tracks_delete on registration_tracks for delete using (is_super_admin());

drop policy if exists team_members_read on team_members;
create policy team_members_read on team_members for select using (is_admin());
drop policy if exists team_members_write on team_members;
create policy team_members_write on team_members for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists admin_users_read on admin_users;
create policy admin_users_read on admin_users
  for select using (id = auth.uid() or is_super_admin());
drop policy if exists admin_users_write on admin_users;
create policy admin_users_write on admin_users for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select using (is_super_admin());
drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (is_admin());

drop policy if exists payment_events_read on payment_events;
create policy payment_events_read on payment_events for select using (is_super_admin());

-- Any admin may see what has been sent and record a WhatsApp send. Email rows
-- are written by the Edge Function using the service role, which bypasses RLS.
drop policy if exists message_log_read on message_log;
create policy message_log_read on message_log for select using (is_admin());

drop policy if exists message_log_insert on message_log;
create policy message_log_insert on message_log for insert with check (is_admin());

drop policy if exists message_log_delete on message_log;
create policy message_log_delete on message_log for delete using (is_super_admin());

-- ============================================================================
--  Grants
-- ============================================================================
revoke all on function submit_registration(jsonb) from public;
grant execute on function submit_registration(jsonb) to anon, authenticated;

revoke all on function lookup_registration(text, text) from public;
grant execute on function lookup_registration(text, text) to anon, authenticated;

revoke all on function submit_upi_reference(uuid, text) from public;
grant execute on function submit_upi_reference(uuid, text) to anon, authenticated;

-- Safe for anyone to call: it only deletes rows that are already abandoned by
-- the strict definition above. Calling it repeatedly just wastes a query.
revoke all on function release_expired_holds() from public;
grant execute on function release_expired_holds() to anon, authenticated;

revoke all on function recount_selection_slots() from public;
grant execute on function recount_selection_slots() to authenticated;

grant select on selection_availability to anon, authenticated;
grant select on public_stats to anon, authenticated;

-- ============================================================================
--  Restore organiser accounts saved by reset.sql, so a rebuild does not lock
--  you out. Harmless on a fresh install — the backup table simply won't exist.
-- ============================================================================
do $$
declare v_n int;
begin
  if to_regclass('public.admin_users_backup') is not null then
    insert into admin_users (id, full_name, email, role, is_active, created_at)
    select b.id, b.full_name, b.email, b.role::admin_role, b.is_active, b.created_at
      from admin_users_backup b
      -- Only for logins that still exist in Supabase Auth.
      join auth.users u on u.id = b.id
    on conflict (id) do nothing;

    get diagnostics v_n = row_count;
    raise notice 'Restored % organiser account(s).', v_n;
  end if;
end $$;
