/**
 * Message templates, shared by both channels.
 *
 * Merge fields available in subject and body:
 *   {{name}} {{first_name}} {{code}} {{amount}} {{competitions}}
 *   {{online_date}} {{venue_date}} {{venue}} {{upi_id}} {{link}}
 *
 * And, when one competition is selected in the filter, that competition's own
 * details — so a reminder can name a single event and its real time rather
 * than listing everything the student entered:
 *   {{competition}} {{competition_date}} {{competition_time}} {{report_time}}
 *
 * Email renders these server-side (the Edge Function has the student data).
 * WhatsApp renders them in the browser, because the organiser needs to see the
 * finished text before tapping Send.
 */

export interface MessageTemplate {
  key: string
  label: string
  /** Who this is normally aimed at — drives the default segment. */
  segment: SegmentKey
  subject: string
  body: string
  /** Shorter wording for WhatsApp, where long messages read badly. */
  whatsapp: string
  hint?: string
}

export type SegmentKey =
  | 'everyone'
  | 'unpaid'
  | 'online_day'
  | 'venue_day'
  | 'certificate_pending'

export const SEGMENTS: { key: SegmentKey; label: string; description: string }[] = [
  { key: 'everyone', label: 'Everyone', description: 'All confirmed registrations.' },
  {
    key: 'unpaid',
    label: 'Fee still due',
    description: 'Has not paid, and is not already waiting on your verification.',
  },
  {
    key: 'online_day',
    label: 'First day (23 Aug)',
    description: 'Entered at least one competition on the first day.',
  },
  {
    key: 'venue_day',
    label: 'Second day (30 Aug)',
    description: 'Entered at least one competition on the second day.',
  },
  {
    key: 'certificate_pending',
    label: 'Certificate not given',
    description: 'Took part but has not received a certificate yet.',
  },
]

export const TEMPLATES: MessageTemplate[] = [
  {
    key: 'online_reminder',
    label: 'First day reminder (23 Aug)',
    segment: 'online_day',
    subject: 'Utkarsh: your first competition is on {{online_date}}',
    body: `Hare Krishna {{first_name}},

Your first Utkarsh competition is on {{online_date}} at {{venue}}, 9 am to 11 am.

You are entered in: {{competitions}}
Your registration code: {{code}}

Please report at 8 am — one hour before the 9 am start — so we can seat you with your group. The quiz is answered on a phone, but you attempt it here at the temple, so bring a charged phone with internet.

Good luck!
Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}}! 🙏

Your first Utkarsh competition is on {{online_date}}, 9–11 am at {{venue}}.
Entered in: {{competitions}}
Code: {{code}}

Please report at 8 am, one hour before the start. Bring a charged phone with internet for the quiz.

Good luck!`,
    hint: 'Everything is at the temple — no joining link needed.',
  },
  {
    key: 'venue_reminder',
    label: 'Second day reminder (30 Aug)',
    segment: 'venue_day',
    subject: 'Utkarsh: see you at the temple on {{venue_date}}',
    body: `Hare Krishna {{first_name}},

We look forward to seeing you at {{venue}} on {{venue_date}}.

You are entered in: {{competitions}}
Your registration code: {{code}}

Please report one hour before your competition starts — 8 am for art and fancy dress, 3 pm for bhajan — and bring your registration code. Bring whatever your competition asks for — colours for art, your costume for fancy dress, your instrument or track for bhajan.

Certificates, prizes and prasadam will be given on the day.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}}! 🙏

See you at {{venue}} on {{venue_date}}.
Entered in: {{competitions}}
Code: {{code}}

Please report one hour before your competition: 8 am for art and fancy dress, 3 pm for bhajan. Bring your code and whatever your competition needs.

Certificates, prizes and prasadam on the day!`,
  },
  {
    key: 'payment_reminder',
    label: 'Fee reminder (cash on the day)',
    segment: 'unpaid',
    subject: 'Utkarsh: {{amount}} to bring on the day',
    body: `Hare Krishna {{first_name}},

Your Utkarsh registration ({{code}}) is saved. The fee of {{amount}} is paid in cash at the temple on the day of your first competition — there is nothing to pay online.

Please bring the exact amount if you can. You report an hour before your competition anyway, which is when the desk collects it.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}} 🙏

Your Utkarsh registration {{code}} is saved.

Fee: {{amount}} — paid in cash/upi at the temple on the day, nothing to pay online.

Please bring the exact amount if you can — the desk collects it when you report.`,
  },
  {
    key: 'certificate',
    label: 'Certificate',
    segment: 'certificate_pending',
    subject: 'Your Utkarsh certificate, {{first_name}}',
    body: `Hare Krishna {{first_name}},

Thank you for taking part in Utkarsh. It was a joy to have you.

Your certificate is here: {{link}}

We hope to see you again next year.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}} 🙏

Thank you for taking part in Utkarsh!

Your certificate: {{link}}

Hope to see you again next year 🪔`,
    hint: 'Put the certificate link (or a folder link) in the Link field.',
  },
  {
    key: 'competition_reminder',
    label: 'One competition — reminder',
    segment: 'everyone',
    subject: 'Utkarsh: your {{competition}} is on {{competition_date}}',
    body: `Hare Krishna {{first_name}},

Your {{competition}} is on {{competition_date}}, {{competition_time}}, at {{venue}}.

Please report by {{report_time}} — one hour before it starts.
Your registration code: {{code}}

Bring your code with you. Certificates, prizes and prasadam are given at the temple.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}}! 🙏

Your *{{competition}}* is on {{competition_date}}, {{competition_time}}.
Report by {{report_time}} at {{venue}}.

Your code: {{code}}

See you there!`,
    hint: 'Pick one competition in the filter below — this message names it and uses its own time.',
  },
  {
    key: 'custom',
    label: 'Write my own',
    segment: 'everyone',
    subject: 'A message from Utkarsh',
    body: `Hare Krishna {{first_name}},

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}} 🙏
`,
  },
]

/** Fills {{merge}} fields. Unknown fields render as empty rather than literal. */
export function renderTemplate(
  template: string,
  fields: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => fields[key] ?? '')
}
