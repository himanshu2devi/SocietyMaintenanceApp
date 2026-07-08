import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'

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
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Register your society</h1>
          <p className="text-sm text-gray-500">
            This creates your society and your admin account.
          </p>
        </div>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Society Name</label>
              <input name="societyName" className="input" value={form.societyName} onChange={update} required />
            </div>
            <div>
              <label className="label">Society Code</label>
              <input name="societyCode" className="input" value={form.societyCode} onChange={update} required placeholder="GREENVILLE-A" />
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

          <hr className="border-gray-100" />
          <p className="text-sm font-medium text-gray-700">Admin account</p>

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

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create Society & Admin'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
