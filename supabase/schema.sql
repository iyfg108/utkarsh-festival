-- ============================================================================
--  UTKARSH HERITAGE FESTIVAL — database schema
--  Run this once in the Supabase SQL editor, then run seed.sql.
--
--  Design notes
--  ------------
--  * Slot limits (e.g. "no more than 3 students may sing the same bhajan") are
--    enforced by the database, not the UI. `selection_items.taken_count` is
--    maintained by a trigger and guarded by a CHECK constraint, so two students
--    submitting at the same instant can never both take the last slot — the
--    second transaction fails on the constraint. See the comment on
--    `fn_sync_selection_count` for why this is race-safe.
--  * The public site talks to the database as the `anon` role. It can read
--    catalogue data (tracks, songs, availability) but has NO read access to
--    registrations. Writes happen only through the SECURITY DEFINER function
--    `submit_registration`, which validates everything server-side.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type admin_role as enum ('super_admin', 'school_coordinator', 'judge');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reg_stage as enum ('school_round', 'finals');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reg_status as enum ('confirmed', 'withdrawn', 'disqualified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entry_outcome as enum (
    'registered', 'shortlisted', 'not_shortlisted', 'finalist', 'winner'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function fn_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Age categories (three school bands)
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text,
  min_class   int  not null,
  max_class   int  not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  constraint categories_class_range
    check (min_class >= 1 and max_class <= 12 and min_class <= max_class)
);

-- A given class must never resolve to two categories. This exclusion
-- constraint makes overlapping bands impossible to save.
do $$ begin
  alter table categories add constraint categories_no_overlap
    exclude using gist (int4range(min_class, max_class, '[]') with &&);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Participating schools
-- ---------------------------------------------------------------------------
create table if not exists schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique not null,
  area              text,
  address           text,
  coordinator_name  text,
  coordinator_phone text,
  coordinator_email text,
  stage1_date       date,
  stage1_venue      text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Competition tracks
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
  is_team            boolean not null default false,
  min_team_size      int not null default 1,
  max_team_size      int not null default 1,
  requires_selection boolean not null default false,
  selection_label    text,
  selection_help     text,
  is_active          boolean not null default true,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  constraint tracks_team_size
    check (min_team_size >= 1 and max_team_size >= min_team_size),
  constraint tracks_selection_label
    check (not requires_selection or selection_label is not null)
);

