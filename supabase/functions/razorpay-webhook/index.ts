// ============================================================================
//  razorpay-webhook — the safety net.
//
//  A student pays and closes the tab before the browser can call
//  verify-payment. Without this, their money is taken and the registration
//  still reads "pending" on the day of the competition. Razorpay calls this
//  endpoint independently of the browser, so the payment lands either way.
//
//  Idempotent: payment_events.event_id is unique, so a replayed webhook is a
//  no-op rather than a double update.
//
//  Deploy:  supabase functions deploy razorpay-webhook --no-verify-jwt
//  Secrets: RAZORPAY_WEBHOOK_SECRET
//  Then in the Razorpay dashboard add the function URL as a webhook for the
//  `payment.captured` and `payment.failed` events.
// ============================================================================

import { corsHeaders, db, fail, hmacHex, json, requireEnv, safeEqual } from '../_shared/util.ts'

interface RazorpayEvent {
  event: string
  payload?: {
    payment?: {
      entity?: {
        id?: string
        order_id?: string
        amount?: number
        status?: string
        notes?: Record<string, string>
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    // The signature covers the exact bytes sent, so read the body as text
    // and only parse it after the signature checks out.
    const raw = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''
    const secret = requireEnv('RAZORPAY_WEBHOOK_SECRET')

    const expected = await hmacHex(secret, raw)
    if (!signature || !safeEqual(expected, signature)) {
      console.warn('webhook signature mismatch')
      return fail('Invalid signature', 401)
    }

    const event = JSON.parse(raw) as RazorpayEvent
    const entity = event.payload?.payment?.entity
    const orderId = entity?.order_id
    const paymentId = entity?.id

    if (!orderId || !paymentId) {
      // Not a payment event we care about; acknowledge so Razorpay stops retrying.
      return json({ ok: true, ignored: event.event })
    }

    // Find the registration by order id, falling back to the note we set
    // when the order was created.
    let regId: string | null = null
    let regCode: string | null = null
    let alreadyPaid = false

    const res = await db(
      `registrations?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,reg_code,payment_status`,
    )
    if (res.ok) {
      const rows = (await res.json()) as {
        id: string
        reg_code: string
        payment_status: string
      }[]
      if (rows[0]) {
        regId = rows[0].id
        regCode = rows[0].reg_code
        alreadyPaid = rows[0].payment_status === 'paid'
      }
    }
    if (!regId && entity?.notes?.registration_id) {
      regId = entity.notes.registration_id
    }

    // Record the event first. The unique event_id makes a replay a no-op.
    const eventKey = `${event.event}:${paymentId}`
    const logged = await db('payment_events', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        registration_id: regId,
        event_id: eventKey,
        event_type: event.event,
        order_id: orderId,
        payment_id: paymentId,
        amount: entity?.amount ?? null,
        payload: event,
      }),
    })

    // 409 = we have seen this exact event before. Acknowledge and stop.
    if (logged.status === 409) {
      return json({ ok: true, duplicate: true })
    }

    if (!regId) {
      console.warn('webhook for unknown order', orderId)
      return json({ ok: true, unmatched: true })
    }

    if (event.event === 'payment.captured' && !alreadyPaid) {
      const patch = await db(`registrations?id=eq.${encodeURIComponent(regId)}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({
          payment_status: 'paid',
          razorpay_payment_id: paymentId,
          paid_at: new Date().toISOString(),
        }),
      })
      if (!patch.ok) {
        // Returning 500 makes Razorpay retry, which is what we want.
        console.error('webhook could not mark paid', await patch.text())
        return fail('Could not record the payment', 500)
      }
    }

    if (event.event === 'payment.failed' && !alreadyPaid) {
      await db(`registrations?id=eq.${encodeURIComponent(regId)}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ payment_status: 'failed' }),
      })
    }

    return json({ ok: true, reg_code: regCode })
  } catch (err) {
    console.error('razorpay-webhook error', err)
    return fail('Webhook processing failed', 500)
  }
})
