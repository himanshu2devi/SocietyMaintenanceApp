import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getValidToken } from '../auth/token'

export default function ProtectedRoute({ children, requireRole }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !getValidToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/member'} replace />
  }
  return children
}
