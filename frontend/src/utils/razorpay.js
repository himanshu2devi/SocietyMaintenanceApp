/**
 * Loads Razorpay Checkout.js once. Handles offline / blocked-script failures.
 */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Payment is only available in the browser.'))
      return
    }
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const existing = document.querySelector('script[data-societywale-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay))
      existing.addEventListener('error', () =>
        reject(new Error('Could not load Razorpay. Check your internet connection and try again.')),
      )
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.societywaleRazorpay = '1'
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay)
      else reject(new Error('Razorpay failed to initialise. Please refresh and try again.'))
    }
    script.onerror = () =>
      reject(new Error('Could not load Razorpay. Check your internet connection and try again.'))
    document.body.appendChild(script)
  })
}

const PENDING_KEY = 'sw_pending_razorpay'

export function savePendingPayment(payload) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }))
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPendingPayment() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Drop after 2 hours — user can pay again if needed
    if (!data?.razorpayOrderId || Date.now() - (data.savedAt || 0) > 2 * 60 * 60 * 1000) {
      clearPendingPayment()
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Opens Razorpay Checkout and resolves with order/payment/signature on success.
 */
export function openRazorpayCheckout({
  keyId,
  orderId,
  amountPaise,
  currency,
  name,
  description,
  prefill,
}) {
  return new Promise(async (resolve, reject) => {
    try {
      const Razorpay = await loadRazorpayScript()
      const rzp = new Razorpay({
        key: keyId,
        amount: amountPaise,
        currency: currency || 'INR',
        name: 'SocietyWale',
        description: description || 'Annual society workspace',
        order_id: orderId,
        prefill: prefill || {},
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment was cancelled. Complete payment to create your workspace.'))
          },
        },
        handler: (response) => {
          if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
            reject(new Error('Payment response was incomplete. If money was deducted, contact support with your bank SMS.'))
            return
          }
          resolve({
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
        },
      })
      rzp.on('payment.failed', (response) => {
        const reason = response?.error?.description || response?.error?.reason || 'Payment failed'
        reject(new Error(`${reason}. Please try again — you will only be charged if payment succeeds.`))
      })
      rzp.open()
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Could not open payment window.'))
    }
  })
}
