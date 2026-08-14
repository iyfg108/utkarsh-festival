# Messaging students

**Admin → Messages.** Two channels, deliberately different.

| | Email | WhatsApp |
|---|---|---|
| Setup | ~15 minutes, once | None |
| Sending | Fully automatic, hundreds at a time | You tap Send on each one |
| Reaches | Whoever gave an email | Whoever gave a WhatsApp number |
| Best for | Bulk reminders, certificates | Personal follow-up, chasing payment |

Every registration has at least one of the two — the database enforces it — so
between them you can reach everybody. The screen tells you how many in a group
are missing each.

---

## WhatsApp — works right now, nothing to set up

Pick a message and a group, and you get a list with an **Open** button per
student. Each opens WhatsApp with the message already typed, addressed to
them. Merge fields are filled in — their name, code, competitions.

**You still have to press Send.** That is WhatsApp's rule, not a gap in the
tool: no service can send WhatsApp on your behalf without the official
Business API (see below). So 200 students is 200 taps.

What makes that survivable is the **tick**. Opening a message marks the student
as sent, and they drop off the list. You can stop half way, come back tomorrow,
or have three volunteers work the same list from different laptops without
double-messaging anyone. Ticked someone by mistake? Click **Sent** to undo.

Practical advice:

- Use **WhatsApp Web on a laptop**, not your phone. Enter sends; it is roughly
  three seconds per student instead of ten.
- Do it in one sitting per group. 200 students is about fifteen minutes.
- Do **not** try WhatsApp Broadcast Lists. They only deliver to people who have
  *your* number saved in their contacts, and students who just registered have
  not.

---

## Email — 15 minutes of setup, then it is automatic

### Why Brevo

Most providers (Resend, Postmark, SES) require you to own and verify a whole
domain before sending to arbitrary addresses. The festival sends from a Gmail
address, so that is a non-starter.

Brevo lets you verify a **single sender address**. You click a link in your
inbox and you are done. The free tier is 300 emails a day, which comfortably
covers a few hundred students.

### 1. Create the account and verify the sender

1. Sign up at [brevo.com](https://www.brevo.com).
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender.**
3. Enter `iyfguwahati@gmail.com` (or whichever address the festival replies
   from). Brevo emails it a confirmation link — click it.
4. **SMTP & API → API Keys → Generate a new API key.** Copy it.

### 2. Deploy

```bash
cd ~/Documents/Personal/personal/utkarsh
supabase secrets set BREVO_API_KEY=xkeysib-your-key-here
supabase secrets set MAIL_FROM_EMAIL=iyfguwahati@gmail.com
supabase secrets set MAIL_FROM_NAME="Utkarsh Heritage Festival"
supabase functions deploy send-email
```

Note this function is **not** in `config.toml`, so it keeps `verify_jwt = true`.
That is deliberate: an open endpoint that sends mail is a spam relay. It also
checks the caller against `admin_users`, so a signed-in non-organiser is
refused.

### 3. Send one to yourself first

Register yourself with your own email, then in **Admin → Messages** filter the
list to your name and send. Check it arrives and is not in spam before sending
to three hundred people.

If it lands in spam, the usual cause is that Gmail dislikes bulk mail from an
unverified domain. Options, in order of effort: keep volumes low and spread out
(fine at this scale), or buy a cheap domain and verify it properly in Brevo.

---

## The four messages

| Template | Group | When |
|---|---|---|
| **Online competition reminder** | Online day | The day before 23 August — put the quiz link in the Link field |
| **Temple day reminder** | Temple day | The day before 30 August |
| **Payment reminder** | Fee still due | A few days before the deadline |
| **Certificate** | Certificate not given | After the festival — put the certificate link in the Link field |

All are editable, and **Write my own** gives you a blank one. Merge fields:

```
{{first_name}} {{name}} {{code}} {{competitions}} {{amount}}
{{online_date}} {{venue_date}} {{venue}} {{upi_id}} {{link}}
```

The preview pane shows the finished message as a real student would read it.

One deliberate choice in the **Fee still due** group: it excludes anyone whose
UPI payment is waiting on *your* verification. They have paid; chasing them
would be a bad look.

---

## If you want proper WhatsApp automation next year

The **WhatsApp Cloud API** sends without a human tapping. It needs a Meta
Business account, a verified business, and message templates approved in
advance — approval takes days to weeks, which is why it is not part of this
year's setup.

If you want it for next year, start the business verification in advance. The
code is the short part; the verification wait is the long one.
