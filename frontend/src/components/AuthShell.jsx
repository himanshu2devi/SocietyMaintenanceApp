import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getValidToken } from '../auth/token'

export default function AuthShell({ children, title, description, step }) {
  const { user } = useAuth()

  if (user && getValidToken()) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />
  }

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100dvh-72px)] lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.15fr)]">
      {/* Sticky viewport-height panel so signup/login left rail stays uniform when the form is tall */}
      <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:sticky lg:top-[72px] lg:block lg:h-[calc(100dvh-72px)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(13,148,136,.28),transparent_24%),radial-gradient(circle_at_88%_82%,rgba(15,118,110,.2),transparent_29%)]" />
        <div className="relative mx-auto flex h-full max-w-md flex-col px-8 py-10 xl:px-10 xl:py-12">
          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <h1 className="text-3xl font-extrabold leading-tight xl:text-4xl">
              Better everyday operations begin with one clear workspace.
            </h1>
            <div className="mt-8 space-y-5 border-l border-white/15 pl-5 text-sm leading-6 text-slate-300 xl:mt-10">
              <p><b className="text-white">For committees.</b> Keep collection, expenses and updates organised.</p>
              <p><b className="text-white">For members.</b> Give residents simple access to what matters.</p>
              <p><b className="text-white">For Indian societies.</b> Local-first support, built to be easy to adopt.</p>
            </div>
          </div>
          <p className="mt-8 shrink-0 text-xs text-slate-500">Secure account access · Role-based workspace</p>
        </div>
      </aside>
      <section className="flex min-w-0 items-start justify-center bg-[#fffaf7] px-3 py-6 sm:px-6 sm:py-10 lg:items-center lg:px-6 lg:py-12">
        <div className="w-full max-w-lg min-w-0">
          {step && <p className="mb-2 break-words text-xs font-bold uppercase tracking-[.14em] text-teal-700 sm:mb-3">{step}</p>}
          <h1 className="break-words text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl md:text-3xl">{title}</h1>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600 sm:mt-3">{description}</p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/[.04] sm:mt-6 sm:rounded-3xl sm:p-6 md:p-8">
            {children}
          </div>
        </div>
      </section>
    </div>
  )
}
