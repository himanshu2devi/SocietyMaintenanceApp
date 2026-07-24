import { useEffect, useState } from 'react'
import { ComplaintService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { formatNoticeDate } from '../../utils/share'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const emptyForm = {
  title: '',
  description: '',
  category: 'General',
  priority: 'NORMAL',
  status: 'OPEN',
  adminNotes: '',
}

const statusTone = {
  OPEN: 'bg-amber-50 text-amber-800',
  IN_PROGRESS: 'bg-sky-50 text-sky-800',
  RESOLVED: 'bg-emerald-50 text-emerald-800',
  CLOSED: 'bg-slate-100 text-slate-600',
}

const priorityTone = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-amber-100 text-amber-700',
  NORMAL: 'bg-sky-50 text-sky-700',
  LOW: 'bg-gray-100 text-gray-600',
}

export default function ComplaintBoard() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setItems(await ComplaintService.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load complaints.'))
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'General',
      priority: item.priority || 'NORMAL',
      status: item.status || 'OPEN',
      adminNotes: item.adminNotes || '',
    })
    setFieldErrors({})
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      title: text(form.title, 'Title', { min: 3, max: 250 }),
      description: text(form.description, 'Description', { min: 3, max: 4000 }),
      category: text(form.category, 'Category', { min: 2, max: 80 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }

    setBusy(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        priority: form.priority,
      }
      if (editingId) {
        await ComplaintService.update(editingId, {
          ...payload,
          status: isAdmin ? form.status : undefined,
          adminNotes: isAdmin ? form.adminNotes : undefined,
        })
        toast.success('Complaint updated.')
      } else {
        await ComplaintService.create(payload)
        toast.success('Complaint submitted.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingId ? 'Could not update complaint.' : 'Could not submit complaint.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete complaint “${item.title}”?`)) return
    try {
      await ComplaintService.remove(item.id)
      toast.success('Complaint deleted.')
      if (editingId === item.id) cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete complaint.'))
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="card">
        <SectionTitle
          title={editingId ? 'Edit complaint' : 'Raise a complaint'}
          subtitle={isAdmin ? 'Committee can track and resolve resident issues' : 'Report maintenance, security or common-area issues to your committee'}
        />
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2" noValidate>
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={250} />
            {fieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <input
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Lift, Water, Parking, Security…"
              maxLength={80}
            />
            {fieldErrors.category && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.category}</p>}
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {isAdmin && editingId && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={4000}
            />
            {fieldErrors.description && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>}
          </div>
          {isAdmin && editingId && (
            <div className="md:col-span-2">
              <label className="label">Committee notes (optional)</label>
              <textarea
                className="input"
                rows="2"
                value={form.adminNotes}
                onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                maxLength={2000}
                placeholder="Internal update visible to the society workspace"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Submit complaint'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <SectionTitle title="Complaint tracker" subtitle={`${items.length} complaint${items.length === 1 ? '' : 's'}`} />
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`badge ${statusTone[item.status] || ''}`}>{String(item.status || '').replace('_', ' ')}</span>
                    <span className={`badge ${priorityTone[item.priority] || ''}`}>{item.priority}</span>
                    <span className="badge bg-orange-50 text-orange-700">{item.category}</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {formatNoticeDate(item.createdAt)}
                    {item.createdByName ? ` · ${item.createdByName}` : ''}
                    {item.flatNumber ? ` · Flat ${item.flatNumber}` : ''}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              {item.adminNotes && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Committee note: </span>
                  {item.adminNotes}
                </p>
              )}
              {item.editable && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50" onClick={() => remove(item)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400">
              No complaints yet{user?.role === 'MEMBER' ? '. Raise one if something needs committee attention.' : '.'}
            </p>
          )}
        </ul>
      </div>
    </div>
  )
}
