-- ============================================================================
--  One-off patches for a database that has ALREADY been seeded (v2).
--
--  seed.sql uses `on conflict do nothing` on `settings`, so re-running it never
--  clobbers edits you made from the admin portal. That also means seed.sql
--  cannot change those rows once they exist. This file changes them explicitly.
--
--  Safe to re-run. Run it in the Supabase SQL editor.
--  Everything here is also editable from Admin → Settings.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Contact details
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'email',     'iyfguwahati@gmail.com',
         'phone',     '+91 87610 13927',
         'whatsapp',  '+91 87610 13927',
         'instagram', ''
       ),
       updated_at = now()
 where key = 'contact';

-- ---------------------------------------------------------------------------
-- 2. Event dates and venue
--    23 August — online (Vedic Quiz, Vedic Essay)
--    30 August — at the temple (Art, Fancy Dress, Bhajan, Shloka)
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
-- 3. Registration window and fee
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'open',         true,
         'fee',          99,
         'closes_at',    '2026-08-21',
         'hold_minutes', 60
       ),
       updated_at = now()
 where key = 'registration';

-- ---------------------------------------------------------------------------
-- 4. Payment methods and the UPI account money goes to
--
--    ⚠️  REPLACE THE upi_id BELOW WITH YOUR REAL ONE, and send yourself ₹1 to
--        confirm it before opening registration. This is the single value in
--        the whole project where a typo costs actual money.
--
--    Switch 'razorpay' to true only once the Edge Functions are deployed
--    (see PAYMENTS.md) — otherwise students hit a broken checkout.
-- ---------------------------------------------------------------------------
insert into settings (key, value, is_public) values (
  'payment',
  jsonb_build_object(
    'upi_id',   'REPLACE-ME@bank',
    'upi_name', 'ISKCON Guwahati',
    'methods',  jsonb_build_object(
      'upi_manual',   true,
      'pay_at_venue', true,
      'razorpay',     false
    )
  ),
  true
)
on conflict (key) do update
  set value = excluded.value, updated_at = now();

-- ---------------------------------------------------------------------------
-- 5. Sanskrit names without combining diacritics
--    The display font (and many phone fonts) has no glyph for a / s / n / s
--    with macrons and dots, so "Chitrakala" rendered with a stray bar above.
--    Plain transliteration renders correctly everywhere, including on budget
--    Android devices. seed.sql now carries these values too — this is here so
--    an already-seeded database picks them up without a full re-seed.
-- ---------------------------------------------------------------------------
update tracks set sanskrit_name = 'Jnana Yajna'       where slug = 'vedic-quiz';
update tracks set sanskrit_name = 'Nibandha'          where slug = 'vedic-essay';
update tracks set sanskrit_name = 'Chitrakala'        where slug = 'vedic-art';
update tracks set sanskrit_name = 'Vesha Bhusha'      where slug = 'vedic-fancy-dress';
update tracks set sanskrit_name = 'Bhajan & Kirtan'   where slug = 'devotional-bhajan';
update tracks set sanskrit_name = 'Shloka Uchcharana' where slug = 'gita-shloka';

-- ---------------------------------------------------------------------------
-- 6. Remove the Vedic Essay competition
--
--    Deletes it outright if nobody has entered. If students HAVE entered, a
--    delete would be refused by the foreign key (and would be wrong — it would
--    throw away their entries), so it is deactivated instead: hidden from the
--    site, existing entries preserved, and you can still see them in the admin
--    portal to contact those students.
-- ---------------------------------------------------------------------------
do $$
declare v_n int;
begin
  select count(*) into v_n
    from registration_tracks rt
    join tracks t on t.id = rt.track_id
   where t.slug = 'vedic-essay';

  if v_n = 0 then
    delete from tracks where slug = 'vedic-essay';
    raise notice 'Vedic Essay removed — nobody had entered it.';
  else
    update tracks set is_active = false where slug = 'vedic-essay';
    raise notice '% student(s) had already entered Vedic Essay. It is now hidden from the site, but their entries are kept — contact them before the day.', v_n;
  end if;
end $$;

-- Close the gap the essay left in the running order.
update tracks set sort_order = 2 where slug = 'vedic-art';
update tracks set sort_order = 3 where slug = 'vedic-fancy-dress';
update tracks set sort_order = 4 where slug = 'devotional-bhajan';
update tracks set sort_order = 5 where slug = 'gita-shloka';

-- ---------------------------------------------------------------------------
-- 7. Sanity check — what the site will show
-- ---------------------------------------------------------------------------
select value->>'upi_id' as upi_id_students_will_pay_to,
       value->'methods' as enabled_methods
  from settings where key = 'payment';

select name,
       sanskrit_name,
       mode,
       event_date,
       requires_selection as picks_a_song
  from tracks
 order by sort_order;
