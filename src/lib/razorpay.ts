import { createPaymentOrder, verifyPayment } from './queries'
import type { CreateOrderResult } from './types'

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; email: string; contact: string }
  notes: Record<string, string>
  theme: { color: string }
  handler: (response: RazorpayResponse) => void
  modal: { ondismiss: () => void }
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, cb: (e: unknown) => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

let loader: Promise<void> | null = null

/**
 * Injects Razorpay's checkout script the first time it is actually needed.
 * Keeping it out of the bundle means a student browsing competitions on a
 * slow connection never downloads it.
 */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (loader) return loader

  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('checkout failed to load')))
      return
    }

    const script = document.createElement('script')
    script.src = CHECKOUT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loader = null
      reject(new Error('We could not reach the payment gateway. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })

  return loader
}

export type PayOutcome =
  | { status: 'paid'; regCode: string }
  | { status: 'already_paid'; regCode: string }
  | { status: 'dismissed' }

/**
 * Runs the whole payment round trip for a registration:
 * order created server-side → Razorpay checkout → signature verified
 * server-side. Resolves only once the server has confirmed the payment.
 */
export async function payForRegistration(
  registrationId: string,
  opts: { onProgress?: (stage: 'creating' | 'opening' | 'verifying') => void } = {},
): Promise<PayOutcome> {
  opts.onProgress?.('creating')

  const order: CreateOrderResult = await createPaymentOrder(registrationId)
  if (order.already_paid) {
    return { status: 'already_paid', regCode: order.reg_code }
  }

  await loadCheckout()
  if (!window.Razorpay) {
    throw new Error('The payment gateway could not start. Please try again.')
  }

  opts.onProgress?.('opening')

  return new Promise<PayOutcome>((resolve, reject) => {
    let settled = false

    const rzp = new window.Razorpay!({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'Utkarsh Heritage Festival',
      description: `Registration ${order.reg_code}`,
      order_id: order.order_id,
      prefill: {
        name: order.name,
        email: order.email,
        contact: order.contact,
      },
      notes: { reg_code: order.reg_code },
      theme: { color: '#f98a00' },

      handler: (response) => {
        settled = true
        opts.onProgress?.('verifying')
        verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
          .then((result) => resolve({ status: 'paid', regCode: result.reg_code }))
          // The webhook is the backstop here: even if this verify call fails,
          // Razorpay tells the server separately, so the money is not lost.
          .catch(reject)
      },

      modal: {
        ondismiss: () => {
          if (!settled) resolve({ status: 'dismissed' })
        },
      },
    })

    rzp.on('payment.failed', (e: unknown) => {
      settled = true
      const description =
        (e as { error?: { description?: string } })?.error?.description ??
        'The payment did not go through.'
      reject(new Error(`${description} You can try again from the status page.`))
    })

    rzp.open()
  })
}
