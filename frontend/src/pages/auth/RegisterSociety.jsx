import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'

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

export default function RegisterSociety() {
  const { registerSociety, loading } = useAuth()
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
      await registerSociety(form)
      navigate('/admin')
    } catch (err) {
      if (!err.response) {
        setError('The authentication service is offline. Start the Identity Service on port 8081, then try again.')
      } else {
        setError(err.response.data?.message || 'Registration could not be completed. Please review the details and try again.')
      }
    }
  }

  return (
    <AuthShell step="Set up your workspace" title="Create your society account" description="Start with your society details and the first committee administrator. You can add members after setup.">
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-sm font-bold text-slate-900">1. Society details</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Use a short, unique code your committee can recognise.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Society Name</label>
              <input name="societyName" className="input" value={form.societyName} onChange={update} required placeholder="e.g. Shree Ganesh Residency" />
            </div>
            <div>
              <label className="label">Society Code</label>
              <input name="societyCode" className="input" value={form.societyCode} onChange={update} required placeholder="SGR-SATARA" />
            </div>
            <div>
              <label className="label">Address</label>
              <input name="address" className="input" value={form.address} onChange={update} />
            </div>
            <div>
              <label className="label">City</label>
              <input name="city" className="input" value={form.city} onChange={update} />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">2. Committee administrator</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">This account will manage members, maintenance, expenses and notices.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name</label>
              <input name="adminName" className="input" value={form.adminName} onChange={update} required />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input name="adminMobile" className="input" value={form.adminMobile} onChange={update} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="adminEmail" type="email" className="input" value={form.adminEmail} onChange={update} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" value={form.password} onChange={update} required minLength={6} />
            </div>
          </div>

          <button className="btn-primary w-full !bg-orange-500 !py-3 hover:!bg-orange-600" disabled={loading}>
            {loading ? 'Creating workspace…' : 'Create SocietyWale Workspace →'}
          </button>
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
