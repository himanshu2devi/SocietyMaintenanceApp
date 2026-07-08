import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import MemberDirectory from './MemberDirectory'
import MaintenanceTracker from './MaintenanceTracker'
import ExpenseLogger from './ExpenseLogger'
import NoticeBoard from './NoticeBoard'

const tabs = [
  { id: 'members', label: 'Members', component: MemberDirectory },
  { id: 'maintenance', label: 'Maintenance', component: MaintenanceTracker },
  { id: 'expenses', label: 'Expenses', component: ExpenseLogger },
  { id: 'notices', label: 'Notices & Rules', component: NoticeBoard },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('members')
  const ActiveComponent = tabs.find((t) => t.id === active).component

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.fullName}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              active === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-brand-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  )
}
