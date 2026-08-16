# Payments

Two ways to take the ₹99, and you can run both at once. Which ones students see
is controlled from **Admin → Settings → How students pay**, so you can switch
Razorpay on later without touching the code.

| | UPI (direct) | Razorpay |
|---|---|---|
| Setup | Minutes | 1–2 days for KYC, sometimes longer |
| Fees | None | ~2% |
| Verification | An organiser checks the reference | Automatic |
| Cards / net banking | No | Yes |

---

# Part 1 — UPI (no gateway, no KYC)

The student pays straight into your bank account and reports the reference
number. An organiser matches it against the statement. This works today, and
for a ₹99 student festival it is usually all you need.

## Set it up

1. **Admin → Settings → How students pay.**
2. Enter the **UPI ID** money should arrive at (e.g. `something@sbi`) and the
   payee name students will see.
3. Leave **UPI** switched on. Leave **Razorpay** off until Part 2 is done.

> ⚠️ Check the UPI ID character by character, then **send yourself ₹1** using
> the QR on the registration success page. This is the one value in the whole
> project where a typo silently sends real money somewhere else. The site
> deliberately ships with it blank and shows "UPI is not set up yet" rather
> than guessing.

## What the student sees

Two numbered steps: pay, then report the reference. What step 1 offers depends
on the device, because a phone cannot scan its own screen.

**On a phone** — an **Open my UPI app** button leads. It is a `upi://pay` link
with the amount, our VPA and the registration code already filled in; Android
answers it with the system chooser listing every UPI app the student has, so
they pick whichever they use. Below it is the UPI ID as copyable text, and the
QR is tucked behind *Show QR code* for the case where a parent pays from a
second handset.

iPhones are the exception: hardly any Indian UPI app claims `upi://` on iOS, so
that student also gets named buttons for Google Pay, PhonePe, Paytm and BHIM,
which use each app's own scheme. A button for an app they do not have simply
does nothing, which is why the copyable UPI ID is always on screen too.

**On a desktop** — the QR leads, with the UPI ID beside it. No app buttons; a
desktop has no UPI app to open.

Paying means leaving the site, so the return trip is handled: when the student
comes back, the page notices, says *Welcome back* and puts the cursor in the
reference box. If the browser dropped the tab while they were away, the same
box is on **Check status**, reachable with their code and guardian phone.

After paying they enter the UTR (their app calls it *UTR*, *Transaction ID* or
*Reference No*). Their registration then reads **awaiting verification** — the
place is held, but not yet confirmed.

## Checking payments

**Admin → Verify payments** lists everyone waiting, with the amount and the
reference. Click a reference to copy it, search your bank statement, then:

- **Confirm** — marks them paid and records who verified it and when.
- **Not found** — clears the reference and puts them back to unpaid so they can
  submit a corrected one themselves. Worth a phone call first: a student
  mistyping a digit is far more likely than a student inventing a payment.

Two guards worth knowing about: the same reference cannot be claimed by two
students (the database rejects it), and the day sheet does **not** ask the desk
to collect cash from someone who is merely awaiting verification.

## The honest limitation

Nothing is automatic. Someone has to sit with the bank statement. For the
online-only students — the only ones who cannot pay at the temple — that is
usually a short list and fifteen minutes of work.

---

# Part 2 — Razorpay setup (optional)

Adds cards and net banking, and removes the manual checking. Follow this once
in **Test mode**, take a test payment end to end, then repeat step 3 with live
keys when you are ready to charge real money.

Budget about 40 minutes for the first pass, plus however long Razorpay takes to
approve your account (usually 1–2 working days, sometimes longer — start it
early, this is the only part you cannot rush).

---

## How the money flow actually works

Worth understanding before you touch anything, because it explains why there
are three functions instead of one.

```
Student fills the form
        │
        ▼
submit_registration()          registration saved, payment_status = 'pending'
        │
        ▼
create-order                   server asks Razorpay to open an order,
(Edge Function)                for the amount stored in the DATABASE
        │
        ▼
Razorpay Checkout              student pays by UPI / card / net banking
        │
        ├──────────────► verify-payment      browser reports success; the
        │                (Edge Function)     server checks the signature
        │                                    before believing it
        │
        └──────────────► razorpay-webhook    Razorpay tells the server
                         (Edge Function)     directly, even if the student
                                             closed the tab
```

Two rules this design enforces, both of which matter:

- **The amount never comes from the browser.** `create-order` reads
  `fee_amount` from the registration row. Someone editing the page cannot pay
  ₹1.
- **A payment is only marked paid after a signature check.** Razorpay signs
  every result with your key secret. The functions recompute that HMAC and
  compare it. A forged "payment succeeded" call is rejected.

The webhook exists because browsers are unreliable — students close tabs, lose
signal, and hit back. Without it, a student could pay and still show as unpaid
on the day. With it, the payment lands either way, and the two paths are
idempotent so a double-report is a no-op.

---

## 1. Create the Razorpay account

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Complete KYC. For a temple or society you will typically need the
   registration certificate, PAN, and a bank account in the organisation's
   name. **Start this first** — everything else is quick, this is not.
3. You can build and test the whole flow in **Test mode** while KYC is pending.

---

## 2. Get your API keys

