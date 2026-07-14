import { useState } from 'react'
import { ReportService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  inr,
  monthName,
  downloadMonthlyReportPdf,
  downloadAnnualReportPdf,
} from '../../utils/share'

const now = new Date()

export default function FinancialReports() {
  const { isAdmin, user } = useAuth()
  const toast = useToast()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [monthly, setMonthly] = useState(null)
  const [annual, setAnnual] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const societyLabel = user?.societyName
    ? `${user.societyName}${user.societyCode ? ` · ${user.societyCode}` : ''}`
    : 'Society financial report'

  async function loadMonthly() {
    setError('')
    setBusy('monthly')
    try {
      setMonthly(await ReportService.monthly(year, month))
      setAnnual(null)
      toast.success('Monthly report ready.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load monthly report.'))
    } finally {
      setBusy('')
    }
  }

  async function loadAnnual() {
    setError('')
    setBusy('annual')
    try {
      setAnnual(await ReportService.annual(year, openingBalance))
      setMonthly(null)
      toast.success('Annual report ready.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load annual report.'))
    } finally {
      setBusy('')
    }
  }

  function downloadMonthlyPdf() {
    if (!monthly) return
    try {
      downloadMonthlyReportPdf(monthly, undefined, user?.societyName)
      toast.success('PDF downloaded.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download PDF.'))
    }
  }

  function downloadAnnualPdf() {
    if (!annual) return
    try {
      downloadAnnualReportPdf(annual, undefined, user?.societyName)
      toast.success('PDF downloaded.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download PDF.'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 py-6 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">SocietyWale reports</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Financial Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Generate monthly or annual statements for {user?.societyName || 'your society'}, then download a branded PDF. Members can view; committee manages source data in Maintenance and Expenses.
        </p>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card">
        <SectionTitle title="Report filters" subtitle="Choose period, then generate" />
        <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Year</label>
              <input type="number" className="input w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Month</label>
              <select className="input w-40" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" disabled={busy === 'monthly'} onClick={loadMonthly}>
              {busy === 'monthly' ? 'Generating…' : 'Generate monthly'}
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <label className="label">Opening balance (₹)</label>
              <input type="number" className="input w-40" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
            </div>
            <button className="btn-secondary" disabled={busy === 'annual'} onClick={loadAnnual}>
              {busy === 'annual' ? 'Generating…' : 'Generate annual'}
            </button>
          </div>
        </div>
      </div>

      {!monthly && !annual && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No report selected</p>
          <p className="mt-1 text-sm text-slate-400">Generate a monthly or annual report to preview totals and download PDF.</p>
        </div>
      )}

      {monthly && (
        <div className="card">
          <SectionTitle
            title={`Monthly income & expense — ${monthName(monthly.month)} ${monthly.year}`}
            subtitle={societyLabel}
            action={
              <button
                className="btn-primary"
                onClick={downloadMonthlyPdf}
                disabled={!isAdmin}
                title={isAdmin ? 'Download monthly report as PDF' : 'Only society admins can download reports'}
              >
                Download PDF
              </button>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Collected" value={inr(monthly.maintenanceCollected)} tone="text-emerald-700" bg="bg-emerald-50" />
            <Stat label="Pending" value={inr(monthly.maintenancePending)} tone="text-amber-700" bg="bg-amber-50" />
            <Stat label="Expenses" value={inr(monthly.totalExpenses)} tone="text-red-700" bg="bg-red-50" />
            <Stat label="Net" value={inr(monthly.netSurplusDeficit)} tone={monthly.netSurplusDeficit >= 0 ? 'text-teal-800' : 'text-red-700'} bg="bg-slate-50" />
          </div>
          {monthly.expenseBreakdown?.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Expense breakdown</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.expenseBreakdown.map((c) => (
                    <tr key={c.category} className="border-b last:border-0">
                      <td className="py-2">{c.category}</td>
                      <td className="py-2 text-right font-medium">{inr(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {monthly.expenseLines?.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Expense details</h3>
              <div className="table-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">Title</th>
                      <th className="py-2 pr-3">Bill ID</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.expenseLines.map((line, idx) => (
                      <tr key={`${line.expenseDate}-${line.title}-${idx}`} className="border-b last:border-0">
                        <td className="py-2 pr-3">{line.expenseDate}</td>
                        <td className="py-2 pr-3">{line.category}</td>
                        <td className="py-2 pr-3">{line.title}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{line.billId || 'N/A'}</td>
                        <td className="py-2 text-right font-medium">{inr(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {annual && (
        <div className="card">
          <SectionTitle
            title={`Annual balance sheet — ${annual.year}`}
            subtitle={societyLabel}
            action={
              <button
                className="btn-primary"
                onClick={downloadAnnualPdf}
                disabled={!isAdmin}
                title={isAdmin ? 'Download annual report as PDF' : 'Only society admins can download reports'}
              >
                Download PDF
              </button>
            }
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Opening" value={inr(annual.openingBalance)} bg="bg-slate-50" />
            <Stat label="Income" value={inr(annual.totalIncome)} tone="text-emerald-700" bg="bg-emerald-50" />
            <Stat label="Expenses" value={inr(annual.totalExpenses)} tone="text-red-700" bg="bg-red-50" />
            <Stat label="Closing" value={inr(annual.closingBalance)} tone={annual.closingBalance >= 0 ? 'text-teal-800' : 'text-red-700'} bg="bg-slate-50" />
          </div>
          <div className="mt-6 table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2 pr-4 text-right">Income</th>
                  <th className="py-2 pr-4 text-right">Expenses</th>
                  <th className="py-2 pr-4 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {annual.monthlyLines.map((l) => (
                  <tr key={l.month} className="border-b last:border-0">
                    <td className="py-2 pr-4">{monthName(l.month)}</td>
                    <td className="py-2 pr-4 text-right text-emerald-700">{inr(l.income)}</td>
                    <td className="py-2 pr-4 text-right text-red-600">{inr(l.expenses)}</td>
                    <td className="py-2 pr-4 text-right font-medium">{inr(l.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'text-slate-900', bg = 'bg-white' }) {
  return (
    <div className={`rounded-xl border border-slate-100 ${bg} px-3.5 py-3`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  )
}
