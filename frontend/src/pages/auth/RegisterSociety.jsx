import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { identityApi } from '../../api/client'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import TermsAgreementCheckbox from '../../components/TermsAgreementCheckbox'
import {
  clearPendingPayment,
  openRazorpayCheckout,
  readPendingPayment,
  savePendingPayment,
} from '../../utils/razorpay'
import {
  collectErrors,
  email,
  firstError,
  hasErrors,
  mobile,
  personName,
  societyCode,
  text,
  signupPassword,
  SIGNUP_PASSWORD_HINT,
} from '../../utils/validation'

const PLANS = [
  {
    value: 'QUARTERLY',
    title: '3 months',
    hint: 'Pay Quarterly Amount.',
  },
  {
    value: 'SIX_MONTHS',
    title: '6 months',
    hint: 'Pay Half Yearly Amount.',
  },
  {
    value: 'YEARLY',
    title: '1 year',
    hint: 'Pay Annual Amount.',
  },
]

const initial = {
  societyName: '',
  societyCode: '',
  address: '',
  city: '',
  adminName: '',
  adminEmail: '',
  adminMobile: '',
  password: '',
}

function formatInrFromRupees(rupees) {
  const n = Number(rupees)
  if (!Number.isFinite(n)) return ''
  return `₹${n.toLocaleString('en-IN')}`
}

function periodLabel(period) {
  if (period === 'QUARTERLY') return '3 months'
  if (period === 'SIX_MONTHS') return '6 months'
  return '1 year'
}

