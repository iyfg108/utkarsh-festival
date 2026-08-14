/**
 * Message templates, shared by both channels.
 *
 * Merge fields available in subject and body:
 *   {{name}} {{first_name}} {{code}} {{amount}} {{competitions}}
 *   {{online_date}} {{venue_date}} {{venue}} {{upi_id}} {{link}}
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
    label: 'Online day',
    description: 'Entered at least one competition held online.',
  },
  {
    key: 'venue_day',
    label: 'Temple day',
    description: 'Entered at least one competition held at the temple.',
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
    label: 'Online competition reminder',
    segment: 'online_day',
    subject: 'Utkarsh: your online competition is on {{online_date}}',
    body: `Hare Krishna {{first_name}},

Your Utkarsh online competition is on {{online_date}}.

You are entered in: {{competitions}}
Your registration code: {{code}}

Please join using this link: {{link}}

Be ready about ten minutes early, and make sure you have a steady internet connection. Do the competition on your own — no notes, no help.

Good luck!
Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}}! 🙏

Your Utkarsh online competition is on {{online_date}}.
Entered in: {{competitions}}
Code: {{code}}

Join here: {{link}}

Be ready 10 minutes early. Good luck!`,
    hint: 'Put the quiz link in the Link field below before sending.',
  },
  {
    key: 'venue_reminder',
    label: 'Temple day reminder',
    segment: 'venue_day',
    subject: 'Utkarsh: see you at the temple on {{venue_date}}',
    body: `Hare Krishna {{first_name}},

We look forward to seeing you at {{venue}} on {{venue_date}}.

You are entered in: {{competitions}}
Your registration code: {{code}}

Please arrive 30 minutes before your competition and bring your registration code. Bring whatever your competition asks for — colours for art, your costume for fancy dress, your instrument or track for bhajan.

Certificates, prizes and prasadam will be given on the day.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}}! 🙏

See you at {{venue}} on {{venue_date}}.
Entered in: {{competitions}}
Code: {{code}}

Please come 30 min early with your code, and bring what your competition needs.

Certificates, prizes and prasadam on the day!`,
  },
  {
    key: 'payment_reminder',
    label: 'Payment reminder',
    segment: 'unpaid',
    subject: 'Utkarsh: your {{amount}} registration fee',
    body: `Hare Krishna {{first_name}},

Your Utkarsh registration ({{code}}) is saved, but the {{amount}} fee has not reached us yet.

You can pay by UPI to {{upi_id}}, then enter the reference number on the Check status page using your code and the guardian phone number you registered with.

If you have already paid, please ignore this — we may still be matching it against our statement.

Team Utkarsh, ISKCON Guwahati`,
    whatsapp: `Hare Krishna {{first_name}} 🙏

Your Utkarsh registration {{code}} is saved, but the {{amount}} fee has not reached us yet.

Pay by UPI to: {{upi_id}}
Then enter the reference on the Check status page.

Already paid? Please ignore — we may still be matching it.`,
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
