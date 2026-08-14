// ============================================================================
//  create-order — opens a Razorpay order for a registration.
//
//  The browser sends only a registration id. The amount comes from the
//  database, never from the request, so a tampered client cannot pay ₹1.
//
//  Deploy:  supabase functions deploy create-order --no-verify-jwt
//  Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// ============================================================================

import { corsHeaders, db, fail, json, requireEnv } from '../_shared/util.ts'

interface Registration {
  id: string
  reg_code: string
  full_name: string
  email: string | null
  whatsapp: string | null
  guardian_phone: string
  fee_amount: number
  payment_method: string | null
  payment_status: string
  razorpay_order_id: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('Method not allowed', 405)

  try {
    const { registration_id } = await req.json().catch(() => ({}))
    if (!registration_id || typeof registration_id !== 'string') {
      return fail('A registration id is required.')
    }

    const keyId = requireEnv('RAZORPAY_KEY_ID')
    const keySecret = requireEnv('RAZORPAY_KEY_SECRET')

    // --- read the registration ------------------------------------------
    const res = await db(
      `registrations?id=eq.${encodeURIComponent(registration_id)}&select=id,reg_code,full_name,email,whatsapp,guardian_phone,fee_amount,payment_method,payment_status,razorpay_order_id`,
    )
    if (!res.ok) return fail('Could not read the registration.', 500)

    const rows = (await res.json()) as Registration[]
    const reg = rows[0]
    if (!reg) return fail('That registration could not be found.', 404)

    if (reg.payment_status === 'paid') {
      return json({ already_paid: true, reg_code: reg.reg_code })
    }
    if (reg.payment_method !== 'razorpay') {
      return fail('This registration is not set up for online payment.')
    }

    const amountPaise = Math.round(reg.fee_amount * 100)
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return fail('The fee for this registration is not valid.', 500)
    }

    // --- create the order at Razorpay ------------------------------------
    const auth = btoa(`${keyId}:${keySecret}`)
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        // Lets us find the registration again from a webhook.
        receipt: reg.reg_code,
        notes: { registration_id: reg.id, reg_code: reg.reg_code },
      }),
    })

    if (!orderRes.ok) {
      const detail = await orderRes.text()
      console.error('razorpay order failed', orderRes.status, detail)
      return fail('The payment gateway did not accept the request. Please try again.', 502)
    }

    const order = (await orderRes.json()) as { id: string; amount: number; currency: string }

    // --- remember the order id so the webhook can match it ---------------
    const patch = await db(`registrations?id=eq.${encodeURIComponent(reg.id)}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({ razorpay_order_id: order.id }),
    })
    if (!patch.ok) {
      console.error('could not store order id', await patch.text())
      return fail('Could not start the payment. Please try again.', 500)
    }

    return json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId, // publishable by design
      reg_code: reg.reg_code,
      name: reg.full_name,
      email: reg.email ?? '',
      contact: reg.whatsapp ?? reg.guardian_phone,
    })
  } catch (err) {
    console.error('create-order error', err)
    return fail('Something went wrong starting the payment.', 500)
  }
})
