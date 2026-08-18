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
-- Stop early, and say why, if schema.sql has not been run.
--
-- Without this the first statement that touches a new column fails with
-- 'column "syllabus" of relation "tracks" does not exist', which says nothing
-- about the actual problem and leaves the seed half applied.
-- ---------------------------------------------------------------------------
do $$
declare missing text;
begin
  select string_agg(c, ', ') into missing
    from (values ('syllabus'), ('start_time'), ('end_time'),
                 ('registration_closes_at'), ('reporting_time')) as v(c)
   where not exists (
     select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tracks' and column_name = v.c
   );

  if missing is not null then
    raise exception
      'Run schema.sql first. This database is missing: tracks.%. seed.sql only fills data — schema.sql creates the columns.',
      missing;
  end if;

  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'selection_items'
       and column_name = 'requires_detail'
  ) then
    raise exception 'Run schema.sql first. This database is missing selection_items.requires_detail.';
  end if;
end $$;

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
      'Report at 8 am — one hour before the 9 am start.',
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'The quiz is answered on a device, but you attempt it at the temple — that way nobody has an unfair advantage at home.',
      'You sit with your group, and each group gets its own set of questions: Group A is Class 1–4, Group B is Class 5–7, Group C is Class 8–10.',
      'Individual participation. No phones, notes or help from others.',
      'You will be seated with your group when you report.'
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
      'Report at 8 am — one hour before the 9 am start.',
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'Recite from memory — no reading from a book or phone.',
      'Any verses from the Bhagavad-gita are allowed. The list on this page is only a suggestion.',
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
    'A written essay on a devotional theme, handwritten at the temple. On the day you are given two topics for your class and you choose one. The list on this page shows the kind of thing to expect — close to what you will get, though not word for word. Judged on thought, clarity and honesty rather than long words.',
    'scroll', 'indigo',
    array[
      'Report at 8 am — one hour before the 9 am start.',
      'Held at ISKCON Ulubari on 23 August, 9 am to 11 am.',
      'On the day you are given two topics for your class — you choose one of them.',
      'The list on this page is a guide to what to expect, not the exact wording.',
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
      'Report at 8 am — one hour before the 9 am start.',
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
      'Report at 8 am — one hour before the 9 am start.',
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
      'Report at 3 pm — one hour before the 4 pm start.',
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
    'At most 3 students may sing the same song, so the evening stays varied. Songs already taken are marked — pick another and you will stand out more anyway. Prefer a Borgeet, or something not on the list? Choose it at the bottom and tell us which piece you will sing.',
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
-- What each competition asks a student to prepare.
--
-- Essay topics and Gita verses, grouped by class band and rendered on the
-- competition page. Held as JSON on the track rather than in the code so a
-- topic can be reworded with one UPDATE and no redeploy.
--
-- Note the class bands here are 1-2 / 3-4 / 5-7 / 8-10, which is finer than
-- the festival's A/B/C groups (1-4, 5-7, 8-10) used for the quiz and the day
-- sheet. They are labelled by class rather than by letter on purpose, so a
-- Class 3 student is never told they are in two different groups at once.
--
-- Vedabase paths were each checked against the live site. Two are not what you
-- would guess: 10.12 alone is a 404 (the page is 10.12-13), and 2.62-63 has no
-- combined page (they are two separate verses).
-- ---------------------------------------------------------------------------

update tracks set syllabus = $syllabus${
  "kind": "topics",
  "heading": "Essay topics",
  "intro": "These are a guide to the kind of thing you will be asked — not a fixed list. On the day you are given two topics for your class and you choose one to write on. The wording may differ a little from what is here, so read these and think about them, but there is nothing to memorise.",
  "groups": [
    {
      "label": "Class 1 to 2",
      "note": "About 5 lines",
      "items": [
        {
          "text": "Little Krishna and Yashoda Maiya"
        },
        {
          "text": "How I celebrate Janmashtami"
        },
        {
          "text": "A story my grandmother told me"
        }
      ]
    },
    {
      "label": "Class 3 to 4",
      "note": "A short paragraph",
      "items": [
        {
          "text": "My favourite story about Lord Krishna"
        },
        {
          "text": "My favourite person in the Ramayana, and why"
        },
        {
          "text": "Why should we listen to our parents"
        },
        {
          "text": "Helping others"
        },
        {
          "text": "Lord Hanuman"
        },
        {
          "text": "Respecting our elders"
        }
      ]
    },
    {
      "label": "Class 5 to 7",
      "note": "About one page",
      "items": [
        {
          "text": "Krishna and his friends"
        },
        {
          "text": "The story of Dhruva"
        },
        {
          "text": "What makes a true friend — Krishna and Sudama"
        },
        {
          "text": "What our festivals teach us"
        },
        {
          "text": "The lesson I learnt from the story of Prahlada"
        },
        {
          "text": "Why we should listen to our parents"
        }
      ]
    },
    {
      "label": "Class 8 to 10",
      "note": "One to two pages",
      "items": [
        {
          "text": "Why spirituality is important in today's world"
        },
        {
          "text": "Lessons I learnt from the Ramayana"
        },
        {
          "text": "Being honest, and how I follow it in my life"
        },
        {
          "text": "Why our festivals matter"
        },
        {
          "text": "Is devotion the same thing as religion? Write what you actually think."
        },
        {
          "text": "Is it always easy to tell the truth? Write about a time when it was hard."
        },
        {
          "text": "What the Bhagavad-gita teaches me"
        },
        {
          "text": "How can I inculcate divine qualities within me?"
        },
        {
          "text": "How does social media affect our inner space and peace?"
        }
      ]
    }
  ]
}$syllabus$::jsonb
 where slug = 'devotional-essay';

update tracks set syllabus = $syllabus${
  "kind": "verses",
  "heading": "Verses to learn",
  "intro": "These are suggestions, not a fixed list — you may recite any verses from the Bhagavad-gita you already know. We have chosen these because the sounds suit each age. Find your class below for how many verses to learn, and tap any verse to read it on Vedabase with the Devanagari, word meanings and full translation.",
  "groups": [
    {
      "label": "Class 1 to 2",
      "note": "Learn any ONE verse",
      "items": [
        {
          "ref": "BG 18.65",
          "path": "18/65",
          "text": "man-mana bhava mad-bhakto\nmad-yaji mam namaskuru\nmam evaisyasi satyam te\npratijane priyo 'si me",
          "gist": "Think of Me, worship Me, bow to Me — and you will come to Me."
        },
        {
          "ref": "BG 9.26",
          "path": "9/26",
          "text": "patram puspam phalam toyam\nyo me bhaktya prayacchati\ntad aham bhakty-upahrtam\nasnami prayatatmanah",
          "gist": "A leaf, a flower, a fruit, water — offered with love, I accept it."
        },
        {
          "ref": "BG 9.27",
          "path": "9/27",
          "text": "yat karosi yad asnasi\nyaj juhosi dadasi yat\nyat tapasyasi kaunteya\ntat kurusva mad-arpanam",
          "gist": "Whatever you do, eat, offer or give — do it for Me."
        },
        {
          "ref": "BG 1.1",
          "path": "1/1",
          "text": "dhrtarastra uvaca\ndharma-ksetre kuru-ksetre\nsamaveta yuyutsavah\nmamakah pandavas caiva\nkim akurvata sanjaya",
          "gist": "The opening verse of the Gita — Dhritarashtra asks what happened on the field of Kurukshetra.",
          "note": "The 'dhrtarastra uvaca' line may be left out by the youngest reciters."
        },
        {
          "ref": "BG 10.12-13",
          "path": "10/12-13",
          "text": "param brahma param dhama\npavitram paramam bhavan\npurusam sasvatam divyam\nadi-devam ajam vibhum",
          "gist": "Arjuna addresses Krishna as the supreme truth, the supreme abode, the purest, eternal and unborn.",
          "note": "Vedabase shows this as the combined verse 10.12-13, so the page is longer than the lines above."
        }
      ]
    },
    {
      "label": "Class 3 to 4",
      "note": "Learn any TWO verses",
      "items": [
        {
          "ref": "BG 4.7",
          "path": "4/7",
          "text": "yada yada hi dharmasya\nglanir bhavati bharata\nabhyutthanam adharmasya\ntadatmanam srjamy aham",
          "gist": "Whenever dharma declines and adharma rises, I appear.",
          "note": "Best learnt together with 4.8 — the two are one thought."
        },
        {
          "ref": "BG 4.8",
          "path": "4/8",
          "text": "paritranaya sadhunam\nvinasaya ca duskrtam\ndharma-samsthapanarthaya\nsambhavami yuge yuge",
          "gist": "To protect the good and re-establish dharma, I appear in every age."
        },
        {
          "ref": "BG 5.29",
          "path": "5/29",
          "text": "bhoktaram yajna-tapasam\nsarva-loka-mahesvaram\nsuhrdam sarva-bhutanam\njnatva mam santim rcchati",
          "gist": "Knowing Me as the friend of every living being, one attains peace.",
          "note": "Many students already know this one — it is chanted before meals."
        },
        {
          "ref": "BG 18.66",
          "path": "18/66",
          "text": "sarva-dharman parityajya\nmam ekam saranam vraja\naham tvam sarva-papebhyo\nmoksayisyami ma sucah",
          "gist": "Give up all else and simply surrender to Me. Do not fear."
        },
        {
          "ref": "BG 2.47",
          "path": "2/47",
          "text": "karmany evadhikaras te\nma phalesu kadacana\nma karma-phala-hetur bhur\nma te sango 'stv akarmani",
          "gist": "You have a right to your work, but never to its results."
        }
      ]
    },
    {
      "label": "Class 5 to 7",
      "note": "Learn any THREE verses",
      "items": [
        {
          "ref": "BG 2.13",
          "path": "2/13",
          "text": "dehino 'smin yatha dehe\nkaumaram yauvanam jara\ntatha dehantara-praptir\ndhiras tatra na muhyati",
          "gist": "As the body passes from childhood to youth to age, so the soul passes to another body. The wise are not confused by this."
        },
        {
          "ref": "BG 7.7",
          "path": "7/7",
          "text": "mattah parataram nanyat\nkincid asti dhananjaya\nmayi sarvam idam protam\nsutre mani-gana iva",
          "gist": "Everything rests upon Me, as pearls are strung on a thread."
        },
        {
          "ref": "BG 9.22",
          "path": "9/22",
          "text": "ananyas cintayanto mam\nye janah paryupasate\ntesam nityabhiyuktanam\nyoga-ksemam vahamy aham",
          "gist": "For those who worship Me with undivided attention, I carry what they lack and preserve what they have."
        },
        {
          "ref": "BG 3.21",
          "path": "3/21",
          "text": "yad yad acarati sresthas\ntat tad evetaro janah\nsa yat pramanam kurute\nlokas tad anuvartate",
          "gist": "Whatever a great person does, others follow."
        },
        {
          "ref": "BG 2.14",
          "path": "2/14",
          "text": "matra-sparsas tu kaunteya\nsitosna-sukha-duhkha-dah\nagamapayino 'nityas\ntams titiksasva bharata",
          "gist": "Happiness and distress come and go like winter and summer. Learn to tolerate them."
        },
        {
          "ref": "BG 2.27",
          "path": "2/27",
          "text": "jatasya hi dhruvo mrtyur\ndhruvam janma mrtasya ca\ntasmad apariharye 'rthe\nna tvam socitum arhasi",
          "gist": "For one who is born, death is certain. Do not grieve over what cannot be avoided."
        },
        {
          "ref": "BG 4.34",
          "path": "4/34",
          "text": "tad viddhi pranipatena\npariprasnena sevaya\nupadeksyanti te jnanam\njnaninas tattva-darsinah",
          "gist": "Approach a teacher humbly, ask questions, and render service."
        }
      ]
    },
    {
      "label": "Class 8 to 10",
      "note": "Learn any FOUR verses",
      "items": [
        {
          "ref": "BG 2.62",
          "path": "2/62",
          "text": "dhyayato visayan pumsah\nsangas tesupajayate\nsangat sanjayate kamah\nkamat krodho 'bhijayate",
          "gist": "Dwelling on the senses breeds attachment; attachment breeds desire; desire breeds anger.",
          "note": "Recite together with 2.63 as one chain. The two count as two verses."
        },
        {
          "ref": "BG 2.63",
          "path": "2/63",
          "text": "krodhad bhavati sammohah\nsammohat smrti-vibhramah\nsmrti-bhramsad buddhi-naso\nbuddhi-nasat pranasyati",
          "gist": "From anger comes delusion, then loss of memory, then loss of intelligence — and one falls."
        },
        {
          "ref": "BG 2.20",
          "path": "2/20",
          "text": "na jayate mriyate va kadacin\nnayam bhutva bhavita va na bhuyah\najo nityah sasvato 'yam purano\nna hanyate hanyamane sarire",
          "gist": "The soul is never born and never dies. It is not slain when the body is slain.",
          "note": "Longer metre than the others — this one tests breath and pacing."
        },
        {
          "ref": "BG 12.13-14",
          "path": "12/13-14",
          "text": "advesta sarva-bhutanam\nmaitrah karuna eva ca\nnirmamo nirahankarah\nsama-duhkha-sukhah ksami\n\nsantustah satatam yogi\nyatatma drdha-niscayah\nmayy arpita-mano-buddhir\nyo mad-bhaktah sa me priyah",
          "gist": "The qualities of a devotee — friendly to all, free of ego, equal in joy and sorrow, and very dear to Krishna.",
          "note": "Vedabase shows these as one combined verse. Counts as two."
        },
        {
          "ref": "BG 6.5",
          "path": "6/5",
          "text": "uddhared atmanatmanam\nnatmanam avasadayet\natmaiva hy atmano bandhur\natmaiva ripur atmanah",
          "gist": "Lift yourself by your own mind. The mind is your friend, and also your enemy."
        },
        {
          "ref": "BG 15.15",
          "path": "15/15",
          "text": "sarvasya caham hrdi sannivisto\nmattah smrtir jnanam apohanam ca\nvedais ca sarvair aham eva vedyo\nvedanta-krd veda-vid eva caham",
          "gist": "I am seated in everyone's heart; from Me come memory, knowledge and forgetfulness."
        },
        {
          "ref": "BG 16.1-3",
          "path": "16/1-3",
          "text": "abhayam sattva-samsuddhir\njnana-yoga-vyavasthitih\ndanam damas ca yajnas ca\nsvadhyayas tapa arjavam\n\n(continues through 16.3)",
          "gist": "The divine qualities — fearlessness, purity, charity, self-control, study, austerity and simplicity.",
          "note": "Three verses in one, so this nearly fills the requirement by itself."
        }
      ]
    }
  ]
}$syllabus$::jsonb
 where slug = 'gita-shloka';


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
-- Two choices that are a category rather than one song.
--
-- Borgeet is the Assamese devotional tradition of Sankardeva and Madhavdeva —
-- there are hundreds, so capping it at three would turn away singers for no
-- reason. "Something else" is open by definition. Both ask the student to
-- write which piece they will sing, so the running order and the judges know
-- what is coming, and so two students are not unknowingly preparing the same
-- song under the same label.
--
-- Neither is capped in any real sense. The number is 99 rather than null
-- because max_slots is `not null` and the oversubscription check — the thing
-- that actually protects the three-singers-per-song rule — needs a ceiling to
-- compare against. 99 is beyond reach: the bhajan slot is two hours, so even
-- at three minutes a singer the room runs out long before the number does.
-- ---------------------------------------------------------------------------
insert into selection_items
  (track_id, title, subtitle, max_slots, requires_detail, detail_label, sort_order)
select t.id, v.title, v.subtitle, v.cap, true, v.label, v.ord
  from tracks t
  cross join (values
    ('Borgeet',
     'Sankardeva / Madhavdeva — the Assamese tradition',
     99,
     'Which Borgeet will you sing?',
     30),
    ('Something else — I will sing my own choice',
     'Any bhajan or kirtan not on this list',
     99,
     'Which bhajan will you sing?',
     31)
  ) as v(title, subtitle, cap, label, ord)
 where t.slug = 'devotional-bhajan'
   and not exists (
     select 1 from selection_items si where si.track_id = t.id and si.title = v.title
   );

-- Re-runnable: keep the two in step if the wording above is edited later, and
-- lift the cap on any database seeded before Borgeet became uncapped.
update selection_items si
   set requires_detail = true,
       max_slots = greatest(si.max_slots, 99),
       detail_label = case
         when si.title = 'Borgeet' then 'Which Borgeet will you sing?'
         else 'Which bhajan will you sing?'
       end
  from tracks t
 where t.id = si.track_id
   and t.slug = 'devotional-bhajan'
   and si.title in ('Borgeet', 'Something else — I will sing my own choice');

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
