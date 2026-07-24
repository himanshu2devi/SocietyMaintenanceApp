import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  AuditDocumentService,
  BankAccountService,
  CommitteeService,
  MaintenanceBillingService,
  MaintenanceRateService,
  MaintenanceService,
  NoticeService,
  PaymentClaimService,
  RuleService,
} from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { getApiErrorMessage } from '../../utils/apiError'
import { inr, monthName, whatsappLink, formatNoticeDate } from '../../utils/share'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ComplaintBoard from '../shared/ComplaintBoard'

const now = new Date()

function formatPaymentMode(mode) {
  if (!mode) return '—'
  const value = String(mode).toUpperCase()
  if (value === 'CASH') return 'Cash'
  if (value === 'ONLINE' || value === 'BANK_TRANSFER' || value === 'UPI' || value === 'NEFT') return 'Online'
  return mode
}

function periodLabel(item) {
  const month = item.billingMonth
  const year = item.billingYear
  if (!month || !year) return '—'
  return `${monthName(month)} ${year}`
}

function sameFlat(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()
}

function periodKey(year, month) {
  return Number(year) * 100 + Number(month)
}

function effectiveAmountFor(rates, year, month) {
  const target = periodKey(year, month)
  const applicable = rates
    .filter((r) => periodKey(r.effectiveFromYear, r.effectiveFromMonth) <= target)
    .sort((a, b) => periodKey(b.effectiveFromYear, b.effectiveFromMonth) - periodKey(a.effectiveFromYear, a.effectiveFromMonth))
  return applicable[0] || null
}

const emptyClaimForm = {
  billingYear: now.getFullYear(),
  billingMonth: now.getMonth() + 1,
  paymentMode: 'ONLINE',
  referenceNumber: '',
}