create table if not exists track_categories (
  track_id    uuid not null references tracks(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (track_id, category_id)
);

-- ---------------------------------------------------------------------------
-- Selection items — the songs, slokas, characters and themes students pick.
-- `max_slots` is the cap; `taken_count` is maintained by trigger.
-- ---------------------------------------------------------------------------
create table if not exists selection_items (
  id            uuid primary key default gen_random_uuid(),
  track_id      uuid not null references tracks(id) on delete cascade,
  -- null means "available to every category this track is open to"
  category_id   uuid references categories(id) on delete cascade,
  title         text not null,
  subtitle      text,
  reference_url text,
  notes         text,
  max_slots     int  not null default 3,
  taken_count   int  not null default 0,
  is_active     boolean not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  constraint selection_items_max_slots check (max_slots >= 1),
  -- The guarantee. Nothing can push taken_count past max_slots.
  constraint selection_items_not_oversubscribed
    check (taken_count >= 0 and taken_count <= max_slots)
);

create index if not exists selection_items_track_idx
  on selection_items (track_id, category_id) where is_active;

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
create sequence if not exists registration_code_seq start 1001;

create table if not exists registrations (
  id                uuid primary key default gen_random_uuid(),
  reg_code          text unique not null,
  full_name         text not null,
  date_of_birth     date,
  gender            text,
  class_level       int  not null,
  section           text,
  category_id       uuid not null references categories(id),
  school_id         uuid references schools(id),
  school_name_other text,
  guardian_name     text not null,
  guardian_phone    text not null,
  student_phone     text,
  email             text,
  address           text,
  stage             reg_stage  not null default 'school_round',
  status            reg_status not null default 'confirmed',
  consent_media     boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint registrations_class check (class_level between 1 and 12),
  constraint registrations_school_present
    check (school_id is not null or nullif(btrim(school_name_other), '') is not null),
  constraint registrations_phone
    check (guardian_phone ~ '^[+]?[0-9][0-9 ()-]{7,19}$')
);

-- Same name + same guardian phone = the same child registering twice.
create unique index if not exists registrations_dedupe_idx
  on registrations (lower(btrim(full_name)), guardian_phone);

create index if not exists registrations_school_idx   on registrations (school_id);
create index if not exists registrations_category_idx on registrations (category_id);
create index if not exists registrations_stage_idx    on registrations (stage, status);

drop trigger if exists registrations_touch on registrations;
create trigger registrations_touch before update on registrations
  for each row execute function fn_touch_updated_at();

-- ---------------------------------------------------------------------------
-- One row per track a student entered
-- ---------------------------------------------------------------------------
create table if not exists registration_tracks (
  id                uuid primary key default gen_random_uuid(),
  registration_id   uuid not null references registrations(id) on delete cascade,
  track_id          uuid not null references tracks(id) on delete restrict,
  selection_item_id uuid references selection_items(id) on delete restrict,
  team_name         text,
  outcome           entry_outcome not null default 'registered',
  stage1_score      numeric(5,2),
  stage1_rank       int,
  stage1_remarks    text,
  stage2_score      numeric(5,2),
  stage2_rank       int,
  stage2_remarks    text,
  award             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (registration_id, track_id),
  constraint reg_tracks_scores check (
    (stage1_score is null or stage1_score between 0 and 100) and
    (stage2_score is null or stage2_score between 0 and 100)
  )
);

create index if not exists registration_tracks_track_idx     on registration_tracks (track_id);
create index if not exists registration_tracks_selection_idx on registration_tracks (selection_item_id);
create index if not exists registration_tracks_outcome_idx   on registration_tracks (outcome);

drop trigger if exists registration_tracks_touch on registration_tracks;
create trigger registration_tracks_touch before update on registration_tracks
  for each row execute function fn_touch_updated_at();

create table if not exists team_members (
  id                    uuid primary key default gen_random_uuid(),
  registration_track_id uuid not null references registration_tracks(id) on delete cascade,
  full_name             text not null,
  class_level           int,
  role                  text,
  sort_order            int not null default 0,
  constraint team_members_class check (class_level is null or class_level between 1 and 12)
);

create index if not exists team_members_entry_idx on team_members (registration_track_id);

-- ---------------------------------------------------------------------------
-- Content: past photos and student voices
-- ---------------------------------------------------------------------------
create table if not exists gallery_items (
  id          uuid primary key default gen_random_uuid(),
  year        int  not null,
  title       text,
  caption     text,
  image_url   text not null,
  track_id    uuid references tracks(id) on delete set null,
  is_featured boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists testimonials (
  id           uuid primary key default gen_random_uuid(),
  student_name text not null,
  school_name  text,
  year         int,
  track_name   text,
  quote        text not null,
  avatar_url   text,
  is_published boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin users, settings, audit trail
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  email      text not null,
  role       admin_role not null default 'judge',
  school_id  uuid references schools(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_users_coordinator_school
    check (role <> 'school_coordinator' or school_id is not null)
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

-- ============================================================================
--  Slot accounting
-- ============================================================================

-- Why this is race-safe:
--   Two students submit for the last slot of the same bhajan at the same
--   instant. Both transactions reach this trigger and issue
--   `update selection_items set taken_count = taken_count + 1`. Postgres takes
--   a row lock, so the second one blocks until the first commits. When it
--   resumes it re-reads the committed row (READ COMMITTED), computes
--   max_slots + 1, and the `selection_items_not_oversubscribed` CHECK rejects
--   it — that transaction aborts and the student is told to choose again.
--   The UI's availability display is a courtesy; this is the actual guarantee.
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

-- Recompute counters from source of truth. Safe to run any time; useful after
-- a bulk import or manual surgery.
create or replace function recount_selection_slots()
returns void language sql security definer set search_path = public as $$
  update selection_items si
     set taken_count = coalesce(c.n, 0)
    from (
      select si2.id,
             (select count(*) from registration_tracks rt
               where rt.selection_item_id = si2.id) as n
        from selection_items si2
    ) c
   where c.id = si.id and si.taken_count is distinct from coalesce(c.n, 0);
$$;

-- ---------------------------------------------------------------------------
-- Entry validation: keeps bad data out regardless of which client wrote it
-- ---------------------------------------------------------------------------
create or replace function fn_validate_registration_track()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_track     tracks%rowtype;
  v_item      selection_items%rowtype;
  v_category  uuid;
begin
  select * into v_track from tracks where id = new.track_id;
  if not found then
    raise exception 'That competition track no longer exists.';
  end if;
  if not v_track.is_active then
    raise exception '% is not open for registration.', v_track.name;
  end if;

  select category_id into v_category from registrations where id = new.registration_id;

  if not exists (
    select 1 from track_categories
     where track_id = new.track_id and category_id = v_category
  ) then
    raise exception '% is not open to this age group.', v_track.name;
  end if;

  if v_track.requires_selection then
    if new.selection_item_id is null then
      raise exception 'Please choose a % for %.',
        lower(coalesce(v_track.selection_label, 'selection')), v_track.name;
    end if;

    select * into v_item from selection_items where id = new.selection_item_id;
    if not found or not v_item.is_active then
      raise exception 'That choice is no longer available. Please pick another.';
    end if;
    if v_item.track_id <> new.track_id then
      raise exception 'That choice does not belong to %.', v_track.name;
    end if;
    if v_item.category_id is not null and v_item.category_id <> v_category then
      raise exception '"%" is not available for this age group.', v_item.title;
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

-- ============================================================================
--  Auth helpers
-- ============================================================================
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users where id = auth.uid() and is_active
  );
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users
     where id = auth.uid() and is_active and role = 'super_admin'
  );
$$;

create or replace function current_admin_role()
returns admin_role language sql stable security definer set search_path = public as $$
  select role from admin_users where id = auth.uid() and is_active;
$$;

create or replace function current_admin_school()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from admin_users where id = auth.uid() and is_active;
$$;

-- True when the signed-in admin may see rows belonging to this school.
-- Super admins and judges see everything; coordinators see only their school.
create or replace function can_view_school(p_school uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when not is_admin() then false
    when current_admin_role() = 'school_coordinator'
      then p_school is not distinct from current_admin_school()
    else true
  end;
$$;

-- ============================================================================
--  Public read model
-- ============================================================================

-- Availability without exposing who registered.
create or replace view selection_availability
with (security_invoker = true) as
  select si.id,
         si.track_id,
         si.category_id,
         si.title,
         si.subtitle,
         si.reference_url,
         si.notes,
         si.max_slots,
         si.taken_count,
         greatest(si.max_slots - si.taken_count, 0) as slots_left,
         (si.taken_count >= si.max_slots)           as is_full,
         si.sort_order
    from selection_items si
   where si.is_active;

-- Live counters for the home page.
-- Deliberately runs with the view owner's rights (security_invoker = false) so
-- the anon role can read the totals without holding SELECT on `registrations`.
-- Safe because every column is an aggregate — no row-level data escapes.
create or replace view public_stats
with (security_invoker = false) as
  select
    (select count(*) from registrations where status = 'confirmed')            as total_registrations,
    (select count(*) from registration_tracks)                                 as total_entries,
    (select count(distinct coalesce(school_id::text, lower(school_name_other)))
       from registrations where status = 'confirmed')                          as total_schools,
    (select count(*) from tracks where is_active)                              as total_tracks;

-- ============================================================================
--  Registration RPC — the only way the public writes to this database
-- ============================================================================
create or replace function submit_registration(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_open        boolean;
  v_max_tracks  int;
  v_class       int;
  v_category    uuid;
  v_school      uuid;
  v_school_txt  text;
  v_reg_id      uuid;
  v_code        text;
  v_entries     jsonb;
  v_entry       jsonb;
  v_track       tracks%rowtype;
  v_item        selection_items%rowtype;
  v_rt_id       uuid;
  v_member      jsonb;
  v_members     jsonb;
  v_member_n    int;
  v_name        text;
begin
  -- 1. Is registration open?
  select coalesce((value->>'open')::boolean, false) into v_open
    from settings where key = 'registration';
  if not coalesce(v_open, false) then
    raise exception 'Registrations are closed at the moment.';
  end if;

  select coalesce((value->>'max_tracks_per_student')::int, 3) into v_max_tracks
    from settings where key = 'registration';
  v_max_tracks := coalesce(v_max_tracks, 3);

  -- 2. Basic identity
  v_name := nullif(btrim(payload->>'full_name'), '');
  if v_name is null then
    raise exception 'Please enter the student''s full name.';
  end if;

  v_class := nullif(payload->>'class_level', '')::int;
  if v_class is null or v_class not between 1 and 12 then
    raise exception 'Please choose a class between 1 and 12.';
  end if;

  select id into v_category from categories
   where v_class between min_class and max_class;
  if v_category is null then
    raise exception 'No age group is configured for class %.', v_class;
  end if;

  -- 3. School: either a listed one, or a free-text name we add later
  v_school := nullif(payload->>'school_id', '')::uuid;
  v_school_txt := nullif(btrim(payload->>'school_name_other'), '');
  if v_school is null and v_school_txt is null then
    raise exception 'Please select your school.';
  end if;
  if v_school is not null
     and not exists (select 1 from schools where id = v_school and is_active) then
    raise exception 'That school is not accepting registrations.';
  end if;

  -- 4. Entries
  v_entries := coalesce(payload->'entries', '[]'::jsonb);
  if jsonb_array_length(v_entries) = 0 then
    raise exception 'Please choose at least one competition to enter.';
  end if;
  if jsonb_array_length(v_entries) > v_max_tracks then
    raise exception 'You may enter at most % competitions.', v_max_tracks;
  end if;

  -- 5. Create the registration
  v_code := 'UTK' || to_char(now() at time zone 'Asia/Kolkata', 'YY')
            || '-' || lpad(nextval('registration_code_seq')::text, 4, '0');

  begin
    insert into registrations (
      reg_code, full_name, date_of_birth, gender, class_level, section,
      category_id, school_id, school_name_other, guardian_name, guardian_phone,
      student_phone, email, address, consent_media
    ) values (
      v_code,
      v_name,
      nullif(payload->>'date_of_birth', '')::date,
      nullif(btrim(payload->>'gender'), ''),
      v_class,
      nullif(btrim(payload->>'section'), ''),
      v_category,
      v_school,
      v_school_txt,
      nullif(btrim(payload->>'guardian_name'), ''),
      nullif(btrim(payload->>'guardian_phone'), ''),
      nullif(btrim(payload->>'student_phone'), ''),
      nullif(btrim(lower(payload->>'email')), ''),
      nullif(btrim(payload->>'address'), ''),
      coalesce((payload->>'consent_media')::boolean, false)
    ) returning id into v_reg_id;
  exception
    when unique_violation then
      raise exception 'A student with this name and guardian phone number has already registered. Use the "Check status" page to look up that registration.';
    when check_violation then
      raise exception 'Please check the details entered — the guardian phone number does not look valid.';
  end;

  -- 6. Each competition entry
  for v_entry in select * from jsonb_array_elements(v_entries) loop
    select * into v_track from tracks where id = nullif(v_entry->>'track_id', '')::uuid;
    if not found then
      raise exception 'One of the selected competitions no longer exists.';
    end if;

    -- Take the row lock BEFORE inserting so concurrent submissions serialise
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
        raise exception '"%" is already full for % — every slot has been taken. Please go back and choose another.',
          v_item.title, v_track.name;
      end if;
    end if;

    insert into registration_tracks (registration_id, track_id, selection_item_id, team_name)
    values (
      v_reg_id,
      v_track.id,
      nullif(v_entry->>'selection_item_id', '')::uuid,
      nullif(btrim(v_entry->>'team_name'), '')
    ) returning id into v_rt_id;

    -- Team members, if this is a group event
    v_members := coalesce(v_entry->'members', '[]'::jsonb);
    v_member_n := jsonb_array_length(v_members);

    if v_track.is_team then
      -- the registering student counts as member #1
      if v_member_n + 1 < v_track.min_team_size then
        raise exception '% needs at least % participants.',
          v_track.name, v_track.min_team_size;
      end if;
      if v_member_n + 1 > v_track.max_team_size then
        raise exception '% allows at most % participants.',
          v_track.name, v_track.max_team_size;
      end if;
    elsif v_member_n > 0 then
      raise exception '% is an individual competition.', v_track.name;
    end if;

    for v_member in select * from jsonb_array_elements(v_members) loop
      if nullif(btrim(v_member->>'full_name'), '') is null then
        continue;
      end if;
      insert into team_members (registration_track_id, full_name, class_level, role, sort_order)
      values (
        v_rt_id,
        btrim(v_member->>'full_name'),
        nullif(v_member->>'class_level', '')::int,
        nullif(btrim(v_member->>'role'), ''),
        coalesce(nullif(v_member->>'sort_order', '')::int, 0)
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'reg_code', v_code,
    'registration_id', v_reg_id,
    'full_name', v_name
  );
end $$;

-- Look up your own registration. Requires BOTH the code and the phone number,
-- so the endpoint cannot be used to enumerate participants.
create or replace function lookup_registration(p_code text, p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reg registrations%rowtype;
  v_out jsonb;
begin
  select * into v_reg from registrations
   where upper(btrim(reg_code)) = upper(btrim(p_code))
     and regexp_replace(guardian_phone, '\D', '', 'g')
         = regexp_replace(btrim(p_phone), '\D', '', 'g');

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'reg_code',    v_reg.reg_code,
    'full_name',   v_reg.full_name,
    'class_level', v_reg.class_level,
    'stage',       v_reg.stage,
    'status',      v_reg.status,
    'category',    (select name from categories where id = v_reg.category_id),
    'school',      coalesce(
                     (select name from schools where id = v_reg.school_id),
                     v_reg.school_name_other),
    'created_at',  v_reg.created_at,
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
               'track',     t.name,
               'track_slug', t.slug,
               'selection', si.title,
               'team_name', rt.team_name,
               'outcome',   rt.outcome,
               'award',     rt.award
             ) order by t.sort_order)
        from registration_tracks rt
        join tracks t on t.id = rt.track_id
        left join selection_items si on si.id = rt.selection_item_id
       where rt.registration_id = v_reg.id
    ), '[]'::jsonb)
  ) into v_out;

  return v_out;
