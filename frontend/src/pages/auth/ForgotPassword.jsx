import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthService } from '../../api/services'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import { getApiErrorMessage } from '../../utils/apiError'

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
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      const res = await AuthService.forgotPassword({
        societyCode: form.societyCode.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        flatNumber: form.flatNumber.trim(),
        newPassword: form.newPassword,
      })
      setSuccess(res.message || 'Password updated. You can sign in now.')
      setForm(empty)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Society code</label>
            <input name="societyCode" className="input" value={form.societyCode} onChange={update} required placeholder="GOKU-MUMBAI" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input name="email" type="email" className="input" value={form.email} onChange={update} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Mobile</label>
            <input name="mobile" className="input" value={form.mobile} onChange={update} required />
          </div>
          <div>
            <label className="label">Flat number</label>
            <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required placeholder="106" />
          </div>
          <div>
            <label className="label">New password</label>
            <input name="newPassword" type="password" className="input" value={form.newPassword} onChange={update} required minLength={6} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input name="confirmPassword" type="password" className="input" value={form.confirmPassword} onChange={update} required minLength={6} />
          </div>
          <button className="btn-primary w-full !bg-orange-500 !py-3 hover:!bg-orange-600" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">Sign in</Link>
          <br />
          Need help? Ask your secretary to reset password from Members.
        </p>
      </div>
    </AuthShell>
  )
}
