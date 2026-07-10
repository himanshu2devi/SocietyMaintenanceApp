import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getValidToken } from '../../auth/token'
import MemberDirectory from './MemberDirectory'
import MaintenanceTracker from './MaintenanceTracker'
import ExpenseLogger from './ExpenseLogger'
import NoticeBoard from './NoticeBoard'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '⌂', component: Overview },
  { id: 'members', label: 'Members', icon: '♙', component: MemberDirectory },
  { id: 'maintenance', label: 'Maintenance', icon: '₹', component: MaintenanceTracker },
  { id: 'expenses', label: 'Expenses', icon: '▤', component: ExpenseLogger },
  { id: 'notices', label: 'Notices & rules', icon: '◉', component: NoticeBoard },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')

  // Defense in depth: the router guards this page and the API enforces RBAC;
  // this protects direct component use as well.
  if (!getValidToken()) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/member" replace />

  const ActiveComponent = tabs.find((t) => t.id === active).component

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[.03] lg:min-h-[calc(100vh-150px)]">
        <div className="border-b border-slate-100 px-3 pb-4 pt-2">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Committee workspace</p>
          <p className="mt-2 truncate text-sm font-bold text-slate-900">{user?.fullName}</p>
          <p className="mt-0.5 text-xs text-slate-500">Administrator access</p>
        </div>
        <nav className="mt-3 grid gap-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActive(tab.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === tab.id ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-base shadow-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 rounded-xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-orange-300">Need help?</p>
          <p className="mt-2 text-sm font-semibold">Set up your society in minutes.</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Add members first, then begin tracking their maintenance.</p>
        </div>
      </aside>
      <section className="min-w-0">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">SocietyWale admin</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{tabs.find((tab) => tab.id === active).label}</h1>
          </div>
          <p className="text-sm text-slate-500">Your committee workspace is private and role controlled.</p>
        </div>
        <ActiveComponent onNavigate={setActive} />
      </section>
    </div>
  )
}

function Overview({ onNavigate }) {
  const steps = [
    ['1', 'Add your members', 'Create the resident directory flat by flat.', 'members'],
    ['2', 'Record maintenance', 'Add paid and pending maintenance for each flat.', 'maintenance'],
    ['3', 'Keep members informed', 'Publish notices, rules and financial updates.', 'notices'],
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[linear-gradient(135deg,#102A43_0%,#173e62_55%,#0f766e_150%)] p-7 text-white sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-300">A clear place to start</p>
        <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight sm:text-3xl">Set up the essentials once. Keep your society work organised every month.</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200">SocietyWale is designed around the daily jobs a committee actually does — no complex configuration needed.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(([number, title, copy, target]) => (
          <article key={number} className="card">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-sm font-extrabold text-orange-600">{number}</span>
            <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            <button onClick={() => onNavigate(target)} className="mt-5 text-sm font-bold text-orange-600 hover:text-orange-700">Open {title.toLowerCase()} →</button>
          </article>
        ))}
      </div>
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Financial discipline</p>
        <h3 className="mt-2 text-lg font-bold text-slate-950">Review your income, expenses and collection status from one reporting view.</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Once maintenance and expenses are recorded, reports are available for the committee to review and share.</p>
        <button onClick={() => onNavigate('maintenance')} className="btn-secondary mt-5 !py-2">Go to maintenance</button>
      </div>
    </div>
  )
}