end $$;

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table categories         enable row level security;
alter table schools            enable row level security;
alter table tracks             enable row level security;
alter table track_categories   enable row level security;
alter table selection_items    enable row level security;
alter table registrations      enable row level security;
alter table registration_tracks enable row level security;
alter table team_members       enable row level security;
alter table gallery_items      enable row level security;
alter table testimonials       enable row level security;
alter table admin_users        enable row level security;
alter table settings           enable row level security;
alter table audit_log          enable row level security;

-- ---- Catalogue: world-readable ------------------------------------------
drop policy if exists categories_read on categories;
create policy categories_read on categories for select using (true);

drop policy if exists tracks_read on tracks;
create policy tracks_read on tracks for select using (is_active or is_admin());

drop policy if exists track_categories_read on track_categories;
create policy track_categories_read on track_categories for select using (true);

drop policy if exists schools_read on schools;
create policy schools_read on schools for select using (is_active or is_admin());

drop policy if exists selection_items_read on selection_items;
create policy selection_items_read on selection_items
  for select using (is_active or is_admin());

drop policy if exists gallery_read on gallery_items;
create policy gallery_read on gallery_items for select using (true);

drop policy if exists testimonials_read on testimonials;
create policy testimonials_read on testimonials
  for select using (is_published or is_admin());

