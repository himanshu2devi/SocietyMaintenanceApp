import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthService } from '../../api/services'
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
  password,
  societyCode,
} from '../../utils/validation'

const empty = {
  societyCode: '',
  email: '',
  mobile: '',
  flatNumber: '',
  newPassword: '',
  confirmPassword: '',
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const errors = collectErrors({
      societyCode: societyCode(form.societyCode),
      email: email(form.email),
      mobile: mobile(form.mobile),
      flatNumber: flatNumber(form.flatNumber),
      newPassword: password(form.newPassword, { label: 'New password' }),
      confirmPassword:
        form.newPassword !== form.confirmPassword
          ? 'New password and confirmation do not match'
          : password(form.confirmPassword, { label: 'Confirm password' }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    setBusy(true)
    try {
      const res = await AuthService.forgotPassword({
        societyCode: form.societyCode.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim().replace(/\s+/g, ''),
        flatNumber: form.flatNumber.trim(),
        newPassword: form.newPassword,
      })
      setSuccess(res.message || 'Password updated. You can sign in now.')
      setForm(empty)
      setFieldErrors({})
      window.setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset password. Check your details.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Verify your society details to set a new password. No email link required — your committee can also reset it from Members."
    >
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label">Society code</label>
            <input name="societyCode" className="input" value={form.societyCode} onChange={update} placeholder="GOKU-MUMBAI" maxLength={40} />
            {fieldErrors.societyCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.societyCode}</p>}
          </div>
          <div>
            <label className="label">Email address</label>
            <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="you@example.com" />
            {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="label">Mobile</label>
            <input name="mobile" className="input" value={form.mobile} onChange={update} inputMode="numeric" maxLength={10} />
            {fieldErrors.mobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mobile}</p>}
          </div>
          <div>
            <label className="label">Flat number</label>
            <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} placeholder="106" maxLength={30} />
            {fieldErrors.flatNumber && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.flatNumber}</p>}
          </div>
          <div>
            <label className="label">New password</label>
            <input name="newPassword" type="password" className="input" value={form.newPassword} onChange={update} autoComplete="new-password" placeholder="At least 6 characters" />
            {fieldErrors.newPassword && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.newPassword}</p>}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input name="confirmPassword" type="password" className="input" value={form.confirmPassword} onChange={update} autoComplete="new-password" />
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>}
          </div>
          <button className="btn-primary w-full !bg-teal-600 !py-3 hover:!bg-teal-700" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800">Sign in</Link>
          <br />
          Need help? Ask your secretary to reset password from Members.
        </p>
      </div>
    </AuthShell>
  )
}
