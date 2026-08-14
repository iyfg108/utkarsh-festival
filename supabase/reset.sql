-- ============================================================================
--  STEP 1 of 3 — rebuild the database for v2.
--
--  Run in this order, all in the Supabase SQL editor:
--      1. reset.sql   (this file)
--      2. schema.sql
--      3. seed.sql
--
--  ⚠️  THIS DELETES ALL REGISTRATIONS. Fine before you go live; if you already
--      have real entries, export them first from
--      Admin → Registrations → Export for Excel.
--
--  Your organiser logins are preserved: the accounts are copied to
--  admin_users_backup below and restored automatically at the end of
--  schema.sql, so you will not be locked out.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Preserve organiser accounts across the rebuild
-- ---------------------------------------------------------------------------
create table if not exists admin_users_backup (
  id         uuid primary key,
  full_name  text not null,
  email      text not null,
  role       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.admin_users') is not null then
    insert into admin_users_backup (id, full_name, email, role, is_active, created_at)
    select id,
           full_name,
           email,
           -- v1 had a school_coordinator role; v2 does not. Those people
           -- become judges, which is the closest equivalent.
           case when role::text = 'super_admin' then 'super_admin' else 'judge' end,
           is_active,
           created_at
      from admin_users
    on conflict (id) do nothing;

    raise notice 'Backed up % organiser account(s).',
      (select count(*) from admin_users_backup);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Drop everything the festival app owns
-- ---------------------------------------------------------------------------
drop view if exists selection_availability cascade;
drop view if exists public_stats cascade;

drop table if exists payment_events     cascade;
drop table if exists audit_log          cascade;
drop table if exists team_members       cascade;
drop table if exists registration_tracks cascade;
drop table if exists registrations      cascade;
drop table if exists selection_items    cascade;
drop table if exists track_categories   cascade;  -- v1 only
drop table if exists tracks             cascade;
drop table if exists categories         cascade;  -- v1 only
drop table if exists schools            cascade;  -- v1 only
drop table if exists testimonials       cascade;  -- v1 only
drop table if exists gallery_items      cascade;
drop table if exists settings           cascade;
drop table if exists admin_users        cascade;

drop sequence if exists registration_code_seq;

drop function if exists submit_registration(jsonb)       cascade;
drop function if exists lookup_registration(text, text)  cascade;
drop function if exists recount_selection_slots()        cascade;
drop function if exists fn_sync_selection_count()        cascade;
drop function if exists fn_validate_registration_track() cascade;
drop function if exists fn_validate_payment_method()     cascade;
drop function if exists fn_touch_updated_at()            cascade;
drop function if exists is_admin()                       cascade;
drop function if exists is_super_admin()                 cascade;
drop function if exists current_admin_role()             cascade;  -- v1 only
drop function if exists current_admin_school()           cascade;  -- v1 only
drop function if exists can_view_school(uuid)            cascade;  -- v1 only

drop type if exists certificate_status cascade;
drop type if exists payment_status     cascade;
drop type if exists payment_method     cascade;
drop type if exists event_mode         cascade;
drop type if exists entry_outcome      cascade;
drop type if exists reg_status         cascade;
drop type if exists reg_stage          cascade;  -- v1 only
drop type if exists admin_role         cascade;

-- Now run schema.sql, then seed.sql.
