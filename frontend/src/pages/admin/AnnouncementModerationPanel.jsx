import { useEffect, useState } from 'react'
import { MemberAnnouncementService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { formatNoticeDate } from '../../utils/share'

const FILTERS = [
  ['PENDING_APPROVAL', 'Pending'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
  ['', 'All'],
]

const statusColor = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

function statusLabel(status) {
  return status === 'PENDING_APPROVAL' ? 'PENDING' : status
}

export default function AnnouncementModerationPanel({ onAnnouncementsChanged }) {
  const toast = useToast()
  const [status, setStatus] = useState('PENDING_APPROVAL')
  const [items, setItems] = useState([])
  const [notes, setNotes] = useState({})
  const [error, setError] = useState('')
  const [rowBusy, setRowBusy] = useState('')

  async function load() {
    try {
      const res = await MemberAnnouncementService.list({ status: status || undefined, size: 100 })
      setItems(pageContent(res))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load member announcements.'))
    }
  }

  useEffect(() => {
    load()
  }, [status])

  async function review(item, action) {
    setRowBusy(item.id)
    setError('')
    try {
      const note = notes[item.id]?.trim() || null
      if (action === 'approve') {
        await MemberAnnouncementService.approve(item.id, note)
        toast.success('Announcement approved. All members can see it now.')
      } else {
        await MemberAnnouncementService.reject(item.id, note)
        toast.info('Announcement rejected. The author can see your note.')
      }
      setNotes((prev) => ({ ...prev, [item.id]: '' }))
      await load()
      onAnnouncementsChanged?.()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not review this announcement.'))
    } finally {
      setRowBusy('')
    }
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return
    setRowBusy(item.id)
    try {
      await MemberAnnouncementService.remove(item.id)
      toast.success('Announcement deleted.')
      await load()
      onAnnouncementsChanged?.()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete this announcement.'))
    } finally {
      setRowBusy('')
    }
  }

  return (
    <div className="space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="card">
        <SectionTitle
          title="Member announcements"
          subtitle="Residents submit; committee approves before every member sees it."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                status === value ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="break-words font-semibold text-slate-950">{item.title}</h4>
                  <p className="mt-1 break-words text-xs font-medium text-slate-500">
                    {item.authorName || 'Member'}
                    {item.authorFlatNumber ? ` · Flat ${item.authorFlatNumber}` : ''}
                    {` · ${formatNoticeDate(item.createdAt)}`}
                  </p>
                </div>
                <span className={`badge shrink-0 ${statusColor[item.status] || 'bg-slate-100 text-slate-600'}`}>
                  {statusLabel(item.status)}
                </span>
              </div>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{item.body}</p>
              {item.reviewNote && (
                <p className="mt-2 break-words rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Committee note: {item.reviewNote}
                </p>
              )}

              {item.status === 'PENDING_APPROVAL' ? (
                <div className="mt-3 space-y-2">
                  <input
                    className="input"
                    placeholder="Optional note for the author"
                    value={notes[item.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                    maxLength={500}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-success !py-1.5 !text-xs"
                      disabled={rowBusy === item.id}
                      onClick={() => review(item, 'approve')}
                    >
                      {rowBusy === item.id ? 'Working…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                      disabled={rowBusy === item.id}
                      onClick={() => review(item, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                    disabled={rowBusy === item.id}
                    onClick={() => remove(item)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400">
              {status === 'PENDING_APPROVAL'
                ? 'Nothing waiting for approval.'
                : 'No announcements in this view.'}
            </p>
          )}
        </ul>
      </div>
    </div>
  )
}
