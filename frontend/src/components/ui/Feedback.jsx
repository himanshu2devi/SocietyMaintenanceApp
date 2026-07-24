export function Alert({ type = 'info', children }) {
  if (!children) return null
  const styles = {
    info: 'border-sky-100 bg-sky-50 text-sky-800',
    error: 'border-red-100 bg-red-50 text-red-700',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  }
  return (
    <div className={`break-words rounded-xl border px-3.5 py-3 text-sm font-medium ${styles[type]}`}>{children}</div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    PAID: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    SUBMITTED: 'bg-sky-100 text-sky-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    INACTIVE: 'bg-slate-200 text-slate-600',
  }
  return <span className={`badge ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 break-words text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  )
}
