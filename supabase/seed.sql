-- ============================================================================
--  UTKARSH HERITAGE FESTIVAL — seed data (v2)
--  Run after schema.sql. Safe to re-run.
--
--  Check before going live:
--    * The two event dates in the `event` setting at the bottom.
--    * The contact phone/email in the `contact` setting.
--    * The fee in the `registration` setting.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- The six competitions. Everything happens at ISKCON Ulubari, Guwahati.
--
--   23 August, 9–11 am    Vedic Quiz · Gita Shloka Recitation · Devotional Essay
--   30 August, 9 am–12 pm Vedic Art · Vedic Fancy Dress
--   30 August, 4–6 pm     Devotional Bhajan
--
-- Note every competition is `onsite`, the quiz included. It is answered on a
-- device, but at the temple, so no one can sit it with help at home. Entries
-- close per day (22 August and 28 August), not festival-wide.
-- ---------------------------------------------------------------------------
insert into tracks (
  slug, name, sanskrit_name, tagline, description, icon, accent,
  rules, what_to_bring, duration_minutes, mode, event_date,
  start_time, end_time, registration_closes_at,
  min_class, max_class, is_team, min_team_size, max_team_size,
  requires_selection, selection_label, selection_help, sort_order
) values
  (
    'vedic-quiz', 'Vedic Quiz', 'Jnana Yajna',
    'How well do you know your roots?',
    'A quiz on the Bhagavad-gita, the Ramayana and Mahabharata, the Puranas, and the culture and heritage of Bharat. Answered on a device at the temple, so every student sits it under the same conditions.',
    'brain', 'teal',
    array[
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'The quiz is answered on a device, but you attempt it at the temple — that way nobody has an unfair advantage at home.',
      'You sit with your group, and each group gets its own set of questions: Group A is Class 1–4, Group B is Class 5–7, Group C is Class 8–10.',
      'Individual participation. No phones, notes or help from others.',
      'Come 15 minutes early so we can seat your group together.'
    ],
    array['A mobile phone with internet connection'],
    30, 'onsite', '2026-08-23',
    '09:00', '11:00', '2026-08-22',
    1, 10, false, 1, 1, false, null, null, 1
  ),
  (
    'gita-shloka', 'Gita Shloka Recitation', 'Shloka Uchcharana',
    'Ancient verses, young voices.',
    'Recite verses from the Bhagavad-gita from memory. Judged on pronunciation, rhythm, memory and the feeling you bring to the verse.',
    'scroll', 'gold',
    array[
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'Recite from memory — no reading from a book or phone.',
      'Sanskrit pronunciation carries the most weight in scoring.',
      'You may be asked the meaning of a verse in one or two lines.'
    ],
    array['Nothing — just your memory and your voice'],
    4, 'onsite', '2026-08-23',
    '09:00', '11:00', '2026-08-22',
    1, 10, false, 1, 1, false, null, null, 2
  ),
  (
    'devotional-essay', 'Devotional Essay', 'Lekhana',
    'Say it in your own words.',
    'A written essay on a devotional theme, handwritten at the temple. The topic is announced on the spot, so nothing can be prepared in advance and every student starts equal. Judged on thought, clarity and honesty rather than long words.',
    'scroll', 'indigo',
    array[
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'The topic is announced on the spot.',
      'Handwritten. Paper is provided — bring your own pen.',
      'Write in English, Hindi or Assamese, whichever you think in.',
      'Your own words only. No printed material, no phones, no help from adults.'
    ],
    array['A pen you are comfortable writing with'],
    60, 'onsite', '2026-08-23',
    '09:00', '11:00', '2026-08-22',
    1, 10, false, 1, 1, false, null, null, 3
  ),
  (
    'vedic-art', 'Vedic Art', 'Chitrakala',
    'Let your colours tell the story.',
    'Bring the pastimes of Krishna, the beauty of our temples and the spirit of our heritage onto paper.',
    'palette', 'saffron',
    array[
      'Held at ISKCON Ulubari on 30 August, 9 am to 12 noon.',
      'The theme is announced on the spot, so every artist starts equal.',
      'Drawing sheet is provided. Bring your own colours.',
      'No tracing, no printed references, no help from adults.'
    ],
    array['Colours of your choice', 'Brushes, palette and a water jar', 'Pencil and eraser', 'A drawing board'],
    90, 'onsite', '2026-08-30',
    '09:00', '12:00', '2026-08-28',
    1, 10, false, 1, 1, false, null, null, 4
  ),
  (
    'vedic-fancy-dress', 'Vedic Fancy Dress', 'Vesha Bhusha',
    'Become the character you love.',
    'Dress as a personality from our scriptures and speak a few lines in their voice. Judged on costume, confidence and how well you carry the character — not on how expensive the outfit is.',
    'mask', 'magenta',
    array[
      'Held at ISKCON Ulubari on 30 August, 9 am to 12 noon.',
      'Speak 4 to 6 lines introducing yourself as that character.',
      'Costume is arranged by the participant.',
      'No live animals, no sharp props, no open flame.'
    ],
    array['Your costume and props', 'A backing track on a pen drive (optional)'],
    5, 'onsite', '2026-08-30',
    '09:00', '12:00', '2026-08-28',
    1, 10, false, 1, 1, false, null, null, 5
  ),
  (
    'devotional-bhajan', 'Devotional Bhajan', 'Bhajan & Kirtan',
    'Sing what the heart already knows.',
    'A bhajan or kirtan of your choosing, sung solo. Harmonium, tabla, kartals or a simple track — or nothing at all. Judged on melody, clarity of words, rhythm and devotion.',
    'music', 'peacock',
    array[
      'Held at ISKCON Ulubari on 30 August, 4 pm to 6 pm.',
      'Solo performance only.',
      'Choose your song while registering — at most 3 students may sing the same one.',
      'You may bring your own instrument or accompanist.',
      'Karaoke tracks are allowed on a pen drive; hand it in 30 minutes before your slot.'
    ],
    array['Your instrument, if you play one', 'A pen drive with your track (optional)'],
    5, 'onsite', '2026-08-30',
    '16:00', '18:00', '2026-08-28',
    1, 10, false, 1, 1,
    true, 'Song',
    'At most 3 students may sing the same song, so the evening stays varied. Songs already taken are marked — pick another and you will stand out more anyway.',
    6
  )
