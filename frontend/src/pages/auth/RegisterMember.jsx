import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import { getApiErrorMessage } from '../../utils/apiError'

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
  const [error, setError] = useState('')

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await registerMember(form)
      navigate('/member')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create member account.'))
    }
  }

  return (
    <AuthShell
      step="Join your society"
      title="Member signup"
      description="Use your society code from the committee. Members can view records and notify payments — only admins can change data."
    >
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Society code</label>
            <input name="societyCode" className="input" value={form.societyCode} onChange={update} required placeholder="e.g. SGR-MUMBAI" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input name="fullName" className="input" value={form.fullName} onChange={update} required />
            </div>
            <div>
              <label className="label">Flat number</label>
              <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input name="mobile" className="input" value={form.mobile} onChange={update} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" value={form.email} onChange={update} required />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" className="input" value={form.password} onChange={update} required minLength={6} />
          </div>
          <button className="btn-primary w-full !bg-orange-500 !py-3 hover:!bg-orange-600" disabled={loading}>
            {loading ? 'Creating account…' : 'Create member account'}
          </button>
        </form>
        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">Sign in</Link>
          {' · '}
          <Link to="/forgot-password" className="font-bold text-orange-600 hover:text-orange-700">Forgot password</Link>
          <br />
          Committee admin?{' '}
          <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">Register a society</Link>
        </p>
      </div>
    </AuthShell>
  )
}
