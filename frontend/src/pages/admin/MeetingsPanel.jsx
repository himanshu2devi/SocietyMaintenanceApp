import { useEffect, useState } from 'react'
import { MeetingService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const MEETING_TYPES = ['GENERAL_BODY', 'AGM', 'COMMITTEE', 'SPECIAL', 'EMERGENCY']
const STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED']

const emptyForm = {
  title: '',
  meetingType: 'COMMITTEE',
  meetingDate: '',
  startTime: '',
  location: '',
  agenda: '',
  description: '',
  organizer: '',
  status: 'SCHEDULED',
  minutes: '',
  attachmentUrl: '',
}

const statusColor = {
  SCHEDULED: 'bg-sky-50 text-sky-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
  POSTPONED: 'bg-amber-50 text-amber-700',
}

function typeLabel(value) {
  return String(value || '').replaceAll('_', ' ')
}

function formatMeetingDate(value) {
  if (!value) return '—'
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

export default function MeetingsPanel() {
  const toast = useToast()
  const [meetings, setMeetings] = useState([])
  const [filters, setFilters] = useState({ meetingType: '', status: '', q: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState('')

  async function load() {
    try {
      const res = await MeetingService.list({
        meetingType: filters.meetingType || undefined,
        status: filters.status || undefined,
        q: filters.q.trim() || undefined,
        size: 100,
      })
      setMeetings(pageContent(res))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load meetings.'))
    }
  }

  useEffect(() => {
    load()
  }, [filters.meetingType, filters.status])

  function startEdit(m) {
    setEditingId(m.id)
    setForm({
      title: m.title || '',
      meetingType: m.meetingType || 'COMMITTEE',
      meetingDate: m.meetingDate || '',
      startTime: m.startTime ? String(m.startTime).slice(0, 5) : '',
      location: m.location || '',
      agenda: m.agenda || '',
      description: m.description || '',
      organizer: m.organizer || '',
      status: m.status || 'SCHEDULED',
      minutes: m.minutes || '',
      attachmentUrl: m.attachmentUrl || '',
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

  async function save(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      title: text(form.title, 'Title', { min: 3, max: 200 }),
      meetingDate: form.meetingDate ? '' : 'Meeting date is required',
      agenda: text(form.agenda, 'Agenda', { required: false, max: 8000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      title: form.title.trim(),
      meetingType: form.meetingType,
      meetingDate: form.meetingDate,
      startTime: form.startTime || null,
      location: form.location.trim() || null,
      agenda: form.agenda.trim() || null,
      description: form.description.trim() || null,
      organizer: form.organizer.trim() || null,
      status: form.status,
      minutes: form.minutes.trim() || null,
      attachmentUrl: form.attachmentUrl.trim() || null,
    }
    setBusy(true)
    try {
      if (editingId) {
        await MeetingService.update(editingId, payload)
        toast.success('Meeting updated.')
      } else {
        await MeetingService.create(payload)
        toast.success('Meeting scheduled. Members can see the agenda.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingId ? 'Could not update meeting.' : 'Could not schedule meeting.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(m) {
    if (!window.confirm(`Delete meeting “${m.title}”?`)) return
    setRowBusy(m.id)
    try {
      await MeetingService.remove(m.id)
      if (editingId === m.id) cancelEdit()
      toast.success('Meeting deleted.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete meeting.'))
    } finally {
      setRowBusy('')
    }
  }

  return (
    <div className="space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="card">
          <SectionTitle
            title={editingId ? 'Edit meeting' : 'Schedule meeting'}
            subtitle={editingId ? 'Update agenda, status or minutes' : 'AGM, committee and special meetings'}
          />
          <form onSubmit={save} className="space-y-3" noValidate>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Annual general meeting 2026"
                maxLength={200}
              />
              {fieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Meeting type</label>
                <select
                  className="input"
                  value={form.meetingType}
                  onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                >
                  {MEETING_TYPES.map((t) => (
                    <option key={t} value={t}>{typeLabel(t)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.meetingDate}
                  onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                />
                {fieldErrors.meetingDate && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.meetingDate}</p>}
              </div>
              <div>
                <label className="label">Start time</label>
                <input
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Society office"
                  maxLength={250}
                />
              </div>
              <div>
                <label className="label">Organizer</label>
                <input
                  className="input"
                  value={form.organizer}
                  onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                  placeholder="Secretary"
                  maxLength={150}
                />
              </div>
            </div>
            <div>
              <label className="label">Agenda</label>
              <textarea
                className="input"
                rows="3"
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                placeholder="1. Approve accounts&#10;2. Lift maintenance contract"
                maxLength={8000}
              />
              {fieldErrors.agenda && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.agenda}</p>}
            </div>
            <div>
              <label className="label">Notes for members</label>
              <textarea
                className="input"
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={8000}
              />
            </div>
            <div>
              <label className="label">Minutes (after the meeting)</label>
              <textarea
                className="input"
                rows="3"
                value={form.minutes}
                onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                maxLength={20000}
              />
            </div>
            <div>
              <label className="label">Attachment URL (optional)</label>
              <input
                className="input"
                value={form.attachmentUrl}
                onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                placeholder="https://…"
                maxLength={500}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save meeting' : 'Schedule meeting'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Meetings" subtitle={`${meetings.length} shown`} />
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,170px)_minmax(0,160px)_auto]">
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search title, agenda…"
            />
            <select
              className="input"
              value={filters.meetingType}
              onChange={(e) => setFilters({ ...filters, meetingType: e.target.value })}
            >
              <option value="">All types</option>
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>{typeLabel(t)}</option>
              ))}
            </select>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={load}>Search</button>
          </div>

          <ul className="space-y-3">
            {meetings.map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-slate-950">{m.title}</h4>
                    <p className="mt-1 break-words text-xs font-medium text-slate-500">
                      {typeLabel(m.meetingType)} · {formatMeetingDate(m.meetingDate)}
                      {m.startTime ? ` · ${String(m.startTime).slice(0, 5)}` : ''}
                      {m.location ? ` · ${m.location}` : ''}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${statusColor[m.status] || 'bg-slate-100 text-slate-600'}`}>
                    {m.status}
                  </span>
                </div>
                {m.agenda && (
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{m.agenda}</p>
                )}
                {m.minutes && (
                  <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                    <span className="font-bold text-slate-700">Minutes:</span> {m.minutes}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary !py-1.5 !text-xs"
                    disabled={rowBusy === m.id}
                    onClick={() => startEdit(m)}
                  >
                    Edit
                  </button>
                  {m.attachmentUrl && (
                    <a
                      className="btn-secondary !py-1.5 !text-xs"
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Attachment
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                    disabled={rowBusy === m.id}
                    onClick={() => remove(m)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {meetings.length === 0 && (
              <p className="text-sm text-gray-400">No meetings in this view. Schedule the next one.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
