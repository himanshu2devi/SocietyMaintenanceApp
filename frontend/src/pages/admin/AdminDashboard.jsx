import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getValidToken } from '../../auth/token'
import { PaymentClaimService } from '../../api/services'
import MemberDirectory from './MemberDirectory'
import MaintenanceTracker from './MaintenanceTracker'
import ExpenseLogger from './ExpenseLogger'
import NoticeBoard from './NoticeBoard'
import CommitteeDirectory from './CommitteeDirectory'
import SocietyAccounts from './SocietyAccounts'
import AuditDocuments from './AuditDocuments'
import PaymentClaims from './PaymentClaims'
import ComplaintBoard from '../shared/ComplaintBoard'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '⌂', component: Overview },
  { id: 'members', label: 'Members', icon: '♙', component: MemberDirectory },
  { id: 'committee', label: 'Committee', icon: '★', component: CommitteeDirectory },
  { id: 'maintenance', label: 'Maintenance', icon: '₹', component: MaintenanceTracker },
  { id: 'claims', label: 'Payment claims', icon: '✓', component: PaymentClaims },
  { id: 'accounts', label: 'Bank accounts', icon: '🏦', component: SocietyAccounts },
  { id: 'audit', label: 'Audit reports', icon: '▤', component: AuditDocuments },
  { id: 'expenses', label: 'Expenses', icon: '▣', component: ExpenseLogger },
  { id: 'notices', label: 'Notices & rules', icon: '◉', component: NoticeBoard },
  { id: 'complaints', label: 'Complaints', icon: '⚠', component: ComplaintBoard },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [active, setActive] = useState('overview')
  const [pendingClaims, setPendingClaims] = useState(0)
  const knownCount = useRef(null)

  async function refreshClaimBadge() {
    try {
      const list = await PaymentClaimService.list('SUBMITTED')
      const count = list.length
      if (knownCount.current !== null && count > knownCount.current) {
        const added = count - knownCount.current
        toast.info(`${added} new payment claim${added === 1 ? '' : 's'} from members — review in Payment claims.`)
      }
      knownCount.current = count
      setPendingClaims(count)
    } catch {
      // Keep last known badge if refresh fails
    }
  }

  useEffect(() => {
    refreshClaimBadge()
    const id = window.setInterval(refreshClaimBadge, 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (active === 'claims') refreshClaimBadge()
  }, [active])

  if (!getValidToken()) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/member" replace />

  const ActiveComponent = tabs.find((t) => t.id === active).component

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[.03] lg:min-h-[calc(100dvh-150px)]">
        <div className="border-b border-slate-100 px-3 pb-4 pt-2">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Committee workspace</p>
          <p className="mt-2 break-words text-sm font-bold leading-snug text-slate-900">{user?.societyName || 'Your society'}</p>
          {user?.societyCode && (
            <p className="mt-0.5 break-all text-xs font-semibold text-orange-600">Code · {user.societyCode}</p>
          )}
          <p className="mt-1 break-words text-xs leading-snug text-slate-500">{user?.fullName}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">Admin</p>
        </div>
        <nav
          className="-mx-1 mt-3 flex gap-1 overflow-x-auto overscroll-x-contain px-1 pb-1 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
          aria-label="Committee sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition lg:gap-3 lg:py-3 ${
                active === tab.id ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-base shadow-sm">{tab.icon}</span>
              <span className="whitespace-nowrap lg:flex-1 lg:whitespace-normal">{tab.label}</span>
              {tab.id === 'claims' && pendingClaims > 0 && (
                <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingClaims}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
          <div className="min-w-0">
            <p className="break-words text-xs font-bold uppercase tracking-[.14em] text-orange-600">
              {user?.societyName || 'SocietyWale admin'}
              {user?.societyCode ? ` · ${user.societyCode}` : ''}
            </p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{tabs.find((tab) => tab.id === active).label}</h1>
          </div>
          <p className="shrink-0 text-sm text-slate-500">Committee manages records. Members view and participate securely.</p>
        </div>
        <ActiveComponent
          onNavigate={setActive}
          pendingClaims={pendingClaims}
          onClaimsChanged={refreshClaimBadge}
        />
      </section>
    </div>
  )
}

function Overview({ onNavigate, pendingClaims = 0 }) {
  const steps = [
    ['1', 'Publish committee', 'Add chairman, secretary and treasurer contacts residents can reach.', 'committee'],
    ['2', 'Add bank account', 'Publish account / UPI details so residents know where to pay.', 'accounts'],
    ['3', 'Track maintenance', 'Record dues, review payment claims and keep collections current.', 'maintenance'],
    ['4', 'Handle complaints', 'Track resident issues from open to resolved with clear ownership.', 'complaints'],
  ]

  return (
    <div className="space-y-6">
      {pendingClaims > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-amber-950">
              {pendingClaims} payment claim{pendingClaims === 1 ? '' : 's'} waiting for verification
            </p>
            <p className="mt-1 text-sm text-amber-800/90">
              Members notified after paying. Approve to mark Maintenance paid and keep both views in sync.
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={() => onNavigate('claims')}>
            Review claims
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-[linear-gradient(135deg,#102A43_0%,#173e62_55%,#0f766e_150%)] p-7 text-white sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-orange-300">Operations overview</p>
        <h2 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl">
          Your society command centre for collections, communication and compliance-ready records.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
          Use this workspace to keep member data current, verify payments, publish notices, log expenses, close complaints and prepare AGM-friendly reports — without scattered spreadsheets.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ['Maintenance', 'maintenance'],
            ['Notices', 'notices'],
            ['Complaints', 'complaints'],
          ].map(([label, target]) => (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate(target)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              {label}
            </button>
          ))}
          <a
            href="/reports"
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            Reports
          </a>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map(([number, title, copy, target]) => (
          <article key={number} className="card">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-sm font-extrabold text-orange-600">{number}</span>
            <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            <button onClick={() => onNavigate(target)} className="mt-5 text-sm font-bold text-orange-600 hover:text-orange-700">Open →</button>
          </article>
        ))}
      </div>
    </div>
  )
}
