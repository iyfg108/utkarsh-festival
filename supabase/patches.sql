-- ============================================================================
--  UTKARSH 2026 — bring an already-seeded database up to the August revision.
--
--  Run in the Supabase SQL editor, in this order:
--      1. schema.sql   — adds the new columns, replaces the functions
--      2. seed.sql     — upserts the six competitions and the song list
--      3. patches.sql  — this file
--
--  seed.sql uses `on conflict (key) do nothing` on `settings`, so it can never
--  clobber something you changed from the admin portal — which also means it
--  cannot update those rows once they exist. That is this file's job, along
--  with the data migrations no seed can do.
--
--  Safe to re-run.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Contact details
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'email',     'iyfguwahati@gmail.com',
         'phone',     '+91 93950 40843',
         'whatsapp',  '+91 93950 40843',
         'instagram', ''
       ),
       updated_at = now()
 where key = 'contact';


-- ---------------------------------------------------------------------------
-- 2. The two days. Both are at the temple now — the quiz included, since it is
--    answered on a device but sat on site so that nobody can take it with help
--    at home. The `online_date` / `onsite_date` keys keep their names so
--    nothing else has to change; read them as "first day" and "second day".
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'edition',       '2026',
         'online_date',   '2026-08-23',
         'onsite_date',   '2026-08-30',
         'venue',         'ISKCON Guwahati, Ulubari',
         'venue_map_url', 'https://maps.google.com/?q=ISKCON+Ulubari+Guwahati',
         'city',          'Guwahati, Assam'
       ),
       updated_at = now()
 where key = 'event';


-- ---------------------------------------------------------------------------
-- 3. Registration window and fee.
--
--    `fee` is now the price of ONE competition. submit_registration multiplies
--    it by the number of entries, so a student entering three owes 297.
--
--    `closes_at` is only the headline date shown to students. The real cut-off
--    is per competition, in tracks.registration_closes_at (section 4), because
--    the two days close on different dates.
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'open',         true,
         'fee',          99,
         'closes_at',    '2026-08-28',
         'hold_minutes', 60
       ),
       updated_at = now()
 where key = 'registration';


-- ---------------------------------------------------------------------------
-- 4. Per-competition entry deadlines.
--
--    seed.sql sets these too; repeated here so a database that is seeded but
--    not re-seeded still gets them.
-- ---------------------------------------------------------------------------
update tracks set registration_closes_at = '2026-08-22'
 where event_date = '2026-08-23';

update tracks set registration_closes_at = '2026-08-28'
 where event_date = '2026-08-30';


-- ---------------------------------------------------------------------------
-- 5. Payment: cash at the temple, and nothing else.
--
--    The UPI and Razorpay code paths are intact but dormant. Switching either
--    back on is a toggle in Admin → Settings, not a rebuild — but do not turn
--    UPI on without setting a real upi_id first.
-- ---------------------------------------------------------------------------
insert into settings (key, value, is_public) values (
  'payment',
  jsonb_build_object(
    'upi_id',   '',
    'upi_name', 'ISKCON Guwahati',
    'methods',  jsonb_build_object(
      'upi_manual',   false,
      'pay_at_venue', true,
      'razorpay',     false
    )
  ),
  true
)
on conflict (key) do update
  set value = excluded.value, updated_at = now();


-- ---------------------------------------------------------------------------
-- 6. Songs withdrawn from the bhajan list.
--
--    Deleted outright only where nobody has chosen them. Where a student has,
--    the foreign key would refuse the delete — and should: it would throw away
--    their entry. Those are deactivated instead, which hides the song from new
--    registrations while leaving the existing singer untouched.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_n int;
begin
  for r in
    select id, title from selection_items
     where title in ('Damodarastakam', 'Sri Gurvastakam', 'Jai Jagadish Hare')
  loop
    select count(*) into v_n
      from registration_tracks where selection_item_id = r.id;

    if v_n = 0 then
      delete from selection_items where id = r.id;
      raise notice 'Removed "%" — nobody had chosen it.', r.title;
    else
      update selection_items set is_active = false where id = r.id;
      raise notice '"%" is kept but hidden: % student(s) already chose it.', r.title, v_n;
    end if;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 6b. Songs added to the bhajan list.
