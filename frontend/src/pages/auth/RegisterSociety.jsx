import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { identityApi } from '../../api/client'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
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

/** Shown immediately so customers always see price/offer even before/without API. */
const DEFAULT_PRICING = {
  enabled: true,
  listPriceRupees: 9999,
  offerPriceRupees: 4999,
  amountPaise: 499900,
  amountDisplay: '₹4,999',
  currency: 'INR',
  planLabel: 'Annual society workspace',
}

export default function RegisterSociety() {
  const { registerSociety, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [paying, setPaying] = useState(false)
  const [pricing, setPricing] = useState(DEFAULT_PRICING)

  useEffect(() => {
    let cancelled = false
    identityApi
      .get('/payments/subscription/config')
      .then((res) => {
        if (cancelled || !res?.data) return
        const d = res.data
        setPricing({
          ...DEFAULT_PRICING,
          ...d,
          listPriceRupees: d.listPriceRupees ?? DEFAULT_PRICING.listPriceRupees,
          offerPriceRupees: d.offerPriceRupees ?? DEFAULT_PRICING.offerPriceRupees,
          amountPaise: d.amountPaise ?? DEFAULT_PRICING.amountPaise,
          amountDisplay: d.amountDisplay || DEFAULT_PRICING.amountDisplay,
          enabled: d.enabled !== false,
        })
      })
      .catch(() => {
        /* keep DEFAULT_PRICING visible */
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const pending = readPendingPayment()
    if (pending?.form) {
      setForm((prev) => ({ ...prev, ...pending.form }))
      setInfo('We found a successful payment from earlier. Click Pay Now and Sign Up to finish creating your workspace — you will not be charged again if that payment is still valid.')
    }
  }, [])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
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
    }
  }

  async function completeRegistration(payload, payment) {
    await registerSociety({
      ...payload,
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
    const payload = validate()
    if (!payload) return

    if (pricing.enabled === false) {
      setError('Online payments are not available right now. Please email societywale.in@gmail.com or try again shortly.')
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
        pending?.form?.adminEmail?.toLowerCase() === payload.adminEmail.toLowerCase()
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
      })

      const payment = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        description: order.planLabel || 'Annual society workspace',
        prefill: {
          name: payload.adminName,
          email: payload.adminEmail,
          contact: payload.adminMobile,
        },
      })

      savePendingPayment({ ...payment, form: payload })
      setInfo('Payment successful. Creating your workspace…')
      await completeRegistration(payload, payment)
    } catch (err) {
      if (!err.response && err.message) {
        setError(err.message)
      } else if (!err.response) {
        setError(
          'Network issue while finishing signup. If payment succeeded, keep this page open, check your connection, and click Pay Now and Sign Up again — we will reuse the successful payment when possible.',
        )
      } else {
        setError(
          err.response.data?.message ||
            'Registration could not be completed. If you were charged, retry with the same email and society code, or contact support with your Razorpay payment ID.',
        )
      }
    } finally {
      setPaying(false)
    }
  }

  const busy = loading || paying
  const listPrice = pricing.listPriceRupees || 9999
  const offerPrice = pricing.offerPriceRupees || 4999
  const chargeLabel =
    pricing.amountDisplay ||
    `₹${(Number(pricing.amountPaise || 499900) / 100).toLocaleString('en-IN')}`

  return (
    <AuthShell
      step="Pay & set up your workspace"
      title="Create your society account"
      description="Fill in society and committee details, then pay to activate your workspace. Access is unlocked only after successful payment."
    >
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>
        {info && <Alert type="success">{info}</Alert>}

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-700">
              Annual society subscription
            </p>
            <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Limited time offer
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-lg font-semibold text-slate-400 line-through">
              ₹{listPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-3xl font-extrabold tracking-tight text-slate-950">
              ₹{offerPrice.toLocaleString('en-IN')}
              <span className="text-sm font-semibold text-slate-600"> / year</span>
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            <p>
              {/* <span className="font-semibold text-slate-900">You pay at checkout: </span>
              <span className="text-base font-extrabold text-orange-600">{chargeLabel}</span>
              <span className="text-xs font-medium text-slate-500"> / year</span> */}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Pay securely via Razorpay (UPI / cards / netbanking). Click <b>Pay {chargeLabel} and Sign Up</b> after
              filling the form. See {' '}
              <Link to="/refund-policy" className="font-semibold text-orange-600 hover:text-orange-700">
                Refund &amp; Cancellation Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-sm font-bold text-slate-900">1. Society details</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Use a short, unique code your committee can recognise.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Society Name</label>
              <input name="societyName" className="input" value={form.societyName} onChange={update} placeholder="e.g. Shree Ganesh Residency" maxLength={150} disabled={busy} />
              {fieldErrors.societyName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyName}</p>}
            </div>
            <div>
              <label className="label">Society Code</label>
              <input name="societyCode" className="input" value={form.societyCode} onChange={update} placeholder="SGR-PUNE" maxLength={40} disabled={busy} />
              {fieldErrors.societyCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyCode}</p>}
            </div>
            <div>
              <label className="label">Address</label>
              <input name="address" className="input" value={form.address} onChange={update} maxLength={250} disabled={busy} />
              {fieldErrors.address && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.address}</p>}
            </div>
            <div>
              <label className="label">City</label>
              <input name="city" className="input" value={form.city} onChange={update} maxLength={100} disabled={busy} />
              {fieldErrors.city && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.city}</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">2. Committee administrator</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">This account will manage members, maintenance, expenses and notices.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input name="adminName" className="input" value={form.adminName} onChange={update} maxLength={120} disabled={busy} />
              {fieldErrors.adminName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminName}</p>}
            </div>
            <div>
              <label className="label">Mobile</label>
              <input name="adminMobile" className="input" value={form.adminMobile} onChange={update} inputMode="numeric" placeholder="10-digit mobile" maxLength={10} disabled={busy} />
              {fieldErrors.adminMobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminMobile}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input name="adminEmail" type="email" className="input" value={form.adminEmail} onChange={update} disabled={busy} />
              {fieldErrors.adminEmail && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.adminEmail}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" value={form.password} onChange={update} autoComplete="new-password" placeholder="e.g. Society@123" disabled={busy} />
              <p className="mt-1 text-xs text-slate-500">{SIGNUP_PASSWORD_HINT}</p>
              {fieldErrors.password && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>}
            </div>
          </div>

          <button className="btn-primary w-full !bg-orange-500 !py-3 hover:!bg-orange-600" disabled={busy}>
            {paying
              ? 'Opening Razorpay…'
              : loading
                ? 'Creating workspace…'
                : `Pay Now and Sign Up`}
          </button>
          <p className="text-center text-[11px] leading-4 text-slate-500">
            Secure payments by Razorpay. Workspace access is created only after a successful payment of {chargeLabel}.
          </p>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">
            Sign in to your workspace
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