drop policy if exists settings_read on settings;
create policy settings_read on settings for select using (is_public or is_admin());

-- ---- Catalogue: super admins may change it -------------------------------
drop policy if exists categories_write on categories;
create policy categories_write on categories for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists tracks_write on tracks;
create policy tracks_write on tracks for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists track_categories_write on track_categories;
create policy track_categories_write on track_categories for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists schools_write on schools;
create policy schools_write on schools for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists selection_items_write on selection_items;
create policy selection_items_write on selection_items for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists gallery_write on gallery_items;
create policy gallery_write on gallery_items for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists testimonials_write on testimonials;
create policy testimonials_write on testimonials for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists settings_write on settings;
create policy settings_write on settings for all
  using (is_super_admin()) with check (is_super_admin());

-- ---- Registrations: admins only. The public writes via the RPC. ----------
drop policy if exists registrations_read on registrations;
create policy registrations_read on registrations
  for select using (can_view_school(school_id));

drop policy if exists registrations_update on registrations;
create policy registrations_update on registrations
  for update using (can_view_school(school_id))
  with check (can_view_school(school_id));

drop policy if exists registrations_delete on registrations;
create policy registrations_delete on registrations
  for delete using (is_super_admin());

drop policy if exists registrations_insert on registrations;
create policy registrations_insert on registrations
  for insert with check (is_super_admin());

