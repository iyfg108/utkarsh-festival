# Utkarsh Heritage Festival

The public website and organiser portal for **Utkarsh**, the annual heritage
festival for school students in Guwahati, held on the eve of Sri Krishna
Janmashtami at ISKCON Ulubari.

Students explore the competitions, register themselves, and check their status.
Organisers run the whole festival — registrations, Stage 1 judging, shortlisting
for the finals, and the song/sloka catalogue — from `/admin`.

---

## How the festival works

The site is built around the two-stage structure:

| Stage | Where | What happens |
|---|---|---|
| **1 — School Round** | Inside each student's own school | Every registered student competes. Organisers score entries and shortlist the best from each school. |
| **2 — Grand Finale** | ISKCON Ulubari, Guwahati | Shortlisted students perform on the temple stage on Janmashtami eve. |

Shortlisting a student in the admin portal moves them to the `finals` stage,
which is immediately what they see on the public **Check status** page.

---

## Tech stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** (CSS-first `@theme` tokens, no `tailwind.config.js`)
- **Supabase** — Postgres, Auth, and Row Level Security
- **Motion** (Framer Motion) for animation, **canvas-confetti** (lazy-loaded)

No state-management or data-fetching library: the catalogue is loaded once into
a React context, and live numbers are fetched where they matter.

---

## Getting started

```bash
npm install
cp .env.example .env     # then fill in your Supabase URL + anon key
npm run dev
```

If the env vars are missing the app renders a setup screen with instructions
instead of a blank page.

### Supabase setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the **SQL editor**, run the files in this order:
   - `supabase/schema.sql` — tables, views, functions, RLS policies
   - `supabase/seed.sql` — 8 competitions, 97 songs/slokas/characters, 12 schools, settings
3. Copy the **Project URL** and **anon key** from *Project Settings → API* into `.env`:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

Both values are safe in the browser — the anon key is only as powerful as the
RLS policies allow, and those give it read access to the catalogue and nothing else.

`supabase/patches.sql` applies one-off fixes to a database that has **already**
been seeded (contact details, track name spellings). `seed.sql` is safe to
re-run at any time; it never overwrites settings you have edited in the admin portal.

### Creating the first organiser account

1. **Authentication → Users → Add user.** Enter an email and password, and tick
   *Auto Confirm User*. Copy the new user's UUID.
2. In the SQL editor:

   ```sql
   insert into admin_users (id, full_name, email, role)
   values ('paste-the-uuid', 'Your Name', 'you@example.com', 'super_admin');
   ```

3. Sign in at `/admin`. From there you can add the rest of the team through
   **Organisers**, which walks you through the same two steps.

---

## The slot limits, and why they actually hold

The brief asked that no more than N students may pick the same devotional song
or sloka. This is enforced **in the database**, not in the form.

Each row in `selection_items` carries `max_slots` and a `taken_count` maintained
by a trigger on `registration_tracks`, plus a constraint:

```sql
constraint selection_items_not_oversubscribed
  check (taken_count >= 0 and taken_count <= max_slots)
```

When two students submit for the last slot at the same instant, both trigger an
`UPDATE` on the same row. Postgres takes a row lock, so the second transaction
blocks until the first commits, then re-reads the committed count and fails the
constraint. The second student gets a clear message asking them to choose again.

This was verified against a real Postgres instance with two concurrent
transactions racing for one slot: the loser blocked for exactly the duration the
winner held its transaction open, then failed — and the final state was
`taken_count = 2, max_slots = 2` with two actual rows. Never oversubscribed.

The availability shown in the UI is a courtesy. The constraint is the guarantee.

### Caps as seeded

| Competition | Selection | Cap per option |
|---|---|---|
| Devotional Music | Song | 3 (Hare Krishna Kirtan: 5) |
| Sloka Recitation | Sloka | 3 (Maha-mantra: 5) |
| Classical Dance | Composition | 3 |
| Elocution | Topic | 4 |
| Fancy Dress | Character | 2 |
| Skit & Drama | Episode | 2 (teams) |

All editable from **Admin → Songs & slokas**. Lowering a cap below the number
already taken is refused by the database.

---

## Security model

