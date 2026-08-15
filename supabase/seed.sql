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
-- The five competitions
--   23 August — online:  Vedic Quiz, Gita Shloka Uchcharan
--   30 August — onsite:  Vedic Art, Vedic Fancy Dress, Devotional Bhajan
--                        (ISKCON Ulubari, Guwahati)
-- ---------------------------------------------------------------------------
insert into tracks (
  slug, name, sanskrit_name, tagline, description, icon, accent,
  rules, what_to_bring, duration_minutes, mode, event_date,
  min_class, max_class, is_team, min_team_size, max_team_size,
  requires_selection, selection_label, selection_help, sort_order
) values
  (
    'vedic-quiz', 'Vedic Quiz', 'Jnana Yajna',
    'How well do you know your roots?',
    'An online quiz on the Bhagavad-gita, the Ramayana and Mahabharata, the Puranas, and the culture and heritage of Bharat. Multiple choice, open book strictly not allowed.',
    'brain', 'teal',
    array[
      'Held online on 23 August. The link is sent to your email or WhatsApp a day before.',
      'Individual participation. No phones, notes or help from others.',
      'You get one attempt, within the time window announced.',
      'A stable internet connection is your responsibility — try to be ready 10 minutes early.'
    ],
    array['A phone, tablet or computer', 'A quiet 30 minutes'],
    30, 'online', '2026-08-23',
    1, 10, false, 1, 1, false, null, null, 1
  ),
  (
    'vedic-art', 'Vedic Art', 'Chitrakala',
    'Let your colours tell the story.',
    'Bring the pastimes of Krishna, the beauty of our temples and the spirit of our heritage onto paper. Held at the temple on 30 August.',
    'palette', 'saffron',
    array[
      'Held at ISKCON Ulubari on 30 August.',
      'The theme is announced on the spot, so every artist starts equal.',
      'Drawing sheet is provided. Bring your own colours.',
      'No tracing, no printed references, no help from adults.'
    ],
    array['Colours of your choice', 'Brushes, palette and a water jar', 'Pencil and eraser', 'A drawing board'],
    90, 'onsite', '2026-08-30',
    1, 10, false, 1, 1, false, null, null, 2
  ),
  (
    'vedic-fancy-dress', 'Vedic Fancy Dress', 'Vesha Bhusha',
    'Become the character you love.',
    'Dress as a personality from our scriptures and speak a few lines in their voice. Judged on costume, confidence and how well you carry the character — not on how expensive the outfit is.',
    'mask', 'magenta',
    array[
      'Held at ISKCON Ulubari on 30 August.',
      'Speak 4 to 6 lines introducing yourself as that character.',
      'Costume is arranged by the participant.',
      'No live animals, no sharp props, no open flame.'
    ],
    array['Your costume and props', 'A backing track on a pen drive (optional)'],
    5, 'onsite', '2026-08-30',
    1, 10, false, 1, 1, false, null, null, 3
  ),
  (
    'devotional-bhajan', 'Devotional Bhajan', 'Bhajan & Kirtan',
    'Sing what the heart already knows.',
    'A bhajan or kirtan of your choosing, sung solo. Harmonium, tabla, kartals or a simple track — or nothing at all. Judged on melody, clarity of words, rhythm and devotion.',
    'music', 'peacock',
    array[
      'Held at ISKCON Ulubari on 30 August.',
      'Solo performance only.',
      'Choose your song while registering — at most 3 students may sing the same one.',
      'You may bring your own instrument or accompanist.',
      'Karaoke tracks are allowed on a pen drive; hand it in 30 minutes before your slot.'
    ],
    array['Your instrument, if you play one', 'A pen drive with your track (optional)'],
    5, 'onsite', '2026-08-30',
    1, 10, false, 1, 1,
    true, 'Song',
    'At most 3 students may sing the same song, so the evening stays varied. Songs already taken are marked — pick another and you will stand out more anyway.',
    4
  ),
  (
    'gita-shloka', 'Gita Shloka Uchcharan', 'Shloka Uchcharana',
    'Ancient verses, young voices.',
    'Recite verses from the Bhagavad-gita from memory. Judged on pronunciation, rhythm, memory and the feeling you bring to the verse.',
    'scroll', 'gold',
    array[
      'Held online on 23 August, 4 pm to 6 pm.',
      'Recite from memory — no reading from a book or phone.',
      'The joining link is sent to your email or WhatsApp a day before.',
      'Class 1–5: any two verses. Class 6–10: any four verses.',
      'Sanskrit pronunciation carries the most weight in scoring.',
      'You may be asked the meaning of a verse in one or two lines.'
    ],
    array['Nothing — just your memory and your voice'],
    4, 'online', '2026-08-23',
    1, 10, false, 1, 1, false, null, null, 5
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
      min_class = excluded.min_class,
      max_class = excluded.max_class,
      requires_selection = excluded.requires_selection,
      selection_label = excluded.selection_label,
      selection_help = excluded.selection_help,
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
    ('Damodarastakam',                  'namamisvaram sac-cid-ananda-rupam',          3, 5),
    ('Madhurastakam',                   'adharam madhuram — Vallabhacharya',          3, 6),
    ('Achyutam Keshavam',               'Traditional bhajan',                         3, 7),
    ('Yashomati Nandana',               'Bhaktivinoda Thakura',                       3, 8),
    ('Nandalala / Nanda Kumar',         'Traditional',                                3, 9),
    ('Vaishnava Jana To',               'Narsinh Mehta',                              3, 10),
    ('Gopinath',                        'Bhaktivinoda Thakura',                       3, 11),
    ('Hari Haraye Namah Krishna',       'Traditional kirtan',                         3, 12),
    ('Shri Krishna Govind Hare Murari', 'Traditional',                                3, 13),
    ('Jai Jagadish Hare',               'Aarti',                                      3, 14),
    ('Radhe Radhe Govind',              'Traditional',                                3, 15),
    ('Bhaja Govindam',                  'Adi Shankaracharya',                         3, 16),
    ('Payoji Maine Ram Ratan Dhan',     'Meerabai',                                   3, 17),
    ('Sri Gurvastakam',                 'samsara-davanala — Visvanatha Cakravarti',   3, 18),
    ('Jaya Jaya Devaki Nandana',        'Traditional',                                3, 19),
    ('Bhajahu Re Mana',                 'Govinda Dasa Kaviraja',                      3, 20)
  ) as v(title, subtitle, cap, ord)
 where t.slug = 'devotional-bhajan'
   and not exists (
     select 1 from selection_items si where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- Gallery — generated placeholder tiles until real photos are uploaded.
-- Replace image_url with a Supabase Storage public URL to show a photograph.
-- ---------------------------------------------------------------------------
insert into gallery_items (year, title, caption, image_url, is_featured, sort_order)
select v.year, v.title, v.caption, v.url, v.featured, v.ord
  from (values
    (2025, 'At ISKCON Ulubari',   'The temple hall on the day of the competition.',       'placeholder:temple-1',  true,  1),
    (2025, 'Vedic Art',           'Ninety minutes, one theme, three hundred imaginations.','placeholder:art-1',     true,  2),
    (2025, 'Devotional Bhajan',   'A Class 6 student opening with Jaya Radha Madhava.',    'placeholder:music-1',   true,  3),
    (2025, 'Fancy Dress',         'The fancy dress round is always the loudest.',          'placeholder:costume-1', true,  4),
    (2024, 'Shloka Uchcharan',    'Verses from the Gita, recited from memory.',            'placeholder:scroll-1',  false, 5),
    (2024, 'Prize distribution',  'Certificates, prizes and prasadam for every participant.','placeholder:award-1', false, 6)
  ) as v(year, title, caption, url, featured, ord)
 where not exists (select 1 from gallery_items g where g.image_url = v.url);

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
insert into settings (key, value, is_public) values
  (
    'registration',
    jsonb_build_object(
      'open', true,
      'fee', 99,
      'closes_at', '2026-08-21',
      -- How long an unpaid registration holds its bhajan song slot before it
      -- is released for someone else. Generous: a UPI payment takes 2 minutes,
      -- but a child may need to find a parent first.
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
      'methods', jsonb_build_object(
        'upi_manual', true,
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
      'phone', '+91 87610 13927',
      'whatsapp', '+91 87610 13927',
      'instagram', ''
    ),
    true
  )
on conflict (key) do nothing;

select recount_selection_slots();
