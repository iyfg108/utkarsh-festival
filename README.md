# Utkarsh Heritage Festival

The public website and organiser portal for **Utkarsh**, the annual heritage
festival for school students in Guwahati, run by ISKCON Guwahati, Ulubari.

Students browse the competitions, register, pay, and check their status.
Organisers run the whole event — registrations, payments, judging, prizes and
certificates — from `/admin`.

---

## How the festival works

Five competitions, open to **Class 1 to 10**, across two days. A student may
enter as many as they like for a single **₹99** registration fee.

| Date | Where | Competitions |
|---|---|---|
| **23 August** | Online, from home | Vedic Quiz |
| **30 August** | ISKCON Guwahati, Ulubari | Vedic Art, Vedic Fancy Dress, Devotional Bhajan, Gita Shloka Uchcharan |

Everyone gets a certificate. Prizes and prasadam are given at the temple on
30 August; anyone who cannot collect their certificate in person receives a
digital copy by email or WhatsApp.

**Paying:** by UPI at registration (or card/net banking if Razorpay is switched
on). If a student has entered **at least one** competition held at the temple,
they may instead pay ₹99 in cash on the day. If every competition they chose is
online there is no venue to pay at, so the fee must be paid online — a rule
enforced by the database, not just the form.

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
| `supabase/seed.sql` | The five competitions, the bhajan song list, gallery, settings. |
| `supabase/patches.sql` | Updates settings on an *already seeded* database (seed.sql never overwrites them). |

`schema.sql` and `seed.sql` are safe to re-run. `reset.sql` is not — it is
destructive by design, and only needed when rebuilding from an older version.

Verify afterwards:

```sql
select name, sanskrit_name, mode, event_date, requires_selection from tracks order by sort_order;
```

You should get five rows, with `requires_selection` true only on Devotional
Bhajan.

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

The fee can be collected two ways, and both can run at once. Which methods
students see is controlled from **Admin → Settings → How students pay**.

**UPI (default, no gateway).** Student pays to your UPI ID via QR or a
tap-to-pay link, then reports the UTR reference. An organiser confirms it
against the bank statement in **Admin → Verify payments**. No KYC, no fees,
works immediately. The database refuses to let two students claim the same
reference, and a payment awaiting verification is never billed again at the
desk.

Set your UPI ID in Admin → Settings before opening registration — it ships
blank on purpose, and the site says "UPI is not set up yet" rather than
guessing an account.

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