The public site talks to Postgres as the `anon` role. RLS is enabled on every table.

- **Readable by anyone:** tracks, categories, schools, gallery, published
  testimonials, public settings, and `selection_availability` (titles and
  counts, no personal data).
- **Not readable by anyone public:** `registrations`, `registration_tracks`,
  `team_members`, `admin_users`, `audit_log`. There is no anon read policy at all.
- **Writes** happen only through two `SECURITY DEFINER` functions:
  - `submit_registration(jsonb)` — validates the registration window, class/age
    band, track eligibility, team sizes and slot availability server-side.
  - `lookup_registration(code, phone)` — requires *both* the code and the
    matching guardian phone, so it cannot be used to enumerate participants.

Admin access is role-based:

| Role | Can do |
|---|---|
| `super_admin` | Everything, including settings, catalogue and organiser accounts |
| `school_coordinator` | Only their own school's registrations (enforced by RLS, not just the UI) |
| `judge` | See all registrations and enter scores; no catalogue or settings access |

---

## Project layout

```
src/
  components/
    Decor.tsx          peacock feather, rangoli, diya, garland, star field
    Icons.tsx          all icons, inline SVG
    site/              nav, footer, track card, countdown, slot meter
    ui/                Button, Form controls, Card/Modal/Badge primitives
  context/             Auth, Festival catalogue, Toasts
  hooks/               useAsync, useCountdown, useReveal, useMediaQuery
  lib/
    queries.ts         every database call
    supabase.ts        client + friendly error messages
    types.ts           mirrors the schema
    utils.ts           accent palette, formatting, CSV export
  pages/               public pages
  pages/admin/         organiser portal (its own lazy-loaded bundle)
supabase/
  schema.sql           tables, RLS, triggers, functions
  seed.sql             competitions, songs, slokas, schools, settings
  patches.sql          one-off fixes for an already-seeded database
```

---

## Commands

```bash
npm run dev        # dev server
npm run build      # typecheck + production build
npm run typecheck  # types only
npm run lint       # oxlint
npm run preview    # serve the production build
```

---

## Deploying

The app is a static SPA. On Vercel, import the repo and set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables —
`vercel.json` already rewrites all routes to `index.html` so deep links work.
Any static host works the same way.

---

## Before you go live

- [ ] **Check the finale date.** Janmashtami moves with the lunar calendar. The
      seed guesses **3 September 2026**; confirm against this year's panjika and
      set it in *Admin → Settings → The event*. It drives the countdown.
- [ ] **Replace the school list.** The 12 seeded schools are examples. Edit them
      in *Admin → Schools*. Students who pick "my school is not listed" surface
      there as one-click additions.
- [ ] **Replace the sample testimonials.** They ship **unpublished** and are
      clearly marked `[Sample — replace]`. They are placeholders, not real
      quotes — write real ones (with the student's permission) before publishing.
      Until then the home page shows an invitation to share a memory instead.
- [ ] **Upload real gallery photos.** The gallery ships with generated
      `placeholder:` tiles so the page looks intentional while empty. Upload to
      Supabase Storage and paste the public URL in *Admin → Gallery & quotes*.
- [ ] **Review the competition rules and time limits** in *Admin → Songs & slokas*
      and the seed file — they are sensible defaults, not your actual rules.
- [ ] **Open registration** in *Admin → Settings* when you are ready.

### A note on contact details

Contact details live in the `settings` table so you can change them from the
admin portal without a rebuild — **not** in `.env`. Any `VITE_CONTACT_*` lines
in your `.env` are unused and can be deleted. Set them in
*Admin → Settings → Contact details*, or run `supabase/patches.sql`.

---

## Known notes

- `npm audit` flags a **react-router** advisory about RSC-mode CSRF. This app is
  a client-rendered SPA and never enters RSC mode, so it does not apply. The only
  "fix" npm offers is a downgrade to 7.11.0; we stay on 7.18.2 deliberately.
- Sanskrit names are written in plain transliteration (`Chitrakala`, not
  `Chitrakalā`). The display font has no glyph for the combining diacritics and
  they rendered as visible artefacts, particularly on Android.
- Every animation respects `prefers-reduced-motion`.
