import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'

import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Login from './pages/auth/Login'
import RegisterSociety from './pages/auth/RegisterSociety'
import RegisterMember from './pages/auth/RegisterMember'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import MemberDashboard from './pages/member/MemberDashboard'
import FinancialReports from './pages/reports/FinancialReports'

export default function App() {
  const location = useLocation()
  const isMarketingPage = ['/', '/about', '/contact'].includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className={`flex-1 ${isMarketingPage ? '' : 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8'}`}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<RegisterSociety />} />
          <Route path="/register-member" element={<RegisterMember />} />

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
      {isMarketingPage && <Footer />}
    </div>
  )
}
