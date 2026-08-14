// ============================================================================
//  verify-payment — confirms a Razorpay checkout result.
//
//  Razorpay Checkout hands the browser an order id, a payment id and a
//  signature. Only the signature proves the payment is real, and only the key
//  secret can check it — which is why this runs here and not in the page.
//
//  Deploy:  supabase functions deploy verify-payment --no-verify-jwt
//  Secrets: RAZORPAY_KEY_SECRET
// ============================================================================

import { corsHeaders, db, fail, hmacHex, json, requireEnv, safeEqual } from '../_shared/util.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    const body = await req.json().catch(() => ({}))
    const orderId = body.razorpay_order_id as string | undefined
    const paymentId = body.razorpay_payment_id as string | undefined
    const signature = body.razorpay_signature as string | undefined

    if (!orderId || !paymentId || !signature) {
      return fail('Incomplete payment details.')
    }

    const keySecret = requireEnv('RAZORPAY_KEY_SECRET')
    const expected = await hmacHex(keySecret, `${orderId}|${paymentId}`)

    if (!safeEqual(expected, signature)) {
      console.warn('signature mismatch for order', orderId)
      return fail('This payment could not be verified. If money was deducted it will be refunded automatically — please contact us.', 400)
    }

    // Signature is good. Find the registration this order belongs to.
    const res = await db(
      `registrations?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=id,reg_code,payment_status,fee_amount`,
    )
    if (!res.ok) return fail('Could not read the registration.', 500)

    const rows = (await res.json()) as {
      id: string
      reg_code: string
      payment_status: string
      fee_amount: number
    }[]
    const reg = rows[0]
    if (!reg) return fail('No registration matches this payment.', 404)

    // Already settled by the webhook — nothing to do, and not an error.
    if (reg.payment_status === 'paid') {
      return json({ ok: true, already_paid: true, reg_code: reg.reg_code })
    }

    const patch = await db(`registrations?id=eq.${encodeURIComponent(reg.id)}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({
        payment_status: 'paid',
        razorpay_payment_id: paymentId,
        paid_at: new Date().toISOString(),
      }),
    })
    if (!patch.ok) {
      console.error('could not mark paid', await patch.text())
      return fail('Payment succeeded but we could not record it. Please contact us with your registration code.', 500)
    }

    await db('payment_events', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        registration_id: reg.id,
        event_id: `checkout:${paymentId}`,
        event_type: 'checkout.verified',
        order_id: orderId,
        payment_id: paymentId,
        amount: reg.fee_amount * 100,
      }),
    })

    return json({ ok: true, reg_code: reg.reg_code })
  } catch (err) {
    console.error('verify-payment error', err)
    return fail('Something went wrong verifying the payment.', 500)
  }
})
