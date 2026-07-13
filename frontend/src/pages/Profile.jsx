import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function Profile() {
  const { user, isAdmin } = useAuth()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#102A43_0%,#173e62_55%,#0f766e_150%)] px-6 py-8 text-white sm:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-xl font-extrabold tracking-wide">
              {initials(user?.fullName)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-300">
                {isAdmin ? 'Committee admin' : 'Society member'}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{user?.fullName || 'Profile'}</h1>
              <p className="mt-1 text-sm text-slate-200">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          <Field label="Mobile" value={user?.mobile ? `+91 ${user.mobile}` : '—'} />
          <Field label="Flat / unit" value={user?.flatNumber || (isAdmin ? 'Committee' : '—')} />
          <Field label="Society" value={user?.societyName || '—'} />
          <Field label="Society code" value={user?.societyCode || 'Sign out and sign in again to refresh'} />
          <Field label="Role" value={isAdmin ? 'ADMIN' : 'MEMBER'} />
          <Field label="Workspace" value="SocietyWale" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to={isAdmin ? '/admin' : '/member'} className="btn-primary">
          Back to dashboard
        </Link>
        <Link to="/contact" className="btn-secondary">
          Need help?
        </Link>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="bg-white px-5 py-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