on conflict (slug) do update
  set name = excluded.name,
      sanskrit_name = excluded.sanskrit_name,
      tagline = excluded.tagline,
      description = excluded.description,
      icon = excluded.icon,
      accent = excluded.accent,
      rules = excluded.rules,
      what_to_bring = excluded.what_to_bring,
      duration_minutes = excluded.duration_minutes,
      mode = excluded.mode,
      event_date = excluded.event_date,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      registration_closes_at = excluded.registration_closes_at,
      min_class = excluded.min_class,
      max_class = excluded.max_class,
      requires_selection = excluded.requires_selection,
      selection_label = excluded.selection_label,
      selection_help = excluded.selection_help,
      is_active = true,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Bhajans — 3 singers each, the maha-mantra a little more
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, title, subtitle, max_slots, sort_order)
select t.id, v.title, v.subtitle, v.cap, v.ord
  from tracks t
  cross join (values
    ('Hare Krishna Kirtan',             'The maha-mantra, any tune',                  5, 1),
    ('Jaya Radha Madhava',              'Bhaktivinoda Thakura',                       3, 2),
    ('Govinda Jaya Jaya',               'Traditional',                                3, 3),
    ('Sri Krishna Caitanya',            'Panca-tattva kirtan',                        3, 4),
    ('Madhurastakam',                   'adharam madhuram — Vallabhacharya',          3, 6),
    ('Achyutam Keshavam',               'Traditional bhajan',                         3, 7),
    ('Yashomati Nandana',               'Bhaktivinoda Thakura',                       3, 8),
    ('Nandalala / Nanda Kumar',         'Traditional',                                3, 9),
    ('Vaishnava Jana To',               'Narsinh Mehta',                              3, 10),
    ('Gopinath',                        'Bhaktivinoda Thakura',                       3, 11),
    ('Hari Haraye Namah Krishna',       'Traditional kirtan',                         3, 12),
    ('Shri Krishna Govind Hare Murari', 'Traditional',                                3, 13),
    ('Radhe Radhe Govind',              'Traditional',                                3, 15),
    ('Bhaja Govindam',                  'Adi Shankaracharya',                         3, 16),
    ('Payoji Maine Ram Ratan Dhan',     'Meerabai',                                   3, 17),
    ('Jaya Jaya Devaki Nandana',        'Traditional',                                3, 19),
    ('Bhajahu Re Mana',                 'Govinda Dasa Kaviraja',                      3, 20),
    ('Maiya Mori Main Nahin Makhan Khayo', 'Surdas',                                   3, 21),
    ('Shri Ramachandra Kripalu Bhaja Man', 'Tulsidas',                                 3, 22),
    ('Mangal Bhavan Amangal Hari',         'Tulsidas — Ramcharitmanas',                3, 23),
    ('Thumak Chalat Ramachandra',          'Tulsidas — baajat painjaniya',             3, 24)
  ) as v(title, subtitle, cap, ord)
 where t.slug = 'devotional-bhajan'
   and not exists (
     select 1 from selection_items si where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- Gallery — deliberately not seeded.
--
-- The gallery is switched off for 2026: there were no real photographs to show
-- and the generated placeholder tiles read as a broken page. The table and its
-- policies are still in schema.sql, so turning it back on for a later edition
-- means restoring the page component, not migrating the database.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
insert into settings (key, value, is_public) values
  (
    'registration',
    jsonb_build_object(
      'open', true,
      -- The price of ONE competition. A student entering three owes 3 x this;
      -- submit_registration multiplies by the number of entries.
      'fee', 99,
      -- Latest of the per-competition cut-offs, shown as the headline date.
      -- The real enforcement is tracks.registration_closes_at, per day.
      'closes_at', '2026-08-28',
      -- Song slots are no longer held against payment — everyone pays cash at
      -- the temple, so a registration is final the moment it is submitted.
      -- Kept for the fallback path in release_expired_holds().
      'hold_minutes', 60
    ),
    true
  ),
  (
    'event',
    jsonb_build_object(
      'edition', '2026',
      'online_date', '2026-08-23',
      'onsite_date', '2026-08-30',
      'venue', 'ISKCON Guwahati, Ulubari',
      'venue_map_url', 'https://maps.google.com/?q=ISKCON+Ulubari+Guwahati',
      'city', 'Guwahati, Assam'
    ),
    true
  ),
  (
    -- Which payment methods students may choose, and where UPI money goes.
    -- Switch razorpay on from Admin → Settings once your keys are deployed —
    -- no rebuild needed.
    'payment',
    jsonb_build_object(
      -- LEFT BLANK ON PURPOSE. Set your real UPI ID in
      -- Admin -> Settings -> How students pay, or via patches.sql.
      -- A guessed VPA would send students' money to the wrong place (or
      -- nowhere) silently; blank makes the site say "UPI is not set up yet"
      -- instead, which is a visible failure you will notice immediately.
      'upi_id', '',
      'upi_name', 'ISKCON Guwahati',
      -- Cash at the temple is the only method offered for 2026. The UPI and
      -- Razorpay code paths are intact and dormant; switching either back on
      -- from Admin -> Settings is all it takes, no rebuild.
      'methods', jsonb_build_object(
        'upi_manual', false,
        'pay_at_venue', true,
        'razorpay', false
      )
    ),
    true
  ),
  (
    'contact',
    jsonb_build_object(
      'email', 'iyfguwahati@gmail.com',
      'phone', '+91 93950 40843',
      'whatsapp', '+91 93950 40843',
      'instagram', ''
    ),
    true
  )
on conflict (key) do nothing;

select recount_selection_slots();
