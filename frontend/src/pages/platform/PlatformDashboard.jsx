import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PlatformAdminService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { getValidToken } from '../../auth/token'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent, pageTotal } from '../../utils/page'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'societies', label: 'Societies', icon: '⌸' },
  { id: 'users', label: 'Users', icon: '♙' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '₹' },
  { id: 'stats', label: 'Stats', icon: '▤' },
]

const SUMMARY_TABS = ['dashboard', 'stats']

function humanize(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
}

function isScalar(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function renderCell(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function PlatformDashboard() {
  const { user } = useAuth()
  const [active, setActive] = useState('dashboard')
  const [data, setData] = useState({})
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(tab, q = '') {
    setError('')
    setLoading(true)
    try {
      const params = q.trim() ? { q: q.trim(), size: 100 } : { size: 100 }
      let result
      if (tab === 'dashboard') result = await PlatformAdminService.dashboard()
      else if (tab === 'stats') result = await PlatformAdminService.stats()
      else if (tab === 'societies') result = await PlatformAdminService.societies(params)
      else if (tab === 'users') result = await PlatformAdminService.users(params)
      else result = await PlatformAdminService.subscriptions(params)
      setData((prev) => ({ ...prev, [tab]: result }))
    } catch (err) {
      setError(getApiErrorMessage(err, 'This platform console section is unavailable right now.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setQuery('')
    load(active)
  }, [active])

  if (!getValidToken()) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/member'} replace />
  }

  const current = data[active]
  const isSummary = SUMMARY_TABS.includes(active)
  const rows = isSummary ? [] : pageContent(current)
  const columns = rows.length ? Object.keys(rows[0]).filter((key) => isScalar(rows[0][key])) : []
  const metrics = isSummary && current && typeof current === 'object'
    ? Object.entries(current).filter(([, value]) => isScalar(value))
    : []
  const nestedLists = isSummary && current && typeof current === 'object'
    ? Object.entries(current).filter(([, value]) => Array.isArray(value) && value.length > 0)
    : []

  return (
    <div className="grid w-full min-w-0 max-w-full gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/[.03] lg:min-h-[calc(100dvh-150px)]">
        <div className="border-b border-slate-100 px-2 pb-4 pt-2 sm:px-3">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Platform console</p>
          <p className="mt-2 break-words text-sm font-bold leading-snug text-slate-900">SocietySimplify</p>
          <p className="mt-1 break-words text-xs leading-snug text-slate-500">{user?.fullName}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">Platform admin</p>
        </div>
        <nav
          className="mt-3 flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] lg:grid lg:gap-1 lg:overflow-visible lg:pb-0"
          aria-label="Platform sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition lg:w-full lg:gap-3 lg:py-3 ${
                active === tab.id ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-base shadow-sm">{tab.icon}</span>
              <span className="whitespace-nowrap lg:min-w-0 lg:flex-1 lg:whitespace-normal lg:break-words">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 max-w-full space-y-6">
        <div className="mb-1 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pb-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">SocietySimplify operations</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              {tabs.find((t) => t.id === active).label}
            </h1>
          </div>
          <p className="max-w-full text-sm leading-6 text-slate-500 sm:max-w-xs lg:max-w-sm">
            Cross-society console. Society data stays owned by each committee.
          </p>
        </div>

        <Alert type="error">{error}</Alert>

        {isSummary ? (
          <div className="space-y-6">
            <div className="card">
              <SectionTitle
                title={active === 'dashboard' ? 'Platform snapshot' : 'Usage statistics'}
                subtitle={loading ? 'Loading…' : `${metrics.length} metric(s)`}
                action={
                  <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => load(active)}>
                    Refresh
                  </button>
                }
              />
              {metrics.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{humanize(key)}</p>
                      <p className="mt-1 break-words text-2xl font-bold text-slate-950">{renderCell(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  {loading ? 'Loading…' : 'Nothing reported yet.'}
                </p>
              )}
            </div>

            {nestedLists.map(([key, list]) => {
              const listRows = list.filter((row) => row && typeof row === 'object')
              const listColumns = listRows.length
                ? Object.keys(listRows[0]).filter((col) => isScalar(listRows[0][col]))
                : []
              return (
                <div key={key} className="card min-w-0">
                  <SectionTitle title={humanize(key)} subtitle={`${list.length} row(s)`} />
                  {listColumns.length ? (
                    <div className="table-scroll">
                      <table className="w-full min-w-[40rem] text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            {listColumns.map((col) => (
                              <th key={col} className="py-2 pr-4">{humanize(col)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {listRows.map((row, index) => (
                            <tr key={row.id || index} className="border-b last:border-0">
                              {listColumns.map((col) => (
                                <td key={col} className="break-words py-2 pr-4">{renderCell(row[col])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{list.map(renderCell).join(', ')}</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card min-w-0">
            <SectionTitle
              title={tabs.find((t) => t.id === active).label}
              subtitle={loading ? 'Loading…' : `${pageTotal(current, rows)} total`}
            />
            <form
              className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={(e) => {
                e.preventDefault()
                load(active, query)
              }}
            >
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${tabs.find((t) => t.id === active).label.toLowerCase()}…`}
              />
              <button className="btn-secondary">Search</button>
            </form>

            {columns.length ? (
              <div className="table-scroll">
                <table className="w-full min-w-[44rem] text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      {columns.map((col) => (
                        <th key={col} className="py-2 pr-4">{humanize(col)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.id || index} className="border-b last:border-0">
                        {columns.map((col) => (
                          <td key={col} className="break-words py-2 pr-4">
                            {col === 'status' || col === 'active'
                              ? <StatusBadge status={typeof row[col] === 'boolean' ? (row[col] ? 'ACTIVE' : 'INACTIVE') : String(row[col] || '—')} />
                              : renderCell(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {loading ? 'Loading…' : 'No records to show.'}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
