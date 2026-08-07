-- ============================================================================
--  UTKARSH HERITAGE FESTIVAL — seed data
--  Run AFTER schema.sql. Safe to re-run: everything is idempotent.
--
--  Edit freely — every row here is also editable from the admin portal.
--  Two things you should review before going live:
--    1. The `event` and `registration` settings at the bottom (dates!).
--    2. The school list — replace with the schools actually taking part.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Age categories
-- ---------------------------------------------------------------------------
insert into categories (code, name, description, min_class, max_class, sort_order) values
  ('junior', 'Junior',  'Class 1 to 4',  1, 4,  1),
  ('middle', 'Middle',  'Class 5 to 8',  5, 8,  2),
  ('senior', 'Senior',  'Class 9 to 12', 9, 12, 3)
on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      min_class = excluded.min_class,
      max_class = excluded.max_class,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Schools — SAMPLE LIST. Replace with your actual participating schools.
-- ---------------------------------------------------------------------------
insert into schools (name, slug, area, is_active) values
  ('Don Bosco School, Guwahati',        'don-bosco-guwahati',   'Panbazar',   true),
  ('South Point School',                'south-point',          'Dispur',     true),
  ('Delhi Public School, Guwahati',     'dps-guwahati',         'Jatia',      true),
  ('Maria''s Public School',            'marias-public',        'Bhangagarh', true),
  ('Sanskriti The Gurukul',             'sanskriti-gurukul',    'Beltola',    true),
  ('Faculty Higher Secondary School',   'faculty-hs',           'Ulubari',    true),
  ('Kendriya Vidyalaya, Khanapara',     'kv-khanapara',         'Khanapara',  true),
  ('Army Public School, Narangi',       'aps-narangi',          'Narangi',    true),
  ('Holy Child School',                 'holy-child',           'Six Mile',   true),
  ('Gurukul Grammar Senior Secondary',  'gurukul-grammar',      'Geetanagar', true),
  ('Sarala Birla Gyan Jyoti',           'sarala-birla',         'Ahom Gaon',  true),
  ('Assam Jatiya Bidyalay',             'assam-jatiya',         'Noonmati',   true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Competition tracks
-- ---------------------------------------------------------------------------
insert into tracks (
  slug, name, sanskrit_name, tagline, description, icon, accent,
  rules, what_to_bring, duration_minutes,
  is_team, min_team_size, max_team_size,
  requires_selection, selection_label, selection_help, sort_order
) values
  (
    'chitrakala', 'Art & Painting', 'Chitrakalā',
    'Let your colours tell the story.',
    'Bring the pastimes of Krishna, the beauty of our temples and the spirit of our heritage onto paper. Themes are announced on the spot so every artist starts equal — what you bring is your imagination.',
    'palette', 'saffron',
    array[
      'Theme is announced on the spot at the start of the round.',
      'Drawing sheet is provided by the organisers.',
      'Bring your own colours — crayons, poster, watercolour or pencil.',
      'Work must be completed within the time limit. No tracing or printed references.'
    ],
    array['Colours of your choice', 'Brushes, palette and a water jar', 'Pencil and eraser', 'A drawing board'],
    90, false, 1, 1, false, null, null, 1
  ),
  (
    'vesh-bhusha', 'Fancy Dress', 'Veṣa Bhūṣā',
    'Become the character you love.',
    'Dress as a personality from our scriptures and speak a few lines in their voice. Judged on costume, confidence and how well you carry the character — not on how expensive the outfit is.',
    'mask', 'magenta',
    array[
      'Choose your character while registering — only 2 students per character, so book early.',
      'Speak 4 to 6 lines introducing yourself as that character.',
      'Costume should be arranged by the participant.',
      'No live pets, no sharp props, no open flame.'
    ],
    array['Your costume and props', 'A backing track on a pen drive (optional)'],
    5, false, 1, 1, true, 'Character',
    'Each character can be taken by at most 2 students, so the stage stays varied. Pick early — popular characters fill up fast.',
    2
  ),
  (
    'sloka-recitation', 'Sloka Recitation', 'Śloka Uchchāraṇa',
    'Ancient verses, young voices.',
    'Recite verses from the Bhagavad-gita, Sri Isopanisad and our prayer tradition. Judged on pronunciation, rhythm, memory and the feeling you bring to the verse.',
    'scroll', 'gold',
    array[
      'Recite from memory — no reading from a book or phone.',
      'Choose your sloka while registering; each one is capped so we hear a variety.',
      'Sanskrit pronunciation carries the most weight in scoring.',
      'You may be asked the meaning of the verse in one or two lines.'
    ],
    array['Nothing — just your memory and your voice'],
    4, false, 1, 1, true, 'Sloka',
    'Verses are grouped by age band. Each sloka has a limited number of slots so we do not hear the same verse all evening.',
    3
  ),
  (
    'devotional-music', 'Devotional Music', 'Bhajan & Kīrtan',
    'Sing what the heart already knows.',
    'A bhajan or kirtan of your choosing, sung solo. Harmonium, tabla, kartals or a simple track — or nothing at all. Judged on melody, clarity of words, rhythm and devotion.',
    'music', 'peacock',
    array[
      'Solo performance only.',
      'Choose your song while registering — at most 3 students may sing the same song.',
      'You may bring your own instrument or accompanist.',
      'Karaoke tracks are allowed on a pen drive; hand it in 30 minutes before your slot.'
    ],
    array['Your instrument, if you play one', 'A pen drive with your track (optional)'],
    5, false, 1, 1, true, 'Song',
    'At most 3 students may sing the same song. Songs already full are marked — pick another and you will stand out more anyway.',
    4
  ),
  (
    'nritya', 'Classical Dance', 'Nṛtya',
    'Every mudra tells a pastime.',
    'Bharatanatyam, Odissi, Kathak, Sattriya or a devotional folk form — perform a composition rooted in our tradition. Judged on technique, expression (abhinaya), rhythm and costume.',
    'dance', 'rose',
    array[
      'Solo performance. Any classical or devotional folk style is welcome.',
      'Choose your composition while registering — capped at 3 students each.',
      'Bring your music on a pen drive, clearly labelled with your name and registration code.',
      'Costume and ghungroo are the participant''s responsibility.'
    ],
    array['Costume and ghungroo', 'Music on a labelled pen drive'],
    6, false, 1, 1, true, 'Composition',
    'Each composition can be taken by up to 3 dancers so the evening stays varied.',
    5
  ),
  (
    'natak', 'Skit & Drama', 'Nāṭak',
    'Bring the pastimes alive on stage.',
    'A short play on a scriptural episode. Teams of 4 to 10. Judged on storytelling, dialogue, teamwork, and how faithfully the pastime is told.',
    'drama', 'indigo',
    array[
      'Teams of 4 to 10 students from the same school.',
      'Choose your episode while registering — at most 2 teams may take the same one.',
      'Strictly within the time limit; going over costs marks.',
      'Keep props simple. No open flame, no water on stage.',
      'Dialogue may be in Assamese, Hindi, English or Sanskrit.'
    ],
    array['Costumes and simple props', 'Background music on a pen drive (optional)'],
    12, true, 4, 10, true, 'Episode',
    'At most 2 teams may perform the same episode, so the audience sees a different story each time.',
    6
  ),
  (
    'gyan-yagna', 'Heritage Quiz', 'Jñāna Yajña',
    'How well do you know your roots?',
    'A team quiz on the Bhagavad-gita, the Puranas, Indian history, art and the culture of Assam. Written prelims, then a live buzzer final on stage.',
    'brain', 'teal',
    array[
      'Teams of exactly 2 students from the same school.',
      'Written prelims first; the top teams go through to the stage round.',
      'No phones or notes during the quiz.',
      'The quizmaster''s decision is final.'
    ],
    array['A pen', 'Your quizzing partner'],
    45, true, 2, 2, false, null, null, 7
  ),
  (
    'vaktritva', 'Elocution', 'Vaktṛtva',
    'Say something worth hearing.',
    'A prepared speech on a theme from our heritage, in Assamese, Hindi or English. Judged on content, language, delivery and the ability to hold an audience.',
    'mic', 'amber',
    array[
      'Choose your topic while registering — up to 4 speakers per topic.',
      'Speak for the allotted time; a warning bell rings 30 seconds before the end.',
      'You may carry a cue card, but reading the whole speech costs marks.',
      'Assamese, Hindi or English — your choice.'
    ],
    array['A cue card, if you want one'],
    4, false, 1, 1, true, 'Topic',
    'Up to 4 speakers may take the same topic — hearing different takes on one theme is half the fun.',
    8
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
      is_team = excluded.is_team,
      min_team_size = excluded.min_team_size,
      max_team_size = excluded.max_team_size,
      requires_selection = excluded.requires_selection,
      selection_label = excluded.selection_label,
      selection_help = excluded.selection_help,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Which age bands each track is open to
-- ---------------------------------------------------------------------------
insert into track_categories (track_id, category_id)
select t.id, c.id
  from tracks t
  join categories c on true
 where (t.slug = 'chitrakala'       and c.code in ('junior','middle','senior'))
    or (t.slug = 'vesh-bhusha'      and c.code in ('junior','middle'))
    or (t.slug = 'sloka-recitation' and c.code in ('junior','middle','senior'))
    or (t.slug = 'devotional-music' and c.code in ('junior','middle','senior'))
    or (t.slug = 'nritya'           and c.code in ('junior','middle','senior'))
    or (t.slug = 'natak'            and c.code in ('middle','senior'))
    or (t.slug = 'gyan-yagna'       and c.code in ('middle','senior'))
    or (t.slug = 'vaktritva'        and c.code in ('middle','senior'))
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- SLOKAS — grouped by age band, capped so we hear variety
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, c.id, v.title, v.subtitle, v.cap, v.ord
  from tracks t
  cross join (values
    -- Junior: short, familiar prayers
    ('junior', 'Hare Krishna Maha-mantra',       'The great chant for deliverance',        5, 1),
    ('junior', 'Sri Krishna Pranama',            'he krishna karuna-sindho',               3, 2),
    ('junior', 'Panca-tattva Maha-mantra',       'jaya sri-krishna-caitanya',              3, 3),
    ('junior', 'Guru Vandana',                   'om ajnana-timirandhasya',                3, 4),
    ('junior', 'Sri Nrsimha Pranama',            'namas te narasimhaya',                   3, 5),
    ('junior', 'Tulasi Pranama',                 'vrindayai tulasi-devyai',                3, 6),
    ('junior', 'Sri Vaisnava Pranama',           'vanchha-kalpatarubhyas ca',              3, 7),
    ('junior', 'Prasada Prayer',                 'maha-prasade govinde',                   3, 8),
    -- Middle: core Bhagavad-gita verses
    ('middle', 'Bhagavad-gita 2.13',             'dehino ''smin yatha dehe',               3, 1),
    ('middle', 'Bhagavad-gita 2.47',             'karmany evadhikaras te',                 3, 2),
    ('middle', 'Bhagavad-gita 4.7',              'yada yada hi dharmasya',                 3, 3),
    ('middle', 'Bhagavad-gita 4.8',              'paritranaya sadhunam',                   3, 4),
    ('middle', 'Bhagavad-gita 7.7',              'mattah parataram nanyat',                3, 5),
    ('middle', 'Bhagavad-gita 9.22',             'ananyas cintayanto mam',                 3, 6),
    ('middle', 'Bhagavad-gita 15.1',             'urdhva-mulam adhah-sakham',              3, 7),
    ('middle', 'Sri Isopanisad, Mantra 1',       'isavasyam idam sarvam',                  3, 8),
    ('middle', 'Sri Gurvastakam, Verse 1',       'samsara-davanala-lidha-loka',            3, 9),
    -- Senior: longer and more demanding
    ('senior', 'Bhagavad-gita 2.20',             'na jayate mriyate va kadacin',           3, 1),
    ('senior', 'Bhagavad-gita 6.19',             'yatha dipo nivata-stho',                 3, 2),
    ('senior', 'Bhagavad-gita 12.13-14',         'advesta sarva-bhutanam',                 3, 3),
    ('senior', 'Bhagavad-gita 18.65',            'man-mana bhava mad-bhakto',              3, 4),
    ('senior', 'Bhagavad-gita 18.66',            'sarva-dharman parityajya',               3, 5),
    ('senior', 'Sri Isopanisad, Invocation',     'om purnam adah purnam idam',             3, 6),
    ('senior', 'Brahma-samhita 5.29',            'cintamani-prakara-sadmasu',              3, 7),
    ('senior', 'Brahma-samhita 5.1',             'isvarah paramah krishnah',               3, 8),
    ('senior', 'Gajendra Stuti (SB 8.3.1)',      'om namo bhagavate tasmai',               3, 9),
    ('senior', 'Srimad-Bhagavatam 1.2.6',        'sa vai pumsam paro dharmo',              3, 10)
  ) as v(band, title, subtitle, cap, ord)
  join categories c on c.code = v.band
 where t.slug = 'sloka-recitation'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- BHAJANS — open to every age band, 3 singers each
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, null, v.title, v.subtitle, v.cap, v.ord
  from tracks t
  join (values
    ('Hare Krishna Kirtan',            'The maha-mantra, any tune',                  5, 1),
    ('Jaya Radha Madhava',             'Bhaktivinoda Thakura',                       3, 2),
    ('Govinda Jaya Jaya',              'Traditional',                                3, 3),
    ('Sri Krishna Caitanya',           'Panca-tattva kirtan',                        3, 4),
    ('Damodarastakam',                 'namamisvaram sac-cid-ananda-rupam',          3, 5),
    ('Madhurastakam',                  'adharam madhuram — Vallabhacharya',          3, 6),
    ('Achyutam Keshavam',              'Traditional bhajan',                         3, 7),
    ('Yashomati Nandana',              'Bhaktivinoda Thakura',                       3, 8),
    ('Nandalala / Nanda Kumar',        'Traditional',                                3, 9),
    ('Vaishnava Jana To',              'Narsinh Mehta',                              3, 10),
    ('Gopinath',                       'Bhaktivinoda Thakura',                       3, 11),
    ('Hari Haraye Namah Krishna',      'Traditional kirtan',                         3, 12),
    ('Shri Krishna Govind Hare Murari','Traditional',                                3, 13),
    ('Jai Jagadish Hare',              'Aarti',                                      3, 14),
    ('Radhe Radhe Govind',             'Traditional',                                3, 15),
    ('Bhaja Govindam',                 'Adi Shankaracharya',                         3, 16),
    ('Payoji Maine Ram Ratan Dhan',    'Meerabai',                                   3, 17),
    ('Sri Gurvastakam',                'samsara-davanala — Visvanatha Cakravarti',   3, 18),
    ('Jaya Jaya Devaki Nandana',       'Traditional',                                3, 19),
    ('Bhajahu Re Mana',                'Govinda Dasa Kaviraja',                      3, 20)
  ) as v(title, subtitle, cap, ord) on true
 where t.slug = 'devotional-music'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- FANCY DRESS CHARACTERS — 2 students each
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, null, v.title, v.subtitle, 2, v.ord
  from tracks t
  join (values
    ('Bala Krishna',            'The butter thief of Vrindavan',            1),
    ('Srimati Radharani',       'The queen of Vrindavan',                   2),
    ('Lord Balarama',           'Krishna''s elder brother',                 3),
    ('Mother Yashoda',          'The mother of Vrindavan',                  4),
    ('Nanda Maharaja',          'King of Vraja',                            5),
    ('Prahlada Maharaja',       'The boy who never stopped chanting',       6),
    ('Dhruva Maharaja',         'The prince who sought the Lord',           7),
    ('Hanuman',                 'The perfect servant',                      8),
    ('Lord Rama',               'Maryada Purushottama',                     9),
    ('Sita Devi',               'Daughter of the earth',                   10),
    ('Arjuna',                  'The student of the Gita',                 11),
    ('Narada Muni',             'The travelling sage with the vina',       12),
    ('Chaitanya Mahaprabhu',    'The golden avatar',                       13),
    ('Meerabai',                'The singing princess of Mewar',           14),
    ('Sudama',                  'The friend with a handful of rice',       15),
    ('Draupadi',                'The one who called out to Krishna',       16),
    ('Bhishma Pitamaha',        'The grandsire of the Kurus',              17),
    ('Vamanadeva',              'The brahmana boy who took three steps',   18),
    ('A Gopa of Vrindavan',     'One of Krishna''s cowherd friends',       19),
    ('A Gopi of Vrindavan',     'One of Krishna''s cowherd friends',       20)
  ) as v(title, subtitle, ord) on true
 where t.slug = 'vesh-bhusha'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- DANCE COMPOSITIONS — 3 dancers each
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, null, v.title, v.subtitle, 3, v.ord
  from tracks t
  join (values
    ('Ganesh Vandana',              'Invocation',                           1),
    ('Krishna Nee Begane Baaro',    'Vyasaraja Tirtha',                     2),
    ('Dashavatara Stotram',         'Jayadeva''s Gita Govinda',             3),
    ('Kaliya Mardan',               'Krishna subdues the serpent',          4),
    ('Govardhan Lila',              'Lifting the hill',                     5),
    ('Maiya Mori Main Nahin',       'Surdas',                               6),
    ('Madhurashtakam',             'adharam madhuram',                      7),
    ('Yashomati Nandana',           'Bhaktivinoda Thakura',                 8),
    ('Raas Lila',                   'The dance of Vrindavan',               9),
    ('Achyutam Keshavam',           'Devotional',                          10)
  ) as v(title, subtitle, ord) on true
 where t.slug = 'nritya'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- SKIT EPISODES — 2 teams each
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, null, v.title, v.subtitle, 2, v.ord
  from tracks t
  join (values
    ('Prahlada and Narasimhadeva',      'Devotion that fire could not burn',      1),
    ('Dhruva Maharaja',                 'A five-year-old''s determination',       2),
    ('Krishna and Kaliya',              'The serpent in the Yamuna',              3),
    ('Govardhan Lila',                  'The hill on a little finger',            4),
    ('Krishna and Sudama',              'Friendship beyond wealth',               5),
    ('Bhakta Ambarisha',                'The king and Durvasa Muni',              6),
    ('Gajendra Moksha',                 'The elephant''s last prayer',            7),
    ('Jagai and Madhai',                'Mercy of Nityananda Prabhu',             8),
    ('The Story of Ekalavya',           'The greatest guru-dakshina',             9),
    ('Markandeya Rishi',                'A glimpse of the cosmic ocean',         10)
  ) as v(title, subtitle, ord) on true
 where t.slug = 'natak'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- ELOCUTION TOPICS — 4 speakers each
-- ---------------------------------------------------------------------------
insert into selection_items (track_id, category_id, title, subtitle, max_slots, sort_order)
select t.id, null, v.title, null, 4, v.ord
  from tracks t
  join (values
    ('What the Bhagavad-gita teaches a student',       1),
    ('Lessons from Krishna''s childhood',              2),
    ('Why our heritage still matters today',           3),
    ('Simple living, high thinking',                   4),
    ('The guru-shishya tradition',                     5),
    ('Ahimsa in everyday life',                        6),
    ('Seva: the quiet joy of serving',                 7),
    ('What Janmashtami means to me',                   8),
    ('Courage: what Prahlada taught the world',        9),
    ('Assam''s Vaishnava heritage: Sankardeva''s gift',10)
  ) as v(title, ord) on true
 where t.slug = 'vaktritva'
   and not exists (
     select 1 from selection_items si
      where si.track_id = t.id and si.title = v.title
   );

-- ---------------------------------------------------------------------------
-- Gallery — placeholder tiles so the page looks alive before you upload.
-- The app renders `placeholder:<key>` as a generated motif tile. Replace
-- image_url with a real Supabase Storage URL to show an actual photograph.
-- ---------------------------------------------------------------------------
insert into gallery_items (year, title, caption, image_url, is_featured, sort_order)
select v.year, v.title, v.caption, v.url, v.featured, v.ord
  from (values
    (2025, 'The finals at ISKCON Ulubari', 'Over 400 students filled the temple hall on Janmashtami eve.', 'placeholder:temple-1',   true,  1),
    (2025, 'Chitrakala in progress',       'Ninety minutes, one theme, three hundred imaginations.',        'placeholder:art-1',      true,  2),
    (2025, 'Bhajan sandhya',               'A Class 6 student opening the evening with Jaya Radha Madhava.','placeholder:music-1',    true,  3),
    (2025, 'Little Krishnas',              'The fancy dress round is always the loudest.',                  'placeholder:costume-1',  false, 4),
    (2024, 'Natak on the main stage',      'Prahlada and Narasimhadeva, performed by Class 8.',             'placeholder:drama-1',    true,  5),
    (2024, 'Sloka recitation',             'Verses from the Gita, recited from memory.',                    'placeholder:scroll-1',   false, 6),
    (2024, 'Prize distribution',           'Certificates and prasadam for every participant.',              'placeholder:award-1',    false, 7),
    (2024, 'Nritya',                       'Bharatanatyam, Sattriya and Odissi shared one stage.',          'placeholder:dance-1',    false, 8),
    (2023, 'The first Utkarsh',            'Where it began — eleven schools, one afternoon.',               'placeholder:temple-2',   false, 9)
  ) as v(year, title, caption, url, featured, ord)
 where not exists (
   select 1 from gallery_items g where g.image_url = v.url
 );

-- ---------------------------------------------------------------------------
-- Testimonials — SAMPLE COPY, deliberately left UNPUBLISHED.
-- These are illustrative placeholders, not real student quotes. Replace the
-- text with genuine quotes (with permission) and publish them from the admin
-- portal. Until then the site shows an invitation to share a memory instead.
-- ---------------------------------------------------------------------------
insert into testimonials (student_name, school_name, year, track_name, quote, is_published, sort_order)
select v.name, v.school, v.year, v.track, v.quote, false, v.ord
  from (values
    ('[Sample — replace]', '[School name]', 2025, 'Devotional Music',
     'Write a real student quote here about what singing on the temple stage felt like.', 1),
    ('[Sample — replace]', '[School name]', 2025, 'Art & Painting',
     'Write a real student quote here about the art round.', 2),
    ('[Sample — replace]', '[School name]', 2024, 'Skit & Drama',
     'Write a real quote here from a student who performed in the drama finals.', 3),
    ('[Sample — replace]', '[School name]', 2024, 'Sloka Recitation',
     'Write a real quote here from a student who recited at the finals.', 4)
  ) as v(name, school, year, track, quote, ord)
 where not exists (select 1 from testimonials);

-- ---------------------------------------------------------------------------
-- Settings — REVIEW THESE DATES before opening registration.
-- ---------------------------------------------------------------------------
insert into settings (key, value, is_public) values
  (
    'registration',
    jsonb_build_object(
      'open', true,
      'max_tracks_per_student', 3,
      'closes_at', '2026-08-25'
    ),
    true
  ),
  (
    'event',
    jsonb_build_object(
      'edition', '2026',
      'stage1_label', 'School Round',
      'stage1_window', 'Mid-August 2026, at your own school',
      'stage2_label', 'Grand Finale',
      'stage2_date', '2026-09-03',
      'stage2_note', 'On the eve of Sri Krishna Janmashtami — please confirm against this year''s panjika.',
      'venue', 'ISKCON Ulubari, Guwahati',
      'venue_map_url', 'https://maps.google.com/?q=ISKCON+Ulubari+Guwahati',
      'city', 'Guwahati, Assam'
    ),
    true
  ),
  (
    'contact',
    jsonb_build_object(
      'email', 'utkarsh@iskconguwahati.org',
      'phone', '+91 98640 00000',
      'whatsapp', '+91 98640 00000',
      'instagram', 'https://instagram.com/'
    ),
    true
  )
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Keep counters honest after seeding
-- ---------------------------------------------------------------------------
select recount_selection_slots();
