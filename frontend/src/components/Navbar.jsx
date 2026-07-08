import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
]

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg ${
      isActive ? 'text-brand-700 bg-brand-50' : 'text-gray-600 hover:text-brand-600'
    }`

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">S</span>
          SocietyHub
        </Link>

        <nav className="flex items-center gap-1">
          {publicLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end>
              {l.label}
            </NavLink>
          ))}

          {isAuthenticated && (
            <NavLink to={isAdmin ? '/admin' : '/member'} className={linkClass}>
              Dashboard
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/reports" className={linkClass}>
              Reports
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-gray-500 sm:inline">
                {user?.fullName} · {user?.role}
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register Society
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
