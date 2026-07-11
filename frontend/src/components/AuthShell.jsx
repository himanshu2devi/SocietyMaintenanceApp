import { Brand } from './Brand'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getValidToken } from '../auth/token'

export default function AuthShell({ children, title, description, step }) {
  const { user } = useAuth()

  if (user && getValidToken()) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />
  }

  return (
    <div className="-my-6 grid min-h-[calc(100vh-72px)] lg:grid-cols-[.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,122,69,.28),transparent_24%),radial-gradient(circle_at_88%_82%,rgba(15,157,138,.2),transparent_29%)]" />
        <div className="relative mx-auto flex h-full max-w-md flex-col">
          <Brand light />
          <div className="my-auto">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">SocietyWale workspace</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight">Better everyday operations begin with one clear workspace.</h1>
            <div className="mt-10 space-y-5 border-l border-white/15 pl-5 text-sm leading-6 text-slate-300">
              <p><b className="text-white">For committees.</b> Keep collection, expenses and updates organised.</p>
              <p><b className="text-white">For members.</b> Give residents simple access to what matters.</p>
              <p><b className="text-white">For Indian societies.</b> Local-first support, built to be easy to adopt.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Secure account access · Role-based workspace</p>
        </div>
      </aside>
      <section className="flex items-center justify-center bg-[#fffaf7] px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden"><Brand /></div>
          {step && <p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-orange-600">{step}</p>}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[.04] sm:p-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
