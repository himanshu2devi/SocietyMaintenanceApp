import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MaintenanceService, NoticeService, RuleService } from '../../api/services'
import { SectionTitle, StatusBadge } from '../../components/ui/Feedback'

export default function MemberDashboard() {
  const { user } = useAuth()
  const [charges, setCharges] = useState([])
  const [notices, setNotices] = useState([])
  const [rules, setRules] = useState([])

  useEffect(() => {
    Promise.all([MaintenanceService.list(), NoticeService.list(), RuleService.list()])
      .then(([c, n, r]) => {
        setCharges(c.filter((x) => x.flatNumber === user?.flatNumber))
        setNotices(n)
        setRules(r)
      })
      .catch(() => {})
  }, [user])

  const pending = charges.filter((c) => c.status === 'PENDING')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Member Dashboard</h1>
        <p className="text-sm text-gray-500">
          {user?.fullName} · Flat {user?.flatNumber}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-gray-500">Pending Dues</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pending.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="mt-1 text-2xl font-bold">{charges.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Notices</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{notices.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <SectionTitle title="My Maintenance" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.billingMonth}/{c.billingYear}</td>
                  <td className="py-2 pr-4">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-4"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {charges.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-gray-400">
                    No maintenance records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <SectionTitle title="Latest Notices" />
          <ul className="space-y-3">
            {notices.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-lg border border-gray-100 p-3">
                <h4 className="font-semibold">{n.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{n.body}</p>
              </li>
            ))}
            {notices.length === 0 && <p className="text-sm text-gray-400">No notices yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card">
        <SectionTitle title="Society Rules" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {rules.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-100 p-3">
              <span className="badge bg-brand-50 text-brand-700">{r.category}</span>
              <h4 className="mt-1 font-semibold">{r.title}</h4>
              <p className="mt-1 text-sm text-gray-600">{r.ruleText}</p>
            </li>
          ))}
          {rules.length === 0 && <p className="text-sm text-gray-400">No rules yet.</p>}
        </ul>
      </div>
    </div>
  )
}