export default function RegisterSociety() {
  const { registerSociety, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentsEnabled, setPaymentsEnabled] = useState(true)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [amountRupees, setAmountRupees] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('QUARTERLY')

  useEffect(() => {
    let cancelled = false
    identityApi
      .get('/payments/subscription/config')
      .then((res) => {
        if (!cancelled) setPaymentsEnabled(res?.data?.enabled !== false)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const pending = readPendingPayment()
    if (pending?.form) {
      setForm((prev) => ({ ...prev, ...pending.form }))
      if (pending.form.amountRupees != null) setAmountRupees(String(pending.form.amountRupees))
      if (pending.form.billingPeriod) setBillingPeriod(pending.form.billingPeriod)
      setInfo(
        'We found a successful payment from earlier. Click Pay and Sign Up to finish — you will not be charged again if that payment is still valid.',
      )
    }
  }, [])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    const rupees = Number(String(amountRupees).replace(/,/g, ''))
    const amountError =
      !amountRupees || !Number.isFinite(rupees) || rupees < 1
        ? 'Enter the agreed amount in rupees (at least ₹1).'
        : ''
    const errors = collectErrors({
      societyName: text(form.societyName, 'Society name', { min: 2, max: 150 }),
      societyCode: societyCode(form.societyCode),
      address: text(form.address, 'Address', { required: false, max: 250 }),
      city: text(form.city, 'City', { required: false, max: 100 }),
      adminName: personName(form.adminName, 'Full name'),
      adminEmail: email(form.adminEmail),
      adminMobile: mobile(form.adminMobile),
      password: signupPassword(form.password),
    })
    if (amountError) errors.amountRupees = amountError
    if (!billingPeriod) errors.billingPeriod = 'Select a plan: 3 months, 6 months, or 1 year.'
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return null
    }
    return {
      ...form,
      societyName: form.societyName.trim(),
      societyCode: form.societyCode.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      adminMobile: form.adminMobile.trim().replace(/\s+/g, ''),
      amountRupees: rupees,
      amountPaise: Math.round(rupees * 100),
      billingPeriod,
    }
  }

  async function completeRegistration(payload, payment) {
    await registerSociety({
      societyName: payload.societyName,
      societyCode: payload.societyCode,
      address: payload.address,
      city: payload.city,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail,
      adminMobile: payload.adminMobile,
      password: payload.password,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
    })
    clearPendingPayment()
    navigate('/admin')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setTermsError('')
    const payload = validate()
    if (!payload) return

    if (!acceptedTerms) {
      setTermsError('Please accept the Terms of Use, Privacy Policy and Refund & Cancellation Policy to continue.')
      setError('Please accept the terms and policies before payment.')
      return
    }

    if (paymentsEnabled === false) {
      setError('Online payments are not available right now. Please contact SocietySimplify or try again shortly.')
      return
    }

    setPaying(true)
    try {
      const pending = readPendingPayment()
      if (
        pending?.razorpayOrderId &&
        pending?.razorpayPaymentId &&
        pending?.razorpaySignature &&
        pending?.form?.societyCode?.toLowerCase() === payload.societyCode.toLowerCase() &&
        pending?.form?.adminEmail?.toLowerCase() === payload.adminEmail.toLowerCase() &&
        Number(pending?.form?.amountPaise) === payload.amountPaise &&
        pending?.form?.billingPeriod === payload.billingPeriod
      ) {
        setInfo('Confirming your earlier payment and creating the workspace…')
        await completeRegistration(payload, pending)
        return
      }

      const { data: order } = await identityApi.post('/payments/razorpay/create-order', {
        societyName: payload.societyName,
        societyCode: payload.societyCode,
        adminName: payload.adminName,
        adminEmail: payload.adminEmail,
        amountPaise: payload.amountPaise,
        billingPeriod: payload.billingPeriod,
      })

      const payment = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        description: order.planLabel || 'SocietySimplify workspace',
        prefill: {
          name: payload.adminName,
          email: payload.adminEmail,
          contact: payload.adminMobile,
        },
      })

      savePendingPayment({
        ...payment,
        form: {
          ...payload,
          amountRupees: payload.amountRupees,
          amountPaise: payload.amountPaise,
          billingPeriod: payload.billingPeriod,
        },
      })
      setInfo('Payment successful. Creating your workspace…')
      await completeRegistration(payload, payment)
    } catch (err) {
      if (!err.response && err.message) {
        setError(err.message)
      } else if (!err.response) {
        setError(
          'Network issue while finishing signup. If payment succeeded, keep this page open and click Pay and Sign Up again.',
        )
      } else {
        setError(
          err.response.data?.message ||
            'Registration could not be completed. If you were charged, retry with the same details or contact support.',
        )
      }
    } finally {
      setPaying(false)
    }
  }

  const busy = loading || paying
  const amountLabel = amountRupees ? formatInrFromRupees(amountRupees) : null

  return (
    <AuthShell
      step="Pay & set up your workspace"
      title="Create your society account"
      description="After discussing pricing with SocietySimplify, choose 3 months, 6 months, or 1 year, enter the agreed amount, and pay securely on this page only."
    >
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>
        {info && <Alert type="success">{info}</Alert>}

        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-800">
            SocietySimplify plans
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const selected = billingPeriod === plan.value
              return (
                <button
                  key={plan.value}
                  type="button"
                  disabled={busy}
                  onClick={() => setBillingPeriod(plan.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    selected
                      ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                      : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <p className="text-sm font-extrabold text-slate-950">{plan.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{plan.hint}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <p>Discuss with societysimplify experts for the final amount.</p><br />
            <label className="label" htmlFor="amountRupees">Agreed amount (₹)</label>
            <input
              id="amountRupees"
              className="input"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value.replace(/[^\d.]/g, '').slice(0, 10))}
              inputMode="decimal"
              placeholder="e.g. 5000"
              disabled={busy}
            />
            {fieldErrors.amountRupees && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.amountRupees}</p>
            )}
          </div>

          {amountLabel && (
            <p className="mt-3 text-lg font-extrabold text-slate-950">
              {amountLabel}
              <span className="text-sm font-semibold text-slate-600"> / {periodLabel(billingPeriod)}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-2xl bg-teal-50 p-4">
            <p className="text-sm font-bold text-slate-900">1. Society details</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Use a unique combination of city and society registration number to create a society code.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="label">Society Name</label>
              <input name="societyName" className="input max-w-full" value={form.societyName} onChange={update} placeholder="e.g. Shree Ganesh Residency" maxLength={150} disabled={busy} />
              {fieldErrors.societyName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyName}</p>}
            </div>
            <div className="min-w-0">
              <label className="label">Society Code</label>
              <input name="societyCode" className="input max-w-full" value={form.societyCode} onChange={update} placeholder="e.g. SATARA-S312" maxLength={40} disabled={busy} />
              {fieldErrors.societyCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyCode}</p>}
            </div>
            <div className="min-w-0">
              <label className="label">Address</label>
              <input name="address" className="input max-w-full" value={form.address} onChange={update} maxLength={250} disabled={busy} />
            </div>
            <div className="min-w-0">
              <label className="label">City</label>
              <input name="city" className="input max-w-full" value={form.city} onChange={update} maxLength={100} disabled={busy} />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">2. Committee/Secretary admin details</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="label">Full Name</label>
              <input name="adminName" className="input max-w-full" value={form.adminName} onChange={update} maxLength={120} disabled={busy} />
              {fieldErrors.adminName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminName}</p>}
            </div>
            <div className="min-w-0">
              <label className="label">Mobile</label>
              <input name="adminMobile" className="input max-w-full" value={form.adminMobile} onChange={update} inputMode="numeric" placeholder="10-digit mobile" maxLength={10} disabled={busy} />
              {fieldErrors.adminMobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminMobile}</p>}
            </div>
            <div className="min-w-0">
              <label className="label">Email</label>
              <input name="adminEmail" type="email" className="input max-w-full" value={form.adminEmail} onChange={update} disabled={busy} />
              {fieldErrors.adminEmail && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminEmail}</p>}
            </div>
            <div className="min-w-0">
              <label className="label">Password</label>
              <input name="password" type="password" className="input max-w-full" value={form.password} onChange={update} autoComplete="new-password" disabled={busy} />
              <p className="mt-1 break-words text-xs text-slate-500">{SIGNUP_PASSWORD_HINT}</p>
              {fieldErrors.password && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>}
            </div>
          </div>

          <TermsAgreementCheckbox
            id="society-accept-terms"
            checked={acceptedTerms}
            disabled={busy}
            includeRefund
            error={termsError}
            onChange={(value) => {
              setAcceptedTerms(value)
              if (value) setTermsError('')
            }}
          />

          <button
            className="btn-primary w-full !bg-teal-600 !py-3 hover:!bg-teal-700"
            disabled={busy || !acceptedTerms}
          >
            {paying
              ? 'Opening Razorpay…'
              : loading
                ? 'Creating workspace…'
                : amountLabel
                  ? `Pay ${amountLabel} and Sign Up`
                  : 'Pay and Sign Up'}
          </button>
          <p className="text-center text-[11px] leading-4 text-slate-500">
            Secure Razorpay checkout on SocietySimplify only. Receipt is emailed after successful payment.
          </p>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800">
            Sign in
          </Link>
          {' · '}
          <Link to="/renew" className="font-bold text-teal-700 hover:text-teal-800">
            Renew subscription
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
