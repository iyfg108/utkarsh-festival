# Open decisions

Two things we deliberately parked. Neither blocks going live. Both are written
up here so the decision is quick when you come back to it.

---

## 1. Suggestion lists for Art and Fancy Dress

**Where this came from.** Devotional Bhajan has a fixed song list with a cap of
3 singers per song, so the evening stays varied. For Art and Fancy Dress you
wanted to *suggest* ideas without forcing a choice — and asked whether that
means we need a student profile area.

**What exists today.** The machinery is already built and generic. A
competition row has `requires_selection`, `selection_label` and
`selection_help`, and `selection_items` holds the options with a `max_slots`
cap enforced by the database. Turning it on for Fancy Dress is a settings
change plus a list of characters — no new code. So the question is not "can
we", it is "what should the student experience be".

### Option A — Suggestions only, no booking *(lightest)*

Show a browsable list of ideas on the competition page: painting themes for
Art, characters for Fancy Dress. Students read it, pick their own, and nothing
is reserved.

- Nothing to build beyond a content block; could ship in an hour.
- No student profile needed.
- Risk: eleven Krishnas in the Fancy Dress line-up.

### Option B — Reuse the capped picker *(recommended if variety matters)*

Turn `requires_selection` on for Fancy Dress with a cap of 2 per character,
exactly like the bhajan list. Same UI, same race-safe guarantee.

- Zero new code. Set the flag, add the character rows.
- Solves the eleven-Krishnas problem outright.
- Cost: it becomes a *required* choice at registration, which is more friction
  for a Class 2 student who has not decided yet.
- Middle path worth considering: allow an "I'll decide later / something else"
  option in the list with no cap, so the picker guides without forcing.

### Option C — Student profile area *(most work)*

A logged-in area where a student returns after registering to browse
suggestions, set or change their choice, upload a reference image, and see
their schedule.

- Genuinely nicer, and it is the natural home for a lot of the WhatsApp/email
  traffic in item 2 below.
- But it needs student authentication, which we deliberately avoided: right now
  a student needs no account at all, and the status page is protected by
  registration code + guardian phone. Adding accounts means password resets for
  ten-year-olds, and a support burden on the day.
- If we do want this, the cheap version is a **magic-link-free** approach:
  extend the existing `/status` lookup (code + phone) into an editable page.
  No passwords, no new accounts, and it reuses a flow students already have.

**Recommendation.** Option B for Fancy Dress (variety is the real problem it
solves, and it costs nothing), Option A for Art (the theme is announced on the
spot anyway, so a cap makes no sense). Revisit Option C only if you find
yourself fielding a lot of "can I change my choice" messages — and if so, build
it as an editable `/status` page rather than as real student accounts.

---

> **Partly addressed since this was written.** The admin portal now has an
> in-app activity bell (new registrations, reported UPI payments, completed
> payments) plus optional desktop notifications. That covers organisers who
> have the portal open. It does *not* cover reaching students, or reaching an
> organiser who is asleep — which is what the rest of this section is about.

## 2. Reminders over WhatsApp and email

**What we need.** Realistically four moments:

1. Registration confirmation with the code.
2. The day before the online round (23 Aug) — with the quiz link.
3. The day before the temple round (30 Aug) — what to bring, what time.
4. After the event — the digital certificate for anyone who did not collect it.

Every registration already carries an email address or a WhatsApp number (the
database enforces at least one), so the contact data is there and clean.

### Email

Straightforward. A Supabase Edge Function plus a transactional provider —
Resend and Brevo both have workable free tiers at our volume. Templates live in
the function; trigger either from the admin portal ("send reminder to everyone
in the 30 Aug list") or on a schedule with `pg_cron`.

Worth doing: it also covers moment 4, which is the one that otherwise means
someone manually mailing a few hundred certificates.

### WhatsApp

Two honestly different paths:

- **WhatsApp Cloud API (official).** Needs a Meta Business account, a verified
  business, and message templates approved in advance. Free within the service
  window, paid per conversation outside it. This is the right answer for
  sending a few hundred reminders — but the approval takes days, so it cannot
  be a last-minute decision before 23 August.
- **A `wa.me` click-to-send helper (no approval, no cost).** The admin portal
  generates a pre-filled WhatsApp link per student; a volunteer taps through
  them. Ugly and manual, but it works this week, and for a few hundred students
  it is genuinely viable with two people and an hour.

**Recommendation.** Email first — it is a day of work and covers certificates,
which is the biggest manual burden. For WhatsApp this year, add the `wa.me`
helper to the admin portal (an afternoon). Start the Cloud API application now
if you want proper WhatsApp for next year, because the verification wait is the
long pole, not the code.

---

## Smaller things noticed along the way

- **The gallery is switched off, and the site ships no images at all.** There
  were no real photographs for 2026 and the generated placeholder tiles read as
  a broken page, so the gallery page, its nav and footer links, the home-page
  section and the admin screen are all gone; `/gallery` redirects home. The four
  Krishna paintings went with them, which is why `index.html` no longer sets an
  `og:image` and the link preview is a `summary` card rather than
  `summary_large_image`.

  Nothing was migrated away: `gallery_items` and its policies are still in
  `schema.sql` (the six placeholder rows are still in the live database, now
  inert), the painting masters are still tracked in `art-src/`, and the deleted
  components are in git. Bringing either back for 2027 is a revert of the commit
  that removed them, not a schema change.

  To take real photographs live you would also need `scripts/optimise-art.sh`
  back, or a public Supabase Storage bucket if the photos are uploaded rather
  than committed.
- **`.env.example` currently holds the real project URL and anon key.** Both are
  safe to publish (the anon key is protected by row-level security), but the
  file is git-tracked — so never put the **service role** key there. It belongs
  only in Supabase's own secrets, where the payment functions read it.
- **Razorpay refunds are not wired up.** Deleting a paid registration in the
  admin portal does not refund anything; do that in the Razorpay dashboard. The
  delete confirmation says so.
- **No automated tests yet.** The database rules are covered by hand-run SQL
  checks (including a real two-transaction race on the song caps), but there is
  no test suite in CI.
