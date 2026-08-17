# Utkarsh Heritage Festival

The public website and organiser portal for **Utkarsh**, the annual heritage
festival for school students in Guwahati, run by ISKCON Guwahati, Ulubari.

Students browse the competitions, register, pay, and check their status.
Organisers run the whole event — registrations, payments, judging, prizes and
certificates — from `/admin`.

---

## How the festival works

Six competitions, open to **Class 1 to 10**, across two Sundays. Everything
happens at **ISKCON Guwahati, Ulubari** — including the quiz, which is answered
on a device but sat on site so that every student attempts it under the same
conditions, in groups by class (A: 1–4, B: 5–7, C: 8–10).

| Date | Time | Competitions | Entries close |
|---|---|---|---|
| **23 August** | 9–11 am | Vedic Quiz, Gita Shloka Recitation, Devotional Essay | 22 August |
| **30 August** | 9 am–12 noon | Vedic Art, Vedic Fancy Dress | 28 August |
| **30 August** | 4–6 pm | Devotional Bhajan | 28 August |

A student may enter as many as they like, at **₹99 per competition** — three
competitions is ₹297. There is no online payment: the fee is cash at the temple
on the day, and the total is computed server-side from the entries.

Everyone gets a certificate. Prizes and prasadam are given at the temple on
30 August; anyone who cannot collect their certificate in person receives a
digital copy on the guardian's WhatsApp number, which is required at
registration (email is optional).

---

## Tech stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 4** — CSS-first `@theme` tokens, no `tailwind.config.js`
- **Supabase** — Postgres, Auth, and Edge Functions (Deno) for payments
- **Direct UPI** — QR + deep link, verified by an organiser (no gateway)
- **Razorpay** (optional) — cards and net banking, via Supabase Edge Functions
- No animation library, no UI kit, no icon package — see *Weight* below

---

## Getting started

```bash
npm install
cp .env.example .env    # fill in your Supabase URL and anon key
npm run dev
```

If `.env` is missing or unfilled the app renders a setup screen explaining what
to do, rather than a blank page.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck, then production build |
| `npm run typecheck` | Types only |
| `npm run preview` | Serve the production build locally |

---

## Database setup

Run these in the Supabase **SQL editor**, in order:

| File | Purpose |
|---|---|
| `supabase/reset.sql` | Drops the old schema. **Deletes all registrations.** Backs up organiser logins first. |
| `supabase/schema.sql` | Tables, constraints, row-level security, functions. Restores organiser logins. |
| `supabase/seed.sql` | The six competitions, the bhajan song list, settings. |
| `supabase/patches.sql` | Updates settings on an *already seeded* database (seed.sql never overwrites them). |

`schema.sql` and `seed.sql` are safe to re-run. `reset.sql` is not — it is
destructive by design, and only needed when rebuilding from an older version.

Verify afterwards:

```sql
select name, event_date, start_time, end_time, registration_closes_at, requires_selection
  from tracks order by event_date, start_time, sort_order;
```

You should get six rows, all with times and cut-offs, and `requires_selection`
true only on Devotional Bhajan.

---

## Creating an organiser account

Two steps, because Supabase Auth proves *who you are* and `admin_users` decides
*what you may do*. A signed-in user with no `admin_users` row gets a polite
"not on the organiser list" screen, which is what keeps the portal shut if
someone signs up directly.

1. **Supabase → Authentication → Users → Add user.** Enter an email and
   password and tick **Auto Confirm User**. Copy the new user's UUID.

2. **SQL editor:**

   ```sql
   insert into admin_users (id, full_name, email, role)
   values ('paste-the-uuid', 'Their Name', 'their@email.com', 'super_admin');
   ```

Roles are `super_admin` (everything) and `judge` (registrations, scores, prizes
and the day sheet, but not settings or the catalogue). After the first account
exists, **Admin → Organisers** walks through adding the rest.

If a login fails, the usual cause is a UUID mismatch:

```sql
select u.id, u.email, a.role
  from auth.users u
  left join admin_users a on a.id = u.id;
```

A `null` role means step 2 did not land.

---

## Payments

**For 2026 the only method is cash at the temple**, at ₹99 per competition.
Nothing is collected online, so there is no gateway to set up and no UPI ID to
get right. Collect it at the desk from **Admin → Day sheet**, which shows each
student's total and the cash you should have at the end.

The UPI and Razorpay flows are still in the code and switched off in
**Admin → Settings → How students pay**. Turning one back on is a toggle, not a
rebuild — but set a real UPI ID first; it ships blank on purpose so the site
says "UPI is not set up yet" rather than sending money to a guessed account.

**Razorpay (optional).** Adds cards and net banking with automatic
verification. Needs KYC. See **[supabase/PAYMENTS.md](supabase/PAYMENTS.md)**
for the whole thing — keys, secrets, Edge Functions, webhook and test cards.

