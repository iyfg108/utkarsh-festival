-- ============================================================================
--  One-off patches for a database that has ALREADY been seeded.
--
--  seed.sql is written to be safe to re-run, but a few tables deliberately use
--  `on conflict do nothing` so that re-seeding never clobbers edits made from
--  the admin portal. This file applies those changes explicitly.
--
--  Safe to re-run. Run it in the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Contact details
--    `settings` is never overwritten by seed.sql, so set it here once.
--    After this you can edit these from Admin → Settings → Contact details.
-- ---------------------------------------------------------------------------
update settings
   set value = jsonb_build_object(
         'email',     'iyfguwahati@gmail.com',
         'phone',     '+91 87610 13927',
         'whatsapp',  '+91 87610 13927',
         'instagram', 'https://instagram.com/'
       ),
       updated_at = now()
 where key = 'contact';

-- ---------------------------------------------------------------------------
-- 2. Sanskrit track names without combining diacritics
--    The display font (and many phone fonts) has no glyph for ā / ṣ / ṇ / ś,
--    so "Chitrakalā" rendered as "Chitrakala¯". Plain transliteration renders
--    correctly everywhere, including budget Android devices.
--    (Re-running seed.sql also applies this — included here for completeness.)
-- ---------------------------------------------------------------------------
update tracks set sanskrit_name = 'Chitrakala'         where slug = 'chitrakala';
update tracks set sanskrit_name = 'Vesha Bhusha'       where slug = 'vesh-bhusha';
update tracks set sanskrit_name = 'Shloka Uchcharana'  where slug = 'sloka-recitation';
update tracks set sanskrit_name = 'Bhajan & Kirtan'    where slug = 'devotional-music';
update tracks set sanskrit_name = 'Nritya'             where slug = 'nritya';
update tracks set sanskrit_name = 'Natak'              where slug = 'natak';
update tracks set sanskrit_name = 'Gyana Yajna'        where slug = 'gyan-yagna';
update tracks set sanskrit_name = 'Vaktritva'          where slug = 'vaktritva';

-- ---------------------------------------------------------------------------
-- 3. Keep slot counters honest (no-op if everything already agrees)
-- ---------------------------------------------------------------------------
select recount_selection_slots();

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
select slug, name, sanskrit_name from tracks order by sort_order;
select key, value from settings where key = 'contact';
