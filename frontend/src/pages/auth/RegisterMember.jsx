import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SocietyService } from '../../api/services'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  collectErrors,
  email,
  firstError,
  flatNumber,
  hasErrors,
  mobile,
  personName,
  societyCode,
  signupPassword,
  SIGNUP_PASSWORD_HINT,
} from '../../utils/validation'

const initial = {
  societyCode: '',
  fullName: '',
  email: '',
  mobile: '',
  flatNumber: '',
  password: '',
}

export default function RegisterMember() {
  const { registerMember, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [societies, setSocieties] = useState([])
  const [societiesLoading, setSocietiesLoading] = useState(true)
  const [societiesError, setSocietiesError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSocietiesLoading(true)
      setSocietiesError('')
      try {
        const data = await SocietyService.listOptions()
        if (!cancelled) setSocieties(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) {
          setSocieties([])
          setSocietiesError(getApiErrorMessage(err, 'Could not load societies. Refresh and try again.'))
        }
      } finally {
        if (!cancelled) setSocietiesLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const selectedSociety = useMemo(
    () => societies.find((s) => s.societyCode === form.societyCode) || null,
    [societies, form.societyCode],
  )

  function update(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      societyCode: societyCode(form.societyCode),
      fullName: personName(form.fullName),
      email: email(form.email),
      mobile: mobile(form.mobile),
      flatNumber: flatNumber(form.flatNumber),
      password: signupPassword(form.password),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    try {
      await registerMember({
        societyCode: form.societyCode.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim().replace(/\s+/g, ''),
        flatNumber: form.flatNumber.trim(),
        password: form.password,
      })
      navigate('/member')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create member account.'))
    }
  }

  return (
    <AuthShell
      step="Join your society"
      title="Member signup"
      description="Select your society code from the list. Members can view records and notify payments — only admins can change data."
    >
      <div className="space-y-5">
        <Alert type="error">{error || societiesError}</Alert>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="min-w-0">
            <label className="label" htmlFor="societyCode">Society code</label>
            <select
              id="societyCode"
              name="societyCode"
              className="input max-w-full"
              value={form.societyCode}
              onChange={update}
              disabled={societiesLoading || !!societiesError}
            >
              <option value="">
                {societiesLoading ? 'Loading societies…' : 'Select your society'}
              </option>
              {societies.map((s) => (
                <option key={s.societyCode} value={s.societyCode}>
                  {s.societyCode}
                </option>
              ))}
            </select>
            {selectedSociety && (
              <p className="mt-2 break-words rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-950">{selectedSociety.societyName}</span>
              </p>
            )}
            {!societiesLoading && !societiesError && societies.length === 0 && (
              <p className="mt-1 text-xs font-medium text-amber-700">No societies are available yet. Ask your committee to register first.</p>
            )}
            {fieldErrors.societyCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyCode}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" className="input max-w-full" value={form.fullName} onChange={update} maxLength={120} autoComplete="name" />
              {fieldErrors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.fullName}</p>}
            </div>
            <div className="min-w-0">
              <label className="label" htmlFor="flatNumber">Flat number</label>
              <input id="flatNumber" name="flatNumber" className="input max-w-full" value={form.flatNumber} onChange={update} maxLength={30} />
              <p className="mt-1 text-xs text-slate-500">Must be unique in your society (e.g. A-101).</p>
              {fieldErrors.flatNumber && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.flatNumber}</p>}
            </div>
            <div className="min-w-0">
              <label className="label" htmlFor="mobile">Mobile</label>
              <input id="mobile" name="mobile" className="input max-w-full" value={form.mobile} onChange={update} inputMode="numeric" placeholder="10-digit mobile" maxLength={10} autoComplete="tel" />
              {fieldErrors.mobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mobile}</p>}
            </div>
            <div className="min-w-0">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input max-w-full" value={form.email} onChange={update} autoComplete="email" />
              {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
            </div>
          </div>
          <div className="min-w-0">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="input max-w-full" value={form.password} onChange={update} autoComplete="new-password" placeholder="e.g. Member@123" />
            <p className="mt-1 break-words text-xs text-slate-500">{SIGNUP_PASSWORD_HINT}</p>
            {fieldErrors.password && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>}
          </div>
          <button className="btn-primary w-full !bg-teal-600 !py-3 hover:!bg-teal-700" disabled={loading || societiesLoading}>
            {loading ? 'Creating account…' : 'Create member account'}
          </button>
        </form>
        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800">Sign in</Link>
          {' · '}
          <Link to="/forgot-password" className="font-bold text-teal-700 hover:text-teal-800">Forgot password</Link>
          <br />
          Committee admin?{' '}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800">Register a society</Link>
        </p>
      </div>
    </AuthShell>
  )
}
