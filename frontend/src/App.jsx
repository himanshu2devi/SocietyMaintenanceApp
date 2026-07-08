import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Login from './pages/auth/Login'
import RegisterSociety from './pages/auth/RegisterSociety'
import AdminDashboard from './pages/admin/AdminDashboard'
import MemberDashboard from './pages/member/MemberDashboard'
import FinancialReports from './pages/reports/FinancialReports'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterSociety />} />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Member */}
          <Route
            path="/member"
            element={
              <ProtectedRoute requireRole="MEMBER">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared authenticated */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <FinancialReports />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
