import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Alert } from '../../components/ui/Feedback'

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
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500">Log in to your society account.</p>
        </div>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={update}
              required
              placeholder="admin@society.com"
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
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          New society?{' '}
          <Link to="/register" className="font-medium text-brand-600">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
