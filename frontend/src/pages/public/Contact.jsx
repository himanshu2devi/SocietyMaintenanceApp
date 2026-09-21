import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Feedback'
import { identityApi } from '../../api/client'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  collectErrors,
  email,
  firstError,
  hasErrors,
  mobile,
  personName,
  text,
} from '../../utils/validation'
import { SITE_EMAIL, mailtoHref } from '../../utils/siteContact'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    society: '',
    city: '',
    preferredPeriod: '',
    message: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSent(false)
    const errors = collectErrors({
      name: personName(form.name, 'Name'),
      email: email(form.email),
      mobile: mobile(form.mobile),
      society: text(form.society, 'Society name', { required: false, max: 150 }),
      city: text(form.city, 'City', { required: false, max: 80 }),
      message: text(form.message, 'Requirements', { min: 10, max: 2000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }

    setBusy(true)
    try {
      await identityApi.post('/payments/contact-enquiry', {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim().replace(/\s+/g, ''),
        societyName: form.society.trim() || null,
        city: form.city.trim() || null,
        preferredPeriod: form.preferredPeriod || null,
        message: form.message.trim(),
      })
      setSent(true)
      setForm({
        name: '',
        email: '',
        mobile: '',
        society: '',
        city: '',
        preferredPeriod: '',
        message: '',
      })
    } catch (err) {
      setError(getApiErrorMessage(err, `Could not send enquiry. Email us at ${SITE_EMAIL}.`))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full min-w-0">
      <section className="border-b border-slate-200 bg-[#f0fdfa]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <p className="eyebrow">Get in touch</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Tell us about your society — we&apos;ll finalise pricing with you.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base">
            Share your details and expectations. Our team will contact you by email to discuss requirements, agree an amount,
            and whether you want 3 months, 6 months, or 1 year. Payment happens only on SocietySimplify after that.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:py-20">
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">Email</p>
            <a
              className="mt-2 block break-all text-sm font-semibold text-slate-900 transition hover:text-teal-700"
              href={mailtoHref('SocietySimplify pricing enquiry')}
            >
              {SITE_EMAIL}
            </a>
            <p className="mt-1 text-sm text-slate-500">Enquiries from this form are delivered here.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">How it works</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-slate-600">
              <li>Send your enquiry below.</li>
              <li>We discuss requirements and agree amount + plan (3 months / 6 months / 1 year).</li>
              <li>Complete payment on SocietySimplify signup/renew pages via Razorpay only.</li>
            </ol>
            <p className="mt-3 text-sm text-slate-600">
              Ready to pay after discussion?{' '}
              <Link className="font-semibold text-teal-700" to="/register">
                Open payment &amp; signup
              </Link>
            </p>
          </div>
        </div>

        <div className="card min-w-0 w-full">
          <h2 className="text-lg font-extrabold text-slate-950">Request a custom plan</h2>
          <p className="mt-1 break-words text-sm text-slate-500">
            Your enquiry is emailed to SocietySimplify immediately (when mail is enabled).
          </p>
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
            {sent && (
              <Alert type="success">
                Enquiry sent. We will reply by email shortly at the address you provided.
              </Alert>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-2 space-y-4" noValidate>
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" value={form.name} onChange={update} placeholder="Your name" maxLength={120} />
              {fieldErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="you@example.com" />
                {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="label">Mobile</label>
                <input
                  name="mobile"
                  className="input"
                  value={form.mobile}
                  onChange={update}
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
                {fieldErrors.mobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mobile}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Society name (optional)</label>
                <input name="society" className="input" value={form.society} onChange={update} placeholder="Gokuldham Society" maxLength={150} />
              </div>
              <div>
                <label className="label">City (optional)</label>
                <input name="city" className="input" value={form.city} onChange={update} placeholder="Pune" maxLength={80} />
              </div>
            </div>
            <div>
              <label className="label">Preferred period (optional)</label>
              <select name="preferredPeriod" className="input" value={form.preferredPeriod} onChange={update}>
                <option value="">Not sure yet</option>
                <option value="QUARTERLY">3 months</option>
                <option value="SIX_MONTHS">6 months</option>
                <option value="YEARLY">1 year</option>
              </select>
            </div>
            <div>
              <label className="label">Requirements / expectations</label>
              <textarea
                name="message"
                className="input"
                rows="4"
                value={form.message}
                onChange={update}
                placeholder="Number of flats, features you need, timeline, budget expectations…"
                maxLength={2000}
              />
              {fieldErrors.message && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.message}</p>}
            </div>
            <button className="btn-primary w-full !bg-teal-600 hover:!bg-teal-700" disabled={busy}>
              {busy ? 'Sending…' : 'Send enquiry'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
