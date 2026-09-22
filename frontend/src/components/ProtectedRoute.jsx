import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getValidToken } from '../auth/token'

/** Home route for each role, used when a guard sends the user back. */
export function homeRouteForRole(role) {
  if (role === 'PLATFORM_ADMIN') return '/platform'
  if (role === 'ADMIN') return '/admin'
  return '/member'
}

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !getValidToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={homeRouteForRole(user?.role)} replace />
  }
  return children
}
