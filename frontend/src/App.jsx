import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SeoManager from './components/SeoManager'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToHash from './components/ScrollToHash'
import IdleLogoutWatcher from './components/IdleLogoutWatcher'

import Home from './pages/public/Home'
import About from './pages/public/About'
import Contact from './pages/public/Contact'
import Terms from './pages/public/Terms'
import Privacy from './pages/public/Privacy'
import RefundPolicy from './pages/public/RefundPolicy'
import Login from './pages/auth/Login'
import RegisterSociety from './pages/auth/RegisterSociety'
import RegisterMember from './pages/auth/RegisterMember'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import MemberDashboard from './pages/member/MemberDashboard'
import FinancialReports from './pages/reports/FinancialReports'
import SocietyAnalytics from './pages/admin/SocietyAnalytics'
import Profile from './pages/Profile'
import AiAssistant from './components/AiAssistant'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <SeoManager />
      <ScrollToHash />
      <IdleLogoutWatcher />
      <Navbar />
      <main className="flex-1" id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/login" element={<AuthPage><Login /></AuthPage>} />
          <Route path="/forgot-password" element={<AuthPage><ForgotPassword /></AuthPage>} />
          <Route path="/register" element={<AuthPage><RegisterSociety /></AuthPage>} />
          <Route path="/register-member" element={<AuthPage><RegisterMember /></AuthPage>} />

          <Route
            path="/profile"
            element={
              <AppPage>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </AppPage>
            }
          />

          <Route
            path="/admin/*"
            element={
              <AppPage>
                <ProtectedRoute requireRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              </AppPage>
            }
          />

          <Route
            path="/member"
            element={
              <AppPage>
                <ProtectedRoute requireRole="MEMBER">
                  <MemberDashboard />
                </ProtectedRoute>
              </AppPage>
            }
          />

          <Route
            path="/reports"
            element={
              <AppPage>
                <ProtectedRoute>
                  <FinancialReports />
                </ProtectedRoute>
              </AppPage>
            }
          />

          <Route
            path="/analytics"
            element={
              <AppPage>
                <ProtectedRoute requireRole="ADMIN">
                  <SocietyAnalytics />
                </ProtectedRoute>
              </AppPage>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <AiAssistant />
    </div>
  )
}

function AppPage({ children }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
}

function AuthPage({ children }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
}
