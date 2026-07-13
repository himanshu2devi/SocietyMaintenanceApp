import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ComplaintService,
  ExpenseService,
  MaintenanceRateService,
  MaintenanceService,
  MemberService,
  NoticeService,
  PaymentClaimService,
  ReportService,
} from '../../api/services'
import { Alert } from '../../components/ui/Feedback'
import { getApiErrorMessage } from '../../utils/apiError'
import { inr, monthName } from '../../utils/share'

const now = new Date()
const CHART_H = 160
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i)

function greeting() {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(fullName = '') {
  const part = String(fullName).trim().split(/\s+/)[0]
  return part || 'Admin'
}

function shortInr(value) {
  const n = Number(value || 0)
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return inr(n)
}

function periodKey(year, month) {
  return Number(year) * 100 + Number(month)
}

function effectiveAmountFor(rates, year, month) {
  const target = periodKey(year, month)
  const applicable = (rates || [])
    .filter((r) => periodKey(r.effectiveFromYear, r.effectiveFromMonth) <= target)
    .sort((a, b) => periodKey(b.effectiveFromYear, b.effectiveFromMonth) - periodKey(a.effectiveFromYear, a.effectiveFromMonth))
  return applicable[0] || null
}

function barPx(value, max, chartH = CHART_H) {
  const n = Number(value || 0)
  if (!max || max <= 0) return 6
  return Math.max(6, Math.round((n / max) * chartH))
}

export default function SocietyAnalytics() {
  const { user, isAdmin } = useAuth()
  const [view, setView] = useState('monthly') // monthly | yearly
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [charges, setCharges] = useState([])
  const [expenses, setExpenses] = useState([])
  const [claims, setClaims] = useState([])
  const [complaints, setComplaints] = useState([])
  const [notices, setNotices] = useState([])
  const [members, setMembers] = useState([])
  const [rates, setRates] = useState([])
  const [monthly, setMonthly] = useState(null)
  const [annual, setAnnual] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [c, e, cl, cp, n, m, rateList, mon, ann] = await Promise.all([
        MaintenanceService.list(),
        ExpenseService.list(),
        PaymentClaimService.list(),
        ComplaintService.list(),
        NoticeService.list(),
        MemberService.list(),
        MaintenanceRateService.list(),
        ReportService.monthly(year, month),
        ReportService.annual(year, 0),
      ])
      setCharges(c || [])
      setExpenses(e || [])
      setClaims(cl || [])
      setComplaints(cp || [])
      setNotices(n || [])
      setMembers(m || [])
      setRates(rateList || [])
      setMonthly(mon)
      setAnnual(ann)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load analytics.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Reload whenever admin changes year/month so dashboards stay in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const stats = useMemo(() => {
    const periodRate = effectiveAmountFor(rates, year, month)
    const rateAmount = periodRate ? Number(periodRate.amount) : 0

    const activeMembers = members.filter((mem) => mem.active !== false && String(mem.role || '').toUpperCase() !== 'ADMIN')
    // Prefer unique flats when available; otherwise member count.
    const flatSet = new Set(
      activeMembers.map((mem) => String(mem.flatNumber || '').trim().toLowerCase()).filter(Boolean),
    )
    const billedUnits = flatSet.size || activeMembers.length
    const expectedFromRate = rateAmount > 0 && billedUnits > 0 ? rateAmount * billedUnits : 0

    const monthCharges = charges.filter(
      (c) => Number(c.billingYear) === year && Number(c.billingMonth) === month,
    )
    const yearCharges = charges.filter((c) => Number(c.billingYear) === year)

    const paidFlatsMonth = monthCharges.filter((c) => String(c.status).toUpperCase() === 'PAID').length
    const pendingFlatsMonth = monthCharges.filter((c) => String(c.status).toUpperCase() === 'PENDING').length
    const recordedMonth = paidFlatsMonth + pendingFlatsMonth

    const collectedAmt = Number(monthly?.maintenanceCollected || 0)
    const pendingAmt = Number(monthly?.maintenancePending || 0)
    const expenseAmt = Number(monthly?.totalExpenses || 0)

    // Prefer recorded dues; fall back to scheduled rate × units when admin set a default amount.
    const expectedCollection = recordedMonth > 0
      ? collectedAmt + pendingAmt
      : expectedFromRate
    const collectedPct = expectedCollection > 0
      ? Math.min(100, Math.round((collectedAmt / expectedCollection) * 100))
      : (recordedMonth ? Math.round((paidFlatsMonth / recordedMonth) * 100) : 0)

    const yearCollected = Number(annual?.totalIncome || 0)
    const yearExpenses = Number(annual?.totalExpenses || 0)
    const yearPending = Number(annual?.pendingDues || 0)
    const yearPaidFlats = yearCharges.filter((c) => String(c.status).toUpperCase() === 'PAID').length
    const yearPendingFlats = yearCharges.filter((c) => String(c.status).toUpperCase() === 'PENDING').length
    const yearExpected = yearCollected + yearPending
    const yearCollectedPct = yearExpected > 0
      ? Math.min(100, Math.round((yearCollected / yearExpected) * 100))
      : 0

    const onTrack = view === 'yearly'
      ? yearCollected >= yearExpenses
      : collectedAmt >= expenseAmt

    const byMonth = new Map(
      (annual?.monthlyLines || []).map((line) => [
        Number(line.month),
        {
          month: Number(line.month),
          income: Number(line.income || 0),
          expenses: Number(line.expenses || 0),
          net: Number(line.net || 0),
        },
      ]),
    )
    const monthBars = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      return byMonth.get(m) || { month: m, income: 0, expenses: 0, net: 0 }
    })
    const maxBar = Math.max(1, ...monthBars.map((b) => Math.max(b.income, b.expenses)))

    const periodComplaints = complaints.filter((c) => {
      const d = c.createdAt ? new Date(c.createdAt) : null
      if (!d || Number.isNaN(d.getTime())) return true
      if (view === 'yearly') return d.getFullYear() === year
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    const openComplaints = periodComplaints.filter((c) =>
      ['OPEN', 'IN_PROGRESS'].includes(String(c.status || '').toUpperCase()),
    ).length
    const resolvedComplaints = periodComplaints.filter((c) =>
      ['RESOLVED', 'CLOSED'].includes(String(c.status || '').toUpperCase()),
    ).length

    const periodClaims = claims.filter((c) => {
      if (Number(c.billingYear) === year) {
        return view === 'yearly' || Number(c.billingMonth) === month
      }
      const d = c.createdAt ? new Date(c.createdAt) : null
      if (!d || Number.isNaN(d.getTime())) return false
      return view === 'yearly'
        ? d.getFullYear() === year
        : d.getFullYear() === year && d.getMonth() + 1 === month
    })
    const pendingClaims = periodClaims.filter((c) => String(c.status).toUpperCase() === 'SUBMITTED').length

    const periodNotices = notices.filter((n) => {
      const d = n.createdAt ? new Date(n.createdAt) : null
      if (!d || Number.isNaN(d.getTime())) return false
      return view === 'yearly'
        ? d.getFullYear() === year
        : d.getFullYear() === year && d.getMonth() + 1 === month
    })

    const expenseBreakdown = (monthly?.expenseBreakdown || [])
      .map((row) => ({
        category: row.category || 'Other',
        amount: Number(row.amount || 0),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
    const maxExpenseCat = Math.max(1, ...expenseBreakdown.map((e) => e.amount))

    const recentExpenses = [...expenses]
      .filter((ex) => {
        const d = ex.expenseDate || ex.createdAt
        if (!d) return false
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return false
        return view === 'yearly'
          ? dt.getFullYear() === year
          : dt.getFullYear() === year && dt.getMonth() + 1 === month
      })
      .sort((a, b) => String(b.expenseDate || b.createdAt || '').localeCompare(String(a.expenseDate || a.createdAt || '')))
      .slice(0, 5)

    const displayCollected = view === 'yearly' ? yearCollected : collectedAmt
    const displayPending = view === 'yearly' ? yearPending : pendingAmt
    const displayExpenses = view === 'yearly' ? yearExpenses : expenseAmt
    const displayPct = view === 'yearly' ? yearCollectedPct : collectedPct
    const displayPendingFlats = view === 'yearly' ? yearPendingFlats : pendingFlatsMonth
    const displayPaidFlats = view === 'yearly' ? yearPaidFlats : paidFlatsMonth
    const mixTotal = Math.max(1, displayCollected + displayPending + displayExpenses)

    return {
      rateAmount,
      billedUnits,
      expectedFromRate,
      expectedCollection: view === 'yearly' ? yearExpected : expectedCollection,
      collectedAmt: displayCollected,
      pendingAmt: displayPending,
      expenseAmt: displayExpenses,
      collectedPct: displayPct,
      pendingFlats: displayPendingFlats,
      paidFlats: displayPaidFlats,
      onTrack,
      monthBars,
      maxBar,
      openComplaints,
      resolvedComplaints,
      pendingClaims,
      activeMembers: members.filter((mem) => mem.active !== false).length,
      noticeCount: periodNotices.length,
      recentExpenses,
      expenseBreakdown: view === 'monthly' ? expenseBreakdown : [],
      maxExpenseCat,
      mixTotal,
      net: displayCollected - displayExpenses,
    }
  }, [charges, expenses, claims, complaints, notices, members, rates, monthly, annual, year, month, view])

  if (!isAdmin) return <Navigate to="/member" replace />

  const periodLabel = view === 'yearly' ? `Year ${year}` : `${monthName(month)} ${year}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">
            {user?.societyName || 'Society'} analytics
            {user?.societyCode ? ` · ${user.societyCode}` : ''}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Live, period-based overview synced with maintenance, expenses, claims and complaints.
          </p>
        </div>
        <button type="button" className="btn-secondary shrink-0" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                view === 'monthly' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setView('monthly')}
            >
              Monthly view
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                view === 'yearly' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setView('yearly')}
            >
              Yearly view
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Year</label>
              <select className="input w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {view === 'monthly' && (
              <div>
                <label className="label">Month</label>
                <select className="input w-40" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{monthName(m)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{periodLabel}</span>
          {stats.rateAmount > 0 && view === 'monthly' && (
            <> · Society maintenance amount {inr(stats.rateAmount)} × {stats.billedUnits} flat{stats.billedUnits === 1 ? '' : 's'}</>
          )}
        </p>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0b1220_0%,#102A43_48%,#0f766e_160%)] p-5 text-white shadow-xl shadow-slate-900/20 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Committee overview</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {greeting()}, {firstName(user?.fullName)}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {periodLabel} · {user?.societyName || 'Your society'}
            </p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-orange-300">⌂</div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric value={loading ? '—' : `${stats.collectedPct}%`} label="Collected" />
          <Metric value={loading ? '—' : shortInr(stats.collectedAmt)} label={view === 'yearly' ? 'Year total' : 'This month'} />
          <Metric value={loading ? '—' : String(stats.pendingFlats)} label="Pending flats" />
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {view === 'yearly' ? 'Collections this year' : 'Collections this month'}
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {loading ? '—' : inr(stats.collectedAmt)}
              </p>
              {view === 'monthly' && stats.expectedCollection > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Expected {inr(stats.expectedCollection)}
                  {stats.rateAmount > 0 ? ` (rate ${inr(stats.rateAmount)} / flat)` : ''}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                stats.onTrack ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {stats.onTrack ? 'On track' : 'Watch expenses'}
            </span>
          </div>

          <div className="mt-5 flex items-end gap-2" style={{ height: CHART_H }}>
            {stats.monthBars.map((bar) => {
              const h = barPx(bar.income, stats.maxBar)
              const isCurrent = view === 'monthly' && Number(bar.month) === month
              return (
                <div key={bar.month} className="group relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`w-full rounded-t-md transition ${
                      isCurrent ? 'bg-orange-500' : 'bg-orange-200 group-hover:bg-orange-300'
                    }`}
                    style={{ height: `${h}px` }}
                    title={`${monthName(bar.month)}: ${inr(bar.income)}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex gap-2">
            {stats.monthBars.map((bar) => (
              <span key={`l-${bar.month}`} className="flex-1 text-center text-[10px] font-semibold text-slate-400">
                {monthName(bar.month).slice(0, 1)}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Month-wise maintenance income for {year}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">Collection progress</h3>
          <p className="mt-1 text-sm text-slate-500">
            {view === 'yearly' ? 'Paid vs pending for the year' : 'Paid vs pending for selected month'}
          </p>
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing value={loading ? 0 : stats.collectedPct} />
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <LegendDot color="bg-orange-500" label="Paid flats" value={loading ? '—' : stats.paidFlats} />
              <LegendDot color="bg-slate-200" label="Pending flats" value={loading ? '—' : stats.pendingFlats} />
              <LegendDot
                color="bg-sky-500"
                label="Maintenance rate"
                value={loading ? '—' : (stats.rateAmount > 0 ? inr(stats.rateAmount) : 'Not set')}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-950">Income vs expenses ({year})</h3>
              <p className="mt-1 text-sm text-slate-500">Updates when you change year</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" /> Income
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-teal-600" /> Expenses
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-end gap-1.5 sm:gap-2" style={{ height: CHART_H }}>
            {stats.monthBars.map((bar) => (
              <div key={`cmp-${bar.month}`} className="flex h-full flex-1 items-end justify-center gap-0.5">
                <div
                  className={`w-[45%] max-w-[14px] rounded-t-md ${
                    view === 'monthly' && bar.month === month ? 'bg-orange-600' : 'bg-orange-500'
                  }`}
                  style={{ height: `${barPx(bar.income, stats.maxBar)}px` }}
                  title={`${monthName(bar.month)} income: ${inr(bar.income)}`}
                />
                <div
                  className="w-[45%] max-w-[14px] rounded-t-md bg-teal-600"
                  style={{ height: `${barPx(bar.expenses, stats.maxBar)}px` }}
                  title={`${monthName(bar.month)} expenses: ${inr(bar.expenses)}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5 sm:gap-2">
            {stats.monthBars.map((bar) => (
              <span key={`cmp-l-${bar.month}`} className="flex-1 text-center text-[10px] font-semibold text-slate-400">
                {monthName(bar.month).slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">Money mix · {periodLabel}</h3>
          <p className="mt-1 text-sm text-slate-500">Collected, pending dues and expenses</p>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full w-full">
              <div className="bg-orange-500" style={{ width: `${(stats.collectedAmt / stats.mixTotal) * 100}%` }} />
              <div className="bg-amber-400" style={{ width: `${(stats.pendingAmt / stats.mixTotal) * 100}%` }} />
              <div className="bg-teal-600" style={{ width: `${(stats.expenseAmt / stats.mixTotal) * 100}%` }} />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MiniStat label="Collected" value={loading ? '—' : inr(stats.collectedAmt)} color="bg-orange-500" />
            <MiniStat label="Pending" value={loading ? '—' : inr(stats.pendingAmt)} color="bg-amber-400" />
            <MiniStat label="Expenses" value={loading ? '—' : inr(stats.expenseAmt)} color="bg-teal-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">
            {view === 'monthly' ? 'Expense categories' : 'Period snapshot'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {view === 'monthly' ? `Breakdown for ${monthName(month)} ${year}` : `Key totals for ${year}`}
          </p>
          {view === 'monthly' ? (
            <ul className="mt-5 space-y-3">
              {stats.expenseBreakdown.map((row) => (
                <li key={row.category}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-slate-800">{row.category}</span>
                    <span className="font-bold text-slate-950">{inr(row.amount)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-600"
                      style={{ width: `${Math.max(4, (row.amount / stats.maxExpenseCat) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
              {!loading && stats.expenseBreakdown.length === 0 && (
                <p className="text-sm text-slate-400">No expenses in this month yet.</p>
              )}
            </ul>
          ) : (
            <ul className="mt-5 space-y-3 text-sm">
              <PulseRow label="Expected dues (paid + pending)" value={loading ? '—' : inr(stats.expectedCollection)} />
              <PulseRow label="Net surplus / deficit" value={loading ? '—' : inr(stats.net)} />
              <PulseRow label="Maintenance rate (selected month ref.)" value={loading ? '—' : (stats.rateAmount > 0 ? inr(stats.rateAmount) : 'Not set')} />
              <PulseRow label="Billable flats / members" value={loading ? '—' : String(stats.billedUnits)} />
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending dues" value={loading ? '—' : inr(stats.pendingAmt)} hint={`${stats.pendingFlats} flats awaiting payment`} />
        <StatCard label="Expenses" value={loading ? '—' : inr(stats.expenseAmt)} hint={periodLabel} />
        <StatCard label="Payment claims" value={loading ? '—' : String(stats.pendingClaims)} hint="Waiting for review in period" />
        <StatCard label="Open complaints" value={loading ? '—' : String(stats.openComplaints)} hint={`${stats.resolvedComplaints} resolved / closed`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">Society pulse · {periodLabel}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <PulseRow label="Active members" value={loading ? '—' : String(stats.activeMembers)} />
            <PulseRow label="Flats paid" value={loading ? '—' : String(stats.paidFlats)} />
            <PulseRow label="Notices in period" value={loading ? '—' : String(stats.noticeCount)} />
            <PulseRow label="Net" value={loading ? '—' : inr(stats.net)} />
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-950">Recent expenses · {periodLabel}</h3>
          <ul className="mt-4 space-y-3">
            {stats.recentExpenses.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{ex.category || 'Expense'}</p>
                  <p className="truncate text-xs text-slate-500">{ex.description || ex.notes || 'Logged expense'}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-slate-800">{inr(ex.amount)}</p>
              </li>
            ))}
            {!loading && stats.recentExpenses.length === 0 && (
              <p className="text-sm text-slate-400">No expenses in this period yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ value }) {
  const size = 108
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f97316"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xl font-extrabold text-slate-950">
        {value}%
      </div>
    </div>
  )
}

function LegendDot({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <span className="truncate text-slate-600">{label}</span>
      <span className="ml-auto font-bold text-slate-950">{value}</span>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-slate-950">{value}</p>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-300">{label}</p>
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function PulseRow({ label, value }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </li>
  )
}
