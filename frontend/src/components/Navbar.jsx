import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from './Brand'
import { homeRouteForRole } from './ProtectedRoute'
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
  const { isAuthenticated, isAdmin, isPlatformAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadNotices, setUnreadNotices] = useState(0)
  const [navHidden, setNavHidden] = useState(false)
  const knownUnread = useRef(null)
  const profileRef = useRef(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    setOpen(false)
    setProfileOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!isAuthenticated || isAdmin || isPlatformAdmin) {
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
  }, [isAuthenticated, isAdmin, isPlatformAdmin, user?.id])

  useEffect(() => {
    function onDocClick(e) {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Hide header on scroll down / show on scroll up; close mobile menu while scrolling
  useEffect(() => {
    lastScrollY.current = window.scrollY

    function onScroll() {
      const y = window.scrollY
      const delta = y - lastScrollY.current

      if (Math.abs(delta) < 6) return

      if (y < 48) {
        setNavHidden(false)
      } else if (delta > 0) {
        setNavHidden(true)
        setOpen(false)
        setProfileOpen(false)
      } else {
        setNavHidden(false)
      }

      lastScrollY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent background scroll while mobile menu is open
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function handleLogout() {
    logout()
    setProfileOpen(false)
    setOpen(false)
    navigate('/login')
  }

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header
      className={`sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-out ${
        navHidden && !open ? '-translate-y-full' : 'translate-y-0'
      }`}
      role="banner"
    >
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-6">
        <div className="min-w-0 flex-1 overflow-hidden pr-1 sm:flex-none sm:pr-0">
          <Brand />
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} className={navClass()}>
              {l.label}
            </Link>
          ))}

          {isAuthenticated && (
            <Link to={homeRouteForRole(user?.role)} className={navClass()}>
              Dashboard
            </Link>
          )}
          {isAuthenticated && !isPlatformAdmin && (
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

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              {!isAdmin && !isPlatformAdmin && (
                <Link
                  to="/member"
                  state={{ focusNotices: true }}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                  aria-label={unreadNotices > 0 ? `${unreadNotices} unread notices` : 'Notices'}
                  title="Notices"
                >
                  🔔
                  {unreadNotices > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white">
                      {unreadNotices > 9 ? '9+' : unreadNotices}
                    </span>
                  )}
                </Link>
              )}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex max-w-[220px] items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:bg-slate-50"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-600 text-xs font-extrabold text-white">
                    {initials(user?.fullName)}
                  </span>
                  <span className="hidden truncate text-sm font-semibold text-slate-800 xl:inline">
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
                      <p className="truncate text-xs text-slate-500">
                        {isPlatformAdmin ? 'Platform admin' : isAdmin ? 'Committee admin' : 'Member'}
                      </p>
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
              <Link to="/register" className="btn-primary !bg-teal-600 !px-3.5 !py-2 hover:!bg-teal-700">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated && !isAdmin && !isPlatformAdmin && (
            <Link
              to="/member"
              state={{ focusNotices: true }}
              className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700"
              aria-label={unreadNotices > 0 ? `${unreadNotices} unread notices` : 'Notices'}
            >
              🔔
              {unreadNotices > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white">
                  {unreadNotices > 9 ? '9+' : unreadNotices}
                </span>
              )}
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/profile"
              className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-xs font-extrabold text-white"
              aria-label="Profile"
            >
              {initials(user?.fullName)}
            </Link>
          )}
          <button
            type="button"
            className={`nav-burger grid h-10 w-10 place-items-center rounded-xl border transition ${
              open ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-700'
            }`}
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
          >
            <span className="nav-burger-icon" data-open={open ? 'true' : 'false'} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`nav-backdrop lg:hidden ${open ? 'nav-backdrop-open' : ''}`}
        onClick={closeMenu}
        aria-hidden={!open}
      />

      {/* Mobile / tablet panel */}
      <div
        id="mobile-nav-panel"
        className={`nav-panel border-t border-slate-100 bg-white lg:hidden ${open ? 'nav-panel-open' : ''}`}
        aria-hidden={!open}
      >
        <nav className="mx-auto flex max-h-[min(70dvh,520px)] max-w-7xl flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4" aria-label="Mobile">
          {publicLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className="rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-800 active:scale-[0.99]"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <div className="my-2 border-t border-slate-100" />
              <Link to="/profile" onClick={closeMenu} className="rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-800">
                My profile
              </Link>
              <Link to={homeRouteForRole(user?.role)} onClick={closeMenu} className="rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-800">
                My dashboard
              </Link>
              {!isPlatformAdmin && (
                <Link to="/reports" onClick={closeMenu} className="rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-800">
                  Reports
                </Link>
              )}
              {isAdmin && (
                <Link to="/analytics" onClick={closeMenu} className="rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-800">
                  Analytics
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="btn-secondary mt-3 w-full">
                Sign out
              </button>
            </>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={closeMenu} className="btn-secondary">
                Sign in
              </Link>
              <Link to="/register" onClick={closeMenu} className="btn-primary !bg-teal-600 hover:!bg-teal-700">
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