--
--     seed.sql adds these too; repeated here so an already-seeded database
--     picks them up without a re-seed. Skips any that are already present, so
--     re-running never creates a duplicate.
--
--     Note "payo ji main ram ratan dhan payo" is not in this list: it is the
--     Meerabai bhajan already seeded as "Payoji Maine Ram Ratan Dhan".
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, title, subtitle, max_slots, sort_order)
select t.id, v.title, v.subtitle, v.cap, v.ord
  from tracks t
  cross join (values
    ('Maiya Mori Main Nahin Makhan Khayo', 'Surdas',                        3, 21),
    ('Shri Ramachandra Kripalu Bhaja Man', 'Tulsidas',                      3, 22),
    ('Mangal Bhavan Amangal Hari',         'Tulsidas — Ramcharitmanas',     3, 23),
    ('Thumak Chalat Ramachandra',          'Tulsidas — baajat painjaniya',  3, 24)
  ) as v(title, subtitle, cap, ord)
 where t.slug = 'devotional-bhajan'
   and not exists (
     select 1 from selection_items si where si.track_id = t.id and si.title = v.title
   );


-- ---------------------------------------------------------------------------
-- 7. Re-price existing registrations at 99 per competition.
--
--    Anyone already marked paid is left alone and reported instead: silently
--    raising what a paid student owes would turn them into a debtor in the day
--    sheet through no fault of their own. Decide those by hand.
-- ---------------------------------------------------------------------------
do $$
declare
  v_fee  int;
  v_paid int;
  v_upd  int;
begin
  select coalesce((value->>'fee')::int, 99) into v_fee
    from settings where key = 'registration';

  update registrations r
     set fee_amount = v_fee * greatest(
           (select count(*) from registration_tracks rt where rt.registration_id = r.id), 1),
         updated_at = now()
   where r.payment_status <> 'paid';
  get diagnostics v_upd = row_count;

  select count(*) into v_paid from registrations where payment_status = 'paid';

  raise notice 'Re-priced % unpaid registration(s) at % per competition.', v_upd, v_fee;
  if v_paid > 0 then
    raise notice '% registration(s) are already marked paid and were NOT re-priced — check them by hand.', v_paid;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 8. Everyone pays at the temple now, so move unpaid registrations off UPI.
--    Their reported UPI references are cleared with them; nothing was taken.
-- ---------------------------------------------------------------------------
update registrations
   set payment_method  = 'pay_at_venue',
       payment_status  = 'pending',
       upi_reference   = null,
       hold_expires_at = null,
       updated_at      = now()
 where payment_status <> 'paid'
   and (payment_method is distinct from 'pay_at_venue' or hold_expires_at is not null);


-- ---------------------------------------------------------------------------
-- 9. Guardian WhatsApp is now required, email optional.
--
--    Added NOT VALID on purpose: it applies to every new registration from now
--    on, but does not retroactively reject rows written under the old rule,
--    which would make the table unwritable until they were fixed. The query at
--    the end lists any that need a number filled in by hand.
-- ---------------------------------------------------------------------------
alter table registrations drop constraint if exists registrations_reachable;

alter table registrations add constraint registrations_reachable
  check (nullif(btrim(coalesce(whatsapp, '')), '') is not null) not valid;


-- ---------------------------------------------------------------------------
-- 10. Sanity check — read these before you open registration
-- ---------------------------------------------------------------------------

-- The running order, with times and cut-offs. Expect six rows, all 'onsite'.
select name,
       mode,
       event_date,
       to_char(start_time, 'HH24:MI') as starts,
       to_char(end_time,   'HH24:MI') as ends,
       registration_closes_at as entries_close,
       requires_selection as picks_a_song
  from tracks
 where is_active
 order by event_date, start_time, sort_order;

-- Payment: expect pay_at_venue true and the other two false.
select value->'methods' as enabled_methods,
       value->>'upi_id' as upi_id_should_be_blank
  from settings where key = 'payment';

-- What each existing registration now owes.
select r.reg_code,
       r.full_name,
       count(rt.id) as competitions,
       r.fee_amount,
       r.payment_method,
       r.payment_status
  from registrations r
  left join registration_tracks rt on rt.registration_id = r.id
 group by r.id
 order by r.created_at;

-- Registrations with no WhatsApp number, written under the old rule. Fill
-- these in from Admin → Registrations, or the day-of reminders will miss them.
select reg_code, full_name, guardian_phone, email
  from registrations
 where nullif(btrim(coalesce(whatsapp, '')), '') is null;
