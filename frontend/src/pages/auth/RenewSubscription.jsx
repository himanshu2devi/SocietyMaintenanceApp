import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { identityApi } from '../../api/client'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import { clearPendingPayment, openRazorpayCheckout, savePendingPayment } from '../../utils/razorpay'
import { getApiErrorMessage } from '../../utils/apiError'
import { collectErrors, email, firstError, hasErrors, societyCode } from '../../utils/validation'
import { useAuth } from '../../context/AuthContext'

const PLANS = [
  { value: 'QUARTERLY', label: '3 months' },
  { value: 'SIX_MONTHS', label: '6 months' },
  { value: 'YEARLY', label: '1 year' },
]

export default function RenewSubscription() {
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const [societyCodeValue, setSocietyCodeValue] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [amountRupees, setAmountRupees] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('SIX_MONTHS')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [paying, setPaying] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const rupees = Number(String(amountRupees).replace(/,/g, ''))
    const errors = collectErrors({
      societyCode: societyCode(societyCodeValue),
      adminEmail: email(adminEmail),
      amountRupees:
        !amountRupees || !Number.isFinite(rupees) || rupees < 1
          ? 'Enter the agreed amount in rupees (at least ₹1).'
          : '',
      billingPeriod: !billingPeriod ? 'Select a plan.' : '',
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }

    const amountPaise = Math.round(rupees * 100)
    setPaying(true)
    try {
      const { data: order } = await identityApi.post('/payments/razorpay/create-renewal-order', {
        societyCode: societyCodeValue.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        amountPaise,
        billingPeriod,
      })

      const payment = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        description: order.planLabel || 'SocietySimplify renewal',
        prefill: { email: adminEmail.trim() },
      })

      savePendingPayment({ ...payment })
      setInfo('Payment successful. Activating subscription…')

      const { data } = await identityApi.post('/auth/renew-subscription', {
        societyCode: societyCodeValue.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature,
      })

      clearPendingPayment()
      if (data?.token) {
        applySession(data)
      }
      navigate(data?.user?.role === 'ADMIN' ? '/admin' : '/member', { replace: true })
    } catch (err) {
      setError(err?.message || getApiErrorMessage(err, 'Renewal failed. Try again or contact SocietySimplify.'))
    } finally {
      setPaying(false)
    }
  }

  return (
    <AuthShell
      step="Renew access"
      title="Renew your SocietySimplify subscription"
      description="After your plan ends, pay the agreed amount on this page to continue. Choose 3 months, 6 months, or 1 year. Payment only via SocietySimplify Razorpay."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error">{error}</Alert>}
        {info && <Alert type="success">{info}</Alert>}

        <div>
          <label className="label">Society code</label>
          <input className="input" value={societyCodeValue} onChange={(e) => setSocietyCodeValue(e.target.value)} disabled={paying} />
          {fieldErrors.societyCode && <p className="mt-1 text-xs text-red-600">{fieldErrors.societyCode}</p>}
        </div>
        <div>
          <label className="label">Committee admin email</label>
          <input type="email" className="input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} disabled={paying} />
          {fieldErrors.adminEmail && <p className="mt-1 text-xs text-red-600">{fieldErrors.adminEmail}</p>}
        </div>

        <div>
          <label className="label">Plan</label>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <button
                key={plan.value}
                type="button"
                disabled={paying}
                onClick={() => setBillingPeriod(plan.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                  billingPeriod === plan.value
                    ? 'border-teal-600 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200'
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Agreed amount (₹)</label>
          <input
            className="input"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
            disabled={paying}
            placeholder="Amount finalised with SocietySimplify"
          />
          {fieldErrors.amountRupees && <p className="mt-1 text-xs text-red-600">{fieldErrors.amountRupees}</p>}
        </div>

        <button type="submit" className="btn-primary w-full !bg-teal-600 !py-3 hover:!bg-teal-700" disabled={paying}>
          {paying ? 'Processing…' : 'Pay and renew'}
        </button>

        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="font-bold text-teal-700">Sign in</Link>
          {' · '}
          <Link to="/contact" className="font-bold text-teal-700">Get in touch</Link>
        </p>
      </form>
    </AuthShell>
  )
}