drop policy if exists reg_tracks_read on registration_tracks;
create policy reg_tracks_read on registration_tracks for select using (
  exists (select 1 from registrations r
           where r.id = registration_id and can_view_school(r.school_id))
);

-- Judges and coordinators score; super admins do anything.
drop policy if exists reg_tracks_update on registration_tracks;
create policy reg_tracks_update on registration_tracks for update using (
  exists (select 1 from registrations r
           where r.id = registration_id and can_view_school(r.school_id))
) with check (
  exists (select 1 from registrations r
           where r.id = registration_id and can_view_school(r.school_id))
);

drop policy if exists reg_tracks_write on registration_tracks;
create policy reg_tracks_write on registration_tracks for insert
  with check (is_super_admin());

drop policy if exists reg_tracks_delete on registration_tracks;
create policy reg_tracks_delete on registration_tracks for delete
  using (is_super_admin());

drop policy if exists team_members_read on team_members;
create policy team_members_read on team_members for select using (
  exists (select 1 from registration_tracks rt
            join registrations r on r.id = rt.registration_id
           where rt.id = registration_track_id and can_view_school(r.school_id))
);

drop policy if exists team_members_write on team_members;
create policy team_members_write on team_members for all
  using (is_super_admin()) with check (is_super_admin());

-- ---- Admin users ---------------------------------------------------------
drop policy if exists admin_users_read on admin_users;
create policy admin_users_read on admin_users
  for select using (id = auth.uid() or is_super_admin());

drop policy if exists admin_users_write on admin_users;
create policy admin_users_write on admin_users for all
  using (is_super_admin()) with check (is_super_admin());

-- ---- Audit log -----------------------------------------------------------
drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select using (is_super_admin());

drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log for insert with check (is_admin());

-- ============================================================================
--  Grants
-- ============================================================================
revoke all on function submit_registration(jsonb) from public;
grant execute on function submit_registration(jsonb) to anon, authenticated;

revoke all on function lookup_registration(text, text) from public;
grant execute on function lookup_registration(text, text) to anon, authenticated;

revoke all on function recount_selection_slots() from public;
grant execute on function recount_selection_slots() to authenticated;

grant select on selection_availability to anon, authenticated;
grant select on public_stats to anon, authenticated;
