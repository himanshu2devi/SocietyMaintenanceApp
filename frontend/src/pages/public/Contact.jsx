import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/ui/Feedback'
import {
  collectErrors,
  email,
  firstError,
  hasErrors,
  personName,
  text,
} from '../../utils/validation'
import {
  SITE_EMAIL,
  SITE_PHONES,
  mailtoHref,
  telHref,
  whatsappHref,
} from '../../utils/siteContact'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', society: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSent(false)
    const errors = collectErrors({
      name: personName(form.name, 'Name'),
      email: email(form.email),
      society: text(form.society, 'Society name', { required: false, max: 150 }),
      message: text(form.message, 'Message', { min: 10, max: 2000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }

    setBusy(true)
    const subject = form.society.trim()
      ? `SocietyWale enquiry — ${form.society.trim()}`
      : 'SocietyWale enquiry'
    const lines = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
    ]
    if (form.society.trim()) lines.push(`Society: ${form.society.trim()}`)
    lines.push('', form.message.trim())
    const body = lines.join('\n')

    // Opens the user's email app with a ready-to-send message to SocietyWale.
    window.location.href = mailtoHref(subject, body)
    setSent(true)
    setBusy(false)
  }

  return (
    <div className="w-full min-w-0">
      <section className="border-b border-slate-200 bg-[#fff9f6]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            We’re here to help your society get digital.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base">
            Questions about onboarding, committee roles or member access? Email us, call us, or send a message — we’ll respond as soon as we can.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:py-20">
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Email</p>
            <a
              className="mt-2 block break-all text-sm font-semibold text-slate-900 transition hover:text-orange-600"
              href={mailtoHref('SocietyWale enquiry')}
            >
              {SITE_EMAIL}
            </a>
            <p className="mt-1 text-sm text-slate-500">Typical reply within 1–2 business days.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Call / WhatsApp</p>
            <ul className="mt-3 space-y-3">
              {SITE_PHONES.map((phone) => (
                <li key={phone.digits} className="flex flex-wrap items-center gap-3">
                  <a className="text-sm font-semibold text-slate-900 transition hover:text-orange-600" href={telHref(phone.digits)}>
                    +91 {phone.label}
                  </a>
                  <a
                    className="text-xs font-bold uppercase tracking-wide text-emerald-700 hover:text-emerald-800"
                    href={whatsappHref(phone.digits, 'Hello SocietyWale, I have a question about the product.')}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-500">Available for onboarding help and product questions.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Support</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950">Committee onboarding</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create a workspace, add members, publish bank details and start tracking maintenance in one afternoon.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            Looking for legal details? Read our{' '}
            <Link className="font-semibold text-orange-600 hover:text-orange-700" to="/terms">Terms</Link>
            {', '}
            <Link className="font-semibold text-orange-600 hover:text-orange-700" to="/privacy">Privacy Policy</Link>
            {' '}and{' '}
            <Link className="font-semibold text-orange-600 hover:text-orange-700" to="/refund-policy">Refund &amp; Cancellation Policy</Link>.
          </p>
        </div>

        <div className="card min-w-0 w-full">
          <h2 className="text-lg font-extrabold text-slate-950">Send a message</h2>
          <p className="mt-1 break-words text-sm text-slate-500">
            Submit the form to open your email app with a ready message to {SITE_EMAIL}.
          </p>
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
            {sent && (
              <Alert type="success">
                Your email app should open next. If it does not, write to us at {SITE_EMAIL} or call +91 {SITE_PHONES[0].label}.
              </Alert>
            )}
          </div>
          <form onSubmit={handleSubmit} className="mt-2 space-y-4" noValidate>
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" value={form.name} onChange={update} placeholder="Your name" maxLength={120} />
              {fieldErrors.name && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="you@example.com" />
              {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="label">Society name (optional)</label>
              <input name="society" className="input" value={form.society} onChange={update} placeholder="Gokuldham Society" maxLength={150} />
              {fieldErrors.society && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.society}</p>}
            </div>
            <div>
              <label className="label">Message</label>
              <textarea name="message" className="input" rows="4" value={form.message} onChange={update} placeholder="How can we help?" maxLength={2000} />
              {fieldErrors.message && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.message}</p>}
            </div>
            <button className="btn-primary w-full !bg-orange-500 hover:!bg-orange-600" disabled={busy}>
              {busy ? 'Opening email…' : 'Send message'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
