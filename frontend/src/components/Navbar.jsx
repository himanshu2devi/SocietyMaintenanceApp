import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from './Brand'
import { NoticeService } from '../api/services'

const publicLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
]

function navClass() {
  return 'rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950'
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadNotices, setUnreadNotices] = useState(0)
  const knownUnread = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setUnreadNotices(0)
      knownUnread.current = null
      return undefined
    }

    let cancelled = false
    async function refresh() {
      try {
        const res = await NoticeService.unreadCount()
        if (cancelled) return
        const count = Number(res?.count || 0)
        knownUnread.current = count
        setUnreadNotices(count)
      } catch {
        // Keep last known count
      }
    }

    refresh()
    const id = window.setInterval(refresh, 30000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [isAuthenticated, isAdmin, user?.id])

  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function handleLogout() {
    logout()
    setProfileOpen(false)
    navigate('/login')
  }

  function goToMemberNotices() {
    setOpen(false)
    navigate('/member', { state: { focusNotices: true } })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl" role="banner">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} className={navClass()}>
              {l.label}
            </Link>
          ))}

          {isAuthenticated && (
            <Link to={isAdmin ? '/admin' : '/member'} className={navClass()}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/reports" className={navClass()}>
              Reports
            </Link>
          )}
          {isAuthenticated && isAdmin && (
            <Link to="/analytics" className={navClass()}>
              Analytics
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <button
                  type="button"
                  onClick={goToMemberNotices}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  aria-label={unreadNotices > 0 ? `${unreadNotices} unread notices` : 'Notices'}
                  title="Notices"
                >
                  🔔
                  {unreadNotices > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                      {unreadNotices > 9 ? '9+' : unreadNotices}
                    </span>
                  )}
                </button>
              )}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-xs font-extrabold text-white">
                    {initials(user?.fullName)}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-sm font-semibold text-slate-800 lg:inline">
                    {user?.fullName || 'Profile'}
                  </span>
                </button>
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-slate-950">{user?.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{isAdmin ? 'Committee admin' : 'Member'}</p>
                    </div>
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !px-3.5 !py-2">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !bg-orange-500 !px-3.5 !py-2 hover:!bg-orange-600">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && !isAdmin && (
            <button
              type="button"
              onClick={goToMemberNotices}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700"
              aria-label={unreadNotices > 0 ? `${unreadNotices} unread notices` : 'Notices'}
            >
              🔔
              {unreadNotices > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
                  {unreadNotices > 9 ? '9+' : unreadNotices}
                </span>
              )}
            </button>
          )}
          {isAuthenticated && (
            <Link
              to="/profile"
              className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-xs font-extrabold text-white"
              aria-label="Profile"
            >
              {initials(user?.fullName)}
            </Link>
          )}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            <span className="text-lg">{open ? '×' : '☰'}</span>
          </button>
        </div>
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
                <Link to="/profile" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  My profile
                </Link>
                <Link to={isAdmin ? '/admin' : '/member'} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">My dashboard</Link>
                <Link to="/reports" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reports</Link>
                {isAdmin && (
                  <Link to="/analytics" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Analytics</Link>
                )}
                <button onClick={handleLogout} className="btn-secondary mt-2">Sign out</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary">Sign in</Link>
                <Link to="/register-member" onClick={() => setOpen(false)} className="btn-primary !bg-orange-500 hover:!bg-orange-600">Member signup</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
