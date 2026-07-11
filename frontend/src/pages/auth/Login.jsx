import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'ADMIN' ? '/admin' : '/member')
    } catch (err) {
      if (!err.response) {
        setError('The authentication service is offline. Start the Identity Service on port 8081, then try again.')
      } else {
        setError(err.response.data?.message || 'Login failed. Check your email and password.')
      }
    }
  }

  return (
    <AuthShell title="Welcome back" description="Sign in to manage your society workspace or view your member updates.">
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={update}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              className="input"
              value={form.password}
              onChange={update}
              required
              placeholder="••••••••"
            />
            <p className="mt-2 text-right text-sm">
              <Link to="/forgot-password" className="font-semibold text-orange-600 hover:text-orange-700">
                Forget/Reset Password?
              </Link>
            </p>
          </div>
          <button className="btn-primary w-full !bg-orange-500 !py-3 hover:!bg-orange-600" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Setting up a new society?{' '}
          <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">
            Create your workspace
          </Link>
          <br />
          Society resident?{' '}
          <Link to="/register-member" className="font-bold text-orange-600 hover:text-orange-700">
            Member signup
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