export default function MemberDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [charges, setCharges] = useState([])
  const [rates, setRates] = useState([])
  const [resolvedDue, setResolvedDue] = useState(null)
  const [notices, setNotices] = useState([])
  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [committee, setCommittee] = useState([])
  const [docs, setDocs] = useState([])
  const [claims, setClaims] = useState([])
  const [claimForm, setClaimForm] = useState(emptyClaimForm)
  const [claimBusy, setClaimBusy] = useState(false)
  const [showClaimForm, setShowClaimForm] = useState(true)
  const [error, setError] = useState('')
  const [unreadNotices, setUnreadNotices] = useState(0)
  const knownUnread = useRef(null)
  const noticesSectionRef = useRef(null)

  async function refreshUnreadNotices({ toastOnIncrease = true } = {}) {
    try {
      const res = await NoticeService.unreadCount()
      const count = Number(res?.count || 0)
      if (toastOnIncrease && knownUnread.current !== null && count > knownUnread.current) {
        const added = count - knownUnread.current
        toast.info(`${added} new society notice${added === 1 ? '' : 's'} from committee.`)
      }
      knownUnread.current = count
      setUnreadNotices(count)
    } catch {
      // Keep last known badge if refresh fails
    }
  }

  async function load() {
    try {
      const [c, n, r, a, com, d, cl, rateList] = await Promise.all([
        MaintenanceService.list(),
        NoticeService.list(),
        RuleService.list(),
        BankAccountService.list(),
        CommitteeService.list(),
        AuditDocumentService.list(),
        PaymentClaimService.list(),
        MaintenanceRateService.list(),
      ])
      setCharges(c.filter((x) => sameFlat(x.flatNumber, user?.flatNumber)))
      setNotices(n)
      setRules(r)
      setAccounts(a)
      setCommittee(com)
      setDocs(d)
      setClaims(cl)
      setRates(rateList)
      await refreshUnreadNotices({ toastOnIncrease: false })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load member workspace.'))
    }
  }

  useEffect(() => { if (user) load() }, [user])

  useEffect(() => {
    if (!user) return undefined
    let cancelled = false
    MaintenanceBillingService.resolve(
      Number(claimForm.billingYear),
      Number(claimForm.billingMonth),
      { memberId: user.id, flatNumber: user.flatNumber },
    )
      .then((res) => {
        if (!cancelled) setResolvedDue(res)
      })
      .catch(() => {
        if (!cancelled) setResolvedDue(null)
      })
    return () => { cancelled = true }
  }, [user, claimForm.billingYear, claimForm.billingMonth])

  useEffect(() => {
    if (!user) return undefined
    const id = window.setInterval(() => refreshUnreadNotices(), 30000)
    return () => window.clearInterval(id)
  }, [user])

  useEffect(() => {
    if (location.state?.focusNotices) {
      openNotices()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  async function openNotices() {
    noticesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (unreadNotices <= 0) return
    try {
      await NoticeService.markRead()
      setUnreadNotices(0)
      knownUnread.current = 0
      setNotices((prev) => prev.map((n) => ({ ...n, unread: false })))
    } catch {
      // Banner can retry on next poll
    }
  }

  const pending = charges.filter((c) => c.status === 'PENDING')
  const submittedPeriods = useMemo(
    () => new Set(
      claims
        .filter((c) => c.status === 'SUBMITTED')
        .map((c) => `${c.billingYear}-${c.billingMonth}`),
    ),
    [claims],
  )
  const pendingClaims = claims.filter((c) => c.status === 'SUBMITTED')
  const selectedRate = effectiveAmountFor(rates, claimForm.billingYear, claimForm.billingMonth)
  const selectedCharge = charges.find(
    (c) => Number(c.billingYear) === Number(claimForm.billingYear)
      && Number(c.billingMonth) === Number(claimForm.billingMonth),
  )
  const displayAmount = selectedCharge
    ? Number(selectedCharge.amount)
    : (resolvedDue?.configured && resolvedDue?.amount != null
      ? Number(resolvedDue.amount)
      : (selectedRate ? Number(selectedRate.amount) : null))
  const amountReady = displayAmount != null && displayAmount > 0
  const selectedPeriodKey = `${claimForm.billingYear}-${claimForm.billingMonth}`
  const alreadyClaimed = submittedPeriods.has(selectedPeriodKey)
  const alreadyPaid = selectedCharge?.status === 'PAID'

  async function downloadMaintenanceReceipt(charge) {
    try {
      const blob = await MaintenanceService.downloadReceipt(charge.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SocietyWale-Maintenance-Receipt-${charge.flatNumber || 'flat'}-${charge.billingYear}${String(charge.billingMonth).padStart(2, '0')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Receipt downloaded.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download receipt.'))
    }
  }

  async function submitClaim(e) {
    e.preventDefault()
    if (!user?.flatNumber) {
      toast.error('Your profile is missing a flat number. Contact committee.')
      return
    }
    if (!claimForm.paymentMode) {
      toast.error('Select mode of payment (Cash or Online).')
      return
    }
    if (claimForm.paymentMode === 'ONLINE' && !String(claimForm.referenceNumber || '').trim()) {
      toast.error('Enter UTR / reference number for online payments.')
      return
    }
    if (alreadyPaid) {
      toast.error('This period is already marked paid.')
      return
    }
    if (alreadyClaimed) {
      toast.error('A claim is already awaiting committee review for this period.')
      return
    }
    setClaimBusy(true)
    try {
      await PaymentClaimService.submit({
        billingYear: Number(claimForm.billingYear),
        billingMonth: Number(claimForm.billingMonth),
        paymentMode: claimForm.paymentMode,
        referenceNumber: claimForm.referenceNumber?.trim() || null,
        chargeId: selectedCharge?.id || null,
      })
      setClaimForm({ ...emptyClaimForm, paymentMode: claimForm.paymentMode })
      toast.success('Payment claim sent. Committee will verify and update Maintenance.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not submit payment claim.'))
    } finally {
      setClaimBusy(false)
    }
  }

  function startClaimForCharge(charge) {
    setClaimForm({
      billingYear: charge.billingYear,
      billingMonth: charge.billingMonth,
      paymentMode: 'ONLINE',
      referenceNumber: '',
    })
    setShowClaimForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function notifyAdminWhatsApp(charge) {
    const text = [
      `Hello Committee,`,
      `I have paid maintenance for flat ${user?.flatNumber}.`,
      `Period: ${charge.billingMonth}/${charge.billingYear}`,
      `Amount: ₹${Number(charge.amount).toLocaleString('en-IN')}`,
      `Please verify and mark as paid.`,
      `- ${user?.fullName}`,
    ].join('\n')
    window.open(whatsappLink(text), '_blank')
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[.03]">
        <div className="bg-[linear-gradient(135deg,#102A43_0%,#173e62_55%,#0f766e_140%)] px-4 py-5 text-white sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-xs font-bold uppercase tracking-[.14em] text-orange-300">
                {user?.societyName || 'My society'}
                {user?.societyCode ? ` · ${user.societyCode}` : ''}
              </p>
              <h1 className="mt-3 break-words text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">{user?.fullName || 'Member'}</h1>
              <p className="mt-1 text-sm text-slate-200">Resident access · view records and notify payments</p>
            </div>
            <button
              type="button"
              onClick={openNotices}
              className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
              aria-label={unreadNotices > 0 ? `${unreadNotices} unread notices` : 'Notices'}
              title="Notices"
            >
              🔔
              {unreadNotices > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white">
                  {unreadNotices > 9 ? '9+' : unreadNotices}
                </span>
              )}
            </button>
          </div>
          <div className="mt-4">
            <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Flat {user?.flatNumber || '—'}
            </span>
          </div>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
          <div className="min-w-0 bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 break-all text-sm font-semibold text-slate-900">{user?.email || '—'}</p>
          </div>
          <div className="min-w-0 bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{user?.mobile || '—'}</p>
          </div>
          <div className="min-w-0 bg-white px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Flat</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">{user?.flatNumber || '—'}</p>
          </div>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {unreadNotices > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">{unreadNotices} new notice{unreadNotices === 1 ? '' : 's'} from committee.</p>
              <p className="mt-1 text-sky-900/80">Open Latest Notices to review the announcement.</p>
            </div>
            <button type="button" className="btn-primary w-full shrink-0 !bg-sky-700 hover:!bg-sky-800 sm:w-auto" onClick={openNotices}>
              View notices
            </button>
          </div>
        </div>
      )}

      {pendingClaims.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">{pendingClaims.length} payment claim{pendingClaims.length === 1 ? '' : 's'} awaiting committee verification.</p>
          <p className="mt-1 text-amber-800/80">Maintenance stays pending until the secretary / admin approves your claim.</p>
        </div>
      )}

      <div className="card border-orange-100 bg-gradient-to-br from-white to-orange-50/50">
        <SectionTitle
          title="Claim payment"
          subtitle="Tell committee you have paid. They will verify and mark Maintenance paid."
          action={
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setShowClaimForm((v) => !v)}>
              {showClaimForm ? 'Hide form' : 'Claim payment'}
            </button>
          }
        />
        {showClaimForm && (
          <form onSubmit={submitClaim} className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                value={claimForm.billingYear}
                onChange={(e) => setClaimForm({ ...claimForm, billingYear: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="label">Month</label>
              <select
                className="input"
                value={claimForm.billingMonth}
                onChange={(e) => setClaimForm({ ...claimForm, billingMonth: Number(e.target.value) })}
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mode of payment</label>
              <select
                className="input"
                value={claimForm.paymentMode}
                onChange={(e) => setClaimForm({ ...claimForm, paymentMode: e.target.value })}
                required
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="label">
                UTR / reference {claimForm.paymentMode === 'ONLINE' ? '' : '(optional)'}
              </label>
              <input
                className="input"
                placeholder={claimForm.paymentMode === 'ONLINE' ? 'Enter UTR / reference' : 'Optional'}
                value={claimForm.referenceNumber}
                onChange={(e) => setClaimForm({ ...claimForm, referenceNumber: e.target.value })}
                required={claimForm.paymentMode === 'ONLINE'}
              />
            </div>
            <div className="sm:col-span-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-600">
              {alreadyPaid ? (
                <span className="font-semibold text-emerald-700">This period is already paid.</span>
              ) : alreadyClaimed ? (
                <span className="font-semibold text-amber-700">Claim already submitted — waiting for admin approval.</span>
              ) : amountReady ? (
                <>Amount for {monthName(claimForm.billingMonth)} {claimForm.billingYear}: <strong>{inr(displayAmount)}</strong></>
              ) : (
                <span className="text-amber-700">
                  {resolvedDue?.billingMode === 'VARIABLE'
                    ? 'Your flat amount is not set yet. Ask committee to set your default maintenance amount first.'
                    : 'No society rate for this month yet. Ask committee to set maintenance amount first.'}
                </span>
              )}
            </div>
            <button
              className="btn-primary sm:col-span-2"
              disabled={claimBusy || alreadyPaid || alreadyClaimed || !amountReady}
            >
              {claimBusy ? 'Submitting…' : 'Submit payment claim'}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-gray-500">Pending Dues</p><p className="mt-1 text-2xl font-bold text-amber-600">{pending.length}</p></div>
        <div className="card"><p className="text-sm text-gray-500">My Records</p><p className="mt-1 text-2xl font-bold">{charges.length}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Notices</p><p className="mt-1 text-2xl font-bold text-orange-600">{notices.length}</p></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <SectionTitle title="My Maintenance" subtitle="Status stays in sync after claim approval" />
          <div className="table-scroll">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payment mode</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => {
                  const claimed = submittedPeriods.has(`${c.billingYear}-${c.billingMonth}`)
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{periodLabel(c)}</td>
                      <td className="py-2 pr-4">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={c.status} />
                        {c.status === 'PENDING' && claimed && (
                          <p className="mt-1 text-[11px] font-medium text-amber-700">Claim submitted</p>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {c.status === 'PAID' ? formatPaymentMode(c.paymentMode) : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-2">
                          {c.status === 'PAID' && (
                            <button
                              type="button"
                              className="btn-secondary !py-1.5 !text-xs"
                              onClick={() => downloadMaintenanceReceipt(c)}
                            >
                              Download receipt
                            </button>
                          )}
                          {c.status === 'PENDING' && !claimed && (
                            <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={() => startClaimForCharge(c)}>
                              Claim payment
                            </button>
                          )}
                          {c.status === 'PENDING' && (
                            <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => notifyAdminWhatsApp(c)}>WhatsApp</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {charges.length === 0 && <tr><td colSpan="5" className="py-6 text-center text-gray-400">No maintenance records yet. Use Claim payment above for the current month.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Society bank accounts" subtitle="Pay here — online payment coming later" />
          <div className="space-y-3">
            {accounts.map((a) => (
              <article key={a.id} className="rounded-xl border border-slate-100 p-4">
                <p className="font-bold break-words">{a.accountName}{a.primaryAccount ? ' · Primary' : ''}</p>
                <p className="mt-1 break-words text-sm text-slate-600">{a.bankName}</p>
                <p className="mt-2 break-all text-sm">A/C {a.accountNumber}</p>
                <p className="break-all text-sm">IFSC {a.ifscCode}</p>
                {a.upiId && <p className="break-all text-sm">UPI {a.upiId}</p>}
              </article>
            ))}
            {accounts.length === 0 && <p className="text-sm text-gray-400">Committee has not published bank details yet.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <SectionTitle title="Committee contacts" />
          <ul className="space-y-3">
            {committee.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-100 p-3">
                <p className="font-semibold break-words">{m.fullName}</p>
                <p className="text-xs uppercase tracking-wide text-orange-600">{m.title.replaceAll('_', ' ')}</p>
                <p className="mt-1 break-words text-sm text-slate-600">{m.mobile || '—'}{m.email ? ` · ${m.email}` : ''}</p>
              </li>
            ))}
            {committee.length === 0 && <p className="text-sm text-gray-400">No committee contacts published.</p>}
          </ul>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Audit reports" subtitle="View / download only" action={<Link to="/reports" className="text-sm font-bold text-orange-600">Financial reports →</Link>} />
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold break-words">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.periodType} · {doc.periodMonth ? `${monthName(doc.periodMonth)} ` : ''}{doc.periodYear}</p>
                </div>
                <a className="btn-secondary w-full !py-1.5 !text-xs sm:w-auto" href={doc.documentUrl} target="_blank" rel="noreferrer">Download</a>
              </li>
            ))}
            {docs.length === 0 && <p className="text-sm text-gray-400">No audit files yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card min-w-0">
        <SectionTitle
          title="My payment claims"
          subtitle="Submitted to committee · status stays in sync with Maintenance after approval"
        />
        <div className="table-scroll">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{periodLabel(c)}</td>
                  <td className="py-2 pr-4">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-4">{formatPaymentMode(c.paymentMode)}</td>
                  <td className="break-all py-2 pr-4">{c.referenceNumber || '—'}</td>
                  <td className="py-2 pr-4"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-400">
                    No claims yet. Use <span className="font-semibold text-slate-600">Claim payment</span> above after you pay.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0" ref={noticesSectionRef}>
          <SectionTitle
            title="Latest Notices"
            subtitle={unreadNotices > 0 ? `${unreadNotices} unread` : undefined}
            action={
              unreadNotices > 0 ? (
                <button type="button" className="text-sm font-bold text-orange-600" onClick={openNotices}>
                  Mark as read
                </button>
              ) : null
            }
          />
          <ul className="space-y-3">
            {notices.slice(0, 5).map((n) => (
              <li key={n.id} className={`rounded-lg border p-3 ${n.unread ? 'border-sky-200 bg-sky-50/60' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="min-w-0 font-semibold break-words">
                    {n.title}
                    {n.unread && <span className="ml-2 text-[11px] font-bold uppercase tracking-wide text-sky-700">New</span>}
                  </h4>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">{formatNoticeDate(n.createdAt)}</span>
                </div>
                <p className="mt-1 break-words text-sm text-gray-600">{n.body}</p>
              </li>
            ))}
            {notices.length === 0 && <p className="text-sm text-gray-400">No notices yet.</p>}
          </ul>
        </div>
        <div className="card min-w-0">
          <SectionTitle title="Society Rules" />
          <ul className="grid gap-3">
            {rules.map((r) => (
              <li key={r.id} className="rounded-lg border border-gray-100 p-3">
                <span className="badge bg-orange-50 text-orange-700">{r.category}</span>
                <h4 className="mt-1 font-semibold break-words">{r.title}</h4>
                <p className="mt-1 break-words text-sm text-gray-600">{r.ruleText}</p>
              </li>
            ))}
            {rules.length === 0 && <p className="text-sm text-gray-400">No rules yet.</p>}
          </ul>
        </div>
      </div>

      <ComplaintBoard />
    </div>
  )
}
