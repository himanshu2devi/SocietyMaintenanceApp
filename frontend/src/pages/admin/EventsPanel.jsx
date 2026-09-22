import { useEffect, useState } from 'react'
import { EventService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const STATUSES = ['SCHEDULED', 'CANCELLED', 'COMPLETED']

const emptyForm = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  location: '',
  organizer: '',
  imageUrl: '',
  status: 'SCHEDULED',
}

const statusColor = {
  SCHEDULED: 'bg-sky-50 text-sky-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

function formatEventDate(value) {
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

function formatTimeRange(start, end) {
  const clean = (t) => (t ? String(t).slice(0, 5) : '')
  const from = clean(start)
  const to = clean(end)
  if (!from && !to) return ''
  return to ? `${from} – ${to}` : from
}

export default function EventsPanel() {
  const toast = useToast()
  const [events, setEvents] = useState([])
  const [filters, setFilters] = useState({ status: '', q: '' })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState('')

  async function load() {
    try {
      const res = await EventService.list({
        status: filters.status || undefined,
        q: filters.q.trim() || undefined,
        size: 100,
      })
      setEvents(pageContent(res))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load society events.'))
    }
  }

  useEffect(() => {
    load()
  }, [filters.status])

  function startEdit(ev) {
    setEditingId(ev.id)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      eventDate: ev.eventDate || '',
      startTime: ev.startTime ? String(ev.startTime).slice(0, 5) : '',
      endTime: ev.endTime ? String(ev.endTime).slice(0, 5) : '',
      location: ev.location || '',
      organizer: ev.organizer || '',
      imageUrl: ev.imageUrl || '',
      status: ev.status || 'SCHEDULED',
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
      eventDate: form.eventDate ? '' : 'Event date is required',
      description: text(form.description, 'Description', { required: false, max: 4000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      eventDate: form.eventDate,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      location: form.location.trim() || null,
      organizer: form.organizer.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
    }
    setBusy(true)
    try {
      if (editingId) {
        await EventService.update(editingId, payload)
        toast.success('Event updated.')
      } else {
        await EventService.create(payload)
        toast.success('Event published for members.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingId ? 'Could not update event.' : 'Could not create event.'))
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(ev, status) {
    setRowBusy(ev.id)
    try {
      await EventService.update(ev.id, {
        title: ev.title,
        description: ev.description || null,
        eventDate: ev.eventDate,
        startTime: ev.startTime || null,
        endTime: ev.endTime || null,
        location: ev.location || null,
        organizer: ev.organizer || null,
        imageUrl: ev.imageUrl || null,
        status,
      })
      toast.success(status === 'CANCELLED' ? 'Event cancelled.' : `Event marked ${status.toLowerCase()}.`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not change event status.'))
    } finally {
      setRowBusy('')
    }
  }

  async function remove(ev) {
    if (!window.confirm(`Delete event “${ev.title}”? Members will no longer see it.`)) return
    setRowBusy(ev.id)
    try {
      await EventService.remove(ev.id)
      if (editingId === ev.id) cancelEdit()
      toast.success('Event deleted.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete event.'))
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
            title={editingId ? 'Edit event' : 'Create event'}
            subtitle={editingId ? 'Update and save changes instantly' : 'Festivals, drives, society gatherings'}
          />
          <form onSubmit={save} className="space-y-3" noValidate>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ganesh Chaturthi celebration"
                maxLength={200}
              />
              {fieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
                {fieldErrors.eventDate && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.eventDate}</p>}
              </div>
              <div>
                <label className="label">Starts</label>
                <input
                  type="time"
                  className="input"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Ends</label>
                <input
                  type="time"
                  className="input"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Society clubhouse"
                  maxLength={250}
                />
              </div>
              <div>
                <label className="label">Organizer</label>
                <input
                  className="input"
                  value={form.organizer}
                  onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                  placeholder="Cultural committee"
                  maxLength={150}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Poster image URL (optional)</label>
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://…"
                  maxLength={500}
                />
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
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save event' : 'Create event'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Society events" subtitle={`${events.length} shown`} />
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto]">
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search title, location…"
            />
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
            {events.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-slate-950">{ev.title}</h4>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {formatEventDate(ev.eventDate)}
                      {formatTimeRange(ev.startTime, ev.endTime) ? ` · ${formatTimeRange(ev.startTime, ev.endTime)}` : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${statusColor[ev.status] || 'bg-slate-100 text-slate-600'}`}>
                    {ev.status}
                  </span>
                </div>
                {ev.description && (
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{ev.description}</p>
                )}
                {ev.organizer && (
                  <p className="mt-1 break-words text-xs text-slate-500">Organised by {ev.organizer}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary !py-1.5 !text-xs"
                    disabled={rowBusy === ev.id}
                    onClick={() => startEdit(ev)}
                  >
                    Edit
                  </button>
                  {ev.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="btn-warning !py-1.5 !text-xs"
                      disabled={rowBusy === ev.id}
                      onClick={() => setStatus(ev, 'CANCELLED')}
                    >
                      Cancel event
                    </button>
                  )}
                  {ev.status === 'SCHEDULED' && (
                    <button
                      type="button"
                      className="btn-success !py-1.5 !text-xs"
                      disabled={rowBusy === ev.id}
                      onClick={() => setStatus(ev, 'COMPLETED')}
                    >
                      Mark completed
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                    disabled={rowBusy === ev.id}
                    onClick={() => remove(ev)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-gray-400">No events yet. Create the first society event.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
