import { useState } from 'react'
import { ReportService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import {
  inr,
  monthName,
  whatsappLink,
  buildMonthlyReportText,
  buildAnnualReportText,
} from '../../utils/share'

const now = new Date()

export default function FinancialReports() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [monthly, setMonthly] = useState(null)
  const [annual, setAnnual] = useState(null)
  const [error, setError] = useState('')

  async function loadMonthly() {
    setError('')
    try {
      setMonthly(await ReportService.monthly(year, month))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load monthly report.')
    }
  }

  async function loadAnnual() {
    setError('')
    try {
      setAnnual(await ReportService.annual(year, openingBalance))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load annual report.')
    }
  }

  function shareMonthly() {
    const text = buildMonthlyReportText('Our Society', monthly)
    window.open(whatsappLink(text), '_blank')
  }

  function shareAnnual() {
    const text = buildAnnualReportText('Our Society', annual)
    window.open(whatsappLink(text), '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="text-sm text-gray-500">Monthly income-expense and annual balance sheet</p>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="card">
        <SectionTitle title="Report Filters" />
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
          <button className="btn-primary" onClick={loadMonthly}>Generate Monthly</button>
          <div>
            <label className="label">Opening Balance (₹)</label>
            <input type="number" className="input w-40" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
          </div>
          <button className="btn-secondary" onClick={loadAnnual}>Generate Annual</button>
        </div>
      </div>

      {/* Monthly Income-Expense */}
      {monthly && (
        <div className="card">
          <SectionTitle
            title={`Monthly Income-Expense — ${monthName(monthly.month)} ${monthly.year}`}
            action={
              <button className="btn-success" onClick={shareMonthly}>
                Share on WhatsApp
              </button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Collected" value={inr(monthly.maintenanceCollected)} tone="text-emerald-600" />
            <Stat label="Pending" value={inr(monthly.maintenancePending)} tone="text-amber-600" />
            <Stat label="Expenses" value={inr(monthly.totalExpenses)} tone="text-red-600" />
            <Stat
              label="Net"
              value={inr(monthly.netSurplusDeficit)}
              tone={monthly.netSurplusDeficit >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-700">Income vs Expense</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Maintenance Income</td>
                <td className="py-2 text-right font-medium text-emerald-600">
                  {inr(monthly.maintenanceCollected)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Total Expenses</td>
                <td className="py-2 text-right font-medium text-red-600">
                  {inr(monthly.totalExpenses)}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Net Surplus / Deficit</td>
                <td className="py-2 text-right font-bold">{inr(monthly.netSurplusDeficit)}</td>
              </tr>
            </tbody>
          </table>

          {monthly.expenseBreakdown?.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-700">Expense Breakdown</h3>
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
                      <td className="py-2 text-right">{inr(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Annual Balance Sheet */}
      {annual && (
        <div className="card">
          <SectionTitle
            title={`Annual Balance Sheet — ${annual.year}`}
            action={
              <button className="btn-success" onClick={shareAnnual}>
                Share on WhatsApp
              </button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Opening" value={inr(annual.openingBalance)} />
            <Stat label="Income" value={inr(annual.totalIncome)} tone="text-emerald-600" />
            <Stat label="Expenses" value={inr(annual.totalExpenses)} tone="text-red-600" />
            <Stat
              label="Closing"
              value={inr(annual.closingBalance)}
              tone={annual.closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-700">Month-wise Summary</h3>
          <div className="overflow-x-auto">
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
                    <td className="py-2 pr-4 text-right text-emerald-600">{inr(l.income)}</td>
                    <td className="py-2 pr-4 text-right text-red-600">{inr(l.expenses)}</td>
                    <td className="py-2 pr-4 text-right font-medium">{inr(l.net)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4 text-right text-emerald-600">{inr(annual.totalIncome)}</td>
                  <td className="py-2 pr-4 text-right text-red-600">{inr(annual.totalExpenses)}</td>
                  <td className="py-2 pr-4 text-right">{inr(annual.totalIncome - annual.totalExpenses)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Outstanding dues for {annual.year}: <span className="font-semibold text-amber-600">{inr(annual.pendingDues)}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'text-gray-900' }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  )
}