In the Razorpay dashboard: **Settings → API Keys → Generate Test Key**.

You get two values:

| Value | Looks like | Secret? |
|---|---|---|
| Key ID | `rzp_test_xxxxxxxxxxxx` | No — it is sent to the browser by design |
| Key Secret | a long random string | **Yes.** Never put this in `.env` or in the repo |

The secret is shown **once**. Copy it now.

> The key secret must only ever live in Supabase's secret store. It is what
> proves a payment is genuine — anyone holding it can forge one.

---

## 3. Point the CLI at your project

```bash
cd ~/Documents/Personal/personal/utkarsh
supabase login
supabase link --project-ref hhdeqppwlnlssintpifv
```

`supabase login` opens a browser to authorise the CLI. The project ref is the
subdomain of your Supabase URL.

---

## 4. Store the secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret_here
```

Leave the webhook secret for step 6 — you invent that value yourself when you
create the webhook.

Check what is stored (values stay hidden):

```bash
supabase secrets list
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. You
do not set those, and you should never copy the service role key anywhere else
— it bypasses every row-level security policy.

---

## 5. Deploy the functions

```bash
supabase functions deploy create-order
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook
```

`supabase/config.toml` already sets `verify_jwt = false` for all three, so no
extra flags are needed. That is deliberate: students have no accounts, so there
is no JWT to verify. The functions are protected by the unguessable
registration UUID and by Razorpay's signature, not by a login.

Confirm they are live:

```bash
supabase functions list
```

---

## 6. Add the webhook

In the Razorpay dashboard: **Settings → Webhooks → Add New Webhook**.

- **Webhook URL**

  ```
  https://hhdeqppwlnlssintpifv.supabase.co/functions/v1/razorpay-webhook
  ```

- **Secret** — invent a long random string. Generate one with:

  ```bash
  openssl rand -hex 32
  ```

- **Active events** — tick exactly these two:
  - `payment.captured`
  - `payment.failed`

Save it, then give the same secret to Supabase:

```bash
supabase secrets set RAZORPAY_WEBHOOK_SECRET=the_string_you_just_generated
supabase functions deploy razorpay-webhook
```

The redeploy matters — functions pick up secrets at deploy time.

---

## 7. Take a test payment

With test keys in place, register on your own site and pay.

**Test card**

| Field | Value |
|---|---|
| Number | `4111 1111 1111 1111` |
| Expiry | any future date |
| CVV | any 3 digits |
| OTP | `1234` (or whatever the test dialog shows) |

**Test UPI** — enter `success@razorpay` to simulate success, `failure@razorpay`
to simulate a failure.

Then check all three of these:

1. **Admin → Registrations** shows the student as **Paid**.
2. **Razorpay → Transactions** shows a captured payment for ₹99.
3. The row in `payment_events` (SQL editor) recorded the webhook:

   ```sql
   select event_type, order_id, payment_id, amount, created_at
     from payment_events
    order by created_at desc
    limit 5;
   ```

Also worth testing deliberately, because these are the paths that bite in
production:

- **Close the Razorpay window instead of paying.** The registration should be
  saved as unpaid, and the success page should offer a "Pay ₹99 now" button.
- **Pay from the status page.** Look up the registration with the code and
  guardian phone, and complete payment there. This is the path most students
  who abandon checkout will use.

---

## 8. Switch it on for students

Deploying the functions does not by itself show Razorpay to anyone. Go to
**Admin → Settings → How students pay** and switch **Card & net banking** on.
Leave it off until a test payment has gone through, or students will hit a
broken checkout.

## 9. Go live

When KYC is approved:

1. Flip the dashboard to **Live mode** and generate live keys.
2. Re-run step 4 with the live `rzp_live_...` key and its secret.
3. Create the webhook again — **live and test webhooks are separate**, and this
   is the single most commonly missed step. Use a fresh secret and set it.
4. Redeploy all three functions.
5. Take one real ₹99 payment yourself and refund it from the dashboard.

---

## If something goes wrong

**See what the function actually did** — logs are the fastest route to an
answer:

```bash
supabase functions logs create-order
supabase functions logs verify-payment
supabase functions logs razorpay-webhook
```

| Symptom | Cause |
|---|---|
| "The payment gateway did not accept the request" | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` wrong, or you mixed a test key with a live secret |
| "This payment could not be verified" | `RAZORPAY_KEY_SECRET` does not match the key that created the order |
| Webhook shows 401 in Razorpay | `RAZORPAY_WEBHOOK_SECRET` differs from the dashboard value, or the function was not redeployed after setting it |
| Student paid, site still says unpaid | Check `payment_events`. Empty means the webhook never arrived — re-check the URL and that both events are ticked |
| Function returns 401 before running | `verify_jwt` is still on; confirm `supabase/config.toml` was picked up and redeploy |

Razorpay retries a failing webhook for 24 hours, so a temporary outage
self-heals. You can also replay one from **Settings → Webhooks → the webhook →
Recent Deliveries**.

---

## Refunds

Not wired into the admin portal. Issue refunds from the Razorpay dashboard
(**Transactions → the payment → Refund**), then set that student's payment
status by hand in the admin portal if you want the records to agree.

Deleting a paid registration does **not** refund anything — the delete
confirmation says so explicitly.