Short version:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
supabase functions deploy create-order
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook
```

Then add the webhook in the Razorpay dashboard and set
`RAZORPAY_WEBHOOK_SECRET`.

---

## Changing things without a redeploy

Most of what an organiser needs to change lives in the database, not the code,
so it takes effect the moment you press Save. All four need a **super admin**
account — a judge does not see these screens in the nav.

| To change | Go to |
|---|---|
| Phone, email, WhatsApp, Instagram | **Admin → Settings → Contact details** |
| The devotional song list, and how many students may sing each one | **Admin → Bhajan songs** |
| Fee **per competition**, whether registration is open, the two dates, venue | **Admin → Settings** |
| UPI ID, payee name, which payment methods are offered | **Admin → Settings → How students pay** |

The contact details feed the footer, the contact page and the payment reminder
messages. The song list feeds the bhajan step of the registration form.

Two things are set per competition and are **not** in Settings, because they
differ between the two days — they live on the competition row in the database
(`tracks.start_time` / `end_time`, and `tracks.registration_closes_at`):

- **When it runs.** 23 August is 9–11 am; 30 August is 9 am–12 noon for art and
  fancy dress, and 4–6 pm for bhajan.
- **When entries close.** 22 August for the first day, 28 August for the second.
  `submit_registration` refuses a late entry, so a form left open past the
  cut-off cannot sneak one through.

The fee is charged **per competition entered**. A student entering three owes
₹297, worked out server-side from the number of entries.

Two guards on the song list are worth knowing, because both surface as a
refusal rather than silent data loss:

- A song that a student has already chosen **cannot be deleted** — the database
  refuses it (`on delete restrict`). Switch it off instead: it disappears from
  the registration form while existing entries stay intact.
- The cap **cannot be set below the number who already chose it**. Free up
  entries first.

---

## Running the event

**Admin → Day sheet** is the screen for the day itself. Filter to the temple
day, print it, and you get a list with tick boxes for payment collected and
certificate handed over. On screen those become buttons: *Collect ₹99* records
a cash payment, *Mark given* records the certificate and marks the student
present. It also shows the total cash you should have at the end.

**Notifications.** The bell in the admin header shows new registrations,
reported UPI payments and completed payments, and the *Verify payments* nav
item carries a live count of what is waiting. It polls every 45 seconds rather
than using a realtime subscription — a websocket that quietly dies is a worse
failure than a 45-second delay. "Seen" is per-browser, kept in localStorage.

There is an opt-in button in the bell for desktop notifications, which is
worth turning on for whoever is watching registrations in the run-up.

Note the honest limit: this only fires while an organiser has the portal open
in a tab. Nobody is alerted overnight — email and WhatsApp reminders are still
in [TODO.md](TODO.md).

**Admin → Judging & prizes** takes scores, ranks live as you type, and assigns
prizes. Students see their prize on the public status page as soon as it is
saved.

**Admin → Registrations → Export for Excel** gives one row per student with a
column per competition, payment status, payment reference, attendance and
certificate status.

---

## Deployment

Any static host. `vercel.json` is included with an SPA rewrite so deep links
work. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's
environment.

Both values are safe in the browser — the anon key is protected by row-level
security. The **service role key is not**, and belongs only in Supabase's own
secret store, where the payment functions read it.

---

## Notes on the design

**Song caps are enforced by the database, not the UI.** `selection_items`
carries `taken_count` maintained by a trigger, guarded by
`check (taken_count <= max_slots)`. Two students submitting for the last slot at
the same instant serialise on the row lock; the second one's transaction fails
the constraint and they are asked to pick another song. Verified with two
genuinely concurrent transactions — the second blocked for 2 seconds waiting on
the first, then failed cleanly, and the counter never exceeded the cap. The
availability display is a courtesy; this is the guarantee.

**The browser is never trusted with money.** `create-order` reads the fee from
the registration row, so a tampered client cannot pay ₹1. A payment is only
marked paid after its Razorpay HMAC signature is verified server-side. The
webhook is a second, independent path so a student who closes the tab mid-payment
still ends up marked paid.

**Registrations have no public read path at all.** There is no anon SELECT
policy on `registrations`. The public writes through one `SECURITY DEFINER`
function and reads back through `lookup_registration`, which requires both the
registration code *and* the guardian phone number, so the endpoint cannot be
used to enumerate participants.

**Weight.** Most visitors are on inexpensive Android phones over mobile data,
so: no animation library (CSS handles the fades), no blurred backdrop layers
(radial gradients instead — a large `filter: blur()` is the most common cause
of a janky scroll on a cheap GPU), roman-only webfonts, and route-level code
splitting. Razorpay's checkout script and the confetti library load only at the
moment they are needed.

---

## Still open

See **[TODO.md](TODO.md)** — suggestion lists for Art and Fancy Dress, and
WhatsApp/email reminders. Neither blocks going live.
