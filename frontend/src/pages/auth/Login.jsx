import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'
import AuthShell from '../../components/AuthShell'
import { homeRouteForRole } from '../../components/ProtectedRoute'
import { collectErrors, email, firstError, hasErrors, password } from '../../utils/validation'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      email: email(form.email),
      password: password(form.password),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    try {
      const user = await login(form.email.trim(), form.password)
      navigate(homeRouteForRole(user.role))
    } catch (err) {
      if (!err.response) {
        setError('The authentication service is offline. Please try again shortly.')
      } else {
        setError(err.response.data?.message || 'Login failed. Check your email and password.')
      }
    }
  }

  return (
    <AuthShell title="Welcome back" description="Sign in to manage your society workspace or view your member updates.">
      <div className="space-y-5">
        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label">Email address</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={update}
              autoComplete="email"
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              className="input"
              value={form.password}
              onChange={update}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            {fieldErrors.password && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>}
            <p className="mt-2 text-right text-sm">
              <Link to="/forgot-password" className="font-semibold text-teal-700 hover:text-teal-800">
                Forget/Reset Password?
              </Link>
            </p>
          </div>
          <button className="btn-primary w-full !bg-teal-600 !py-3 hover:!bg-teal-700" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
          Setting up a new society?{' '}
          <Link to="/contact" className="font-bold text-teal-700 hover:text-teal-800">
            Get in touch
          </Link>
          {' · '}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800">
            Pay &amp; sign up
          </Link>
          <br />
          Subscription expired?{' '}
          <Link to="/renew" className="font-bold text-teal-700 hover:text-teal-800">
            Renew
          </Link>
          <br />
          Society resident?{' '}
          <Link to="/register-member" className="font-bold text-teal-700 hover:text-teal-800">
            Member signup
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
