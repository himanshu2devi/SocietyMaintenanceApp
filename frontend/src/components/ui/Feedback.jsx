export function Alert({ type = 'info', children }) {
  if (!children) return null
  const styles = {
    info: 'bg-brand-50 text-brand-700 border-brand-100',
    error: 'bg-red-50 text-red-700 border-red-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[type]}`}>{children}</div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    PAID: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
  }
  return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
