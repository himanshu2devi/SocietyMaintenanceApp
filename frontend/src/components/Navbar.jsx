import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from './Brand'

const publicLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-950'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
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

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm font-medium text-slate-500 lg:inline">
                {user?.fullName}
              </span>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-2">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !px-3.5 !py-2">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !bg-orange-500 !px-3.5 !py-2 hover:!bg-orange-600">
                Start free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <span className="text-lg">{open ? '×' : '☰'}</span>
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {publicLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? '/admin' : '/member'} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My dashboard</Link>
                <button onClick={handleLogout} className="btn-secondary mt-2">Sign out</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary !bg-orange-500 hover:!bg-orange-600">Start free</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
