import { useEffect, useMemo, useState } from 'react'
import {
  ElectionService,
  EventService,
  MeetingService,
  MemberAnnouncementService,
  ParkingService,
  PaymentQrService,
} from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { formatNoticeDate } from '../../utils/share'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const announcementStatusColor = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

function labelize(value) {
  return String(value || '').replaceAll('_', ' ')
}

function formatDayDate(value) {
  if (!value) return '—'
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function formatClock(value) {
  return value ? String(value).slice(0, 5) : ''
}

function isUpcoming(dateString) {
  if (!dateString) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${dateString}T00:00:00`) >= today
}

/**
 * Resident-facing view of the community modules: payment QR, events, member
 * announcements, parking allotment, meetings and the election register.
 */
export default function MemberCommunity() {
  const toast = useToast()
  const [qr, setQr] = useState(null)
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [assignments, setAssignments] = useState([])
  const [meetings, setMeetings] = useState([])
  const [elections, setElections] = useState([])
  const [electionDetail, setElectionDetail] = useState(null)
  const [form, setForm] = useState({ title: '', body: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadAnnouncements() {
    const res = await MemberAnnouncementService.list({ size: 50 })
    setAnnouncements(pageContent(res))
  }

  async function load() {
    const results = await Promise.allSettled([
      PaymentQrService.get(),
      EventService.list({ size: 50 }),
      MemberAnnouncementService.list({ size: 50 }),
      ParkingService.myAssignments(),
      MeetingService.list({ size: 50 }),
      ElectionService.list({ size: 50 }),
    ])
    const [qrRes, eventRes, announcementRes, parkingRes, meetingRes, electionRes] = results

    if (qrRes.status === 'fulfilled') setQr(qrRes.value)
    if (eventRes.status === 'fulfilled') setEvents(pageContent(eventRes.value))
    if (announcementRes.status === 'fulfilled') setAnnouncements(pageContent(announcementRes.value))
    if (parkingRes.status === 'fulfilled') {
      setAssignments(Array.isArray(parkingRes.value) ? parkingRes.value : [])
    }
    if (meetingRes.status === 'fulfilled') setMeetings(pageContent(meetingRes.value))
    if (electionRes.status === 'fulfilled') setElections(pageContent(electionRes.value))

    const failed = results.find((r) => r.status === 'rejected')
    setError(failed ? getApiErrorMessage(failed.reason, 'Some community sections could not load.') : '')
  }

  useEffect(() => {
    load()
  }, [])

  const upcomingEvents = useMemo(
    () => events
      .filter((e) => e.status !== 'CANCELLED' && isUpcoming(e.eventDate))
      .sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate))),
    [events],
  )

  const upcomingMeetings = useMemo(
    () => meetings
      .slice()
      .sort((a, b) => String(b.meetingDate).localeCompare(String(a.meetingDate))),
    [meetings],
  )

  const approvedAnnouncements = announcements.filter((a) => a.status === 'APPROVED')
  const myPending = announcements.filter((a) => a.status === 'PENDING_APPROVAL')

  async function submitAnnouncement(e) {
    e.preventDefault()
    const errors = collectErrors({
      title: text(form.title, 'Title', { min: 3, max: 200 }),
      body: text(form.body, 'Announcement', { min: 3, max: 4000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      toast.error(firstError(errors))
      return
    }
    setBusy(true)
    try {
      await MemberAnnouncementService.submit({
        title: form.title.trim(),
        body: form.body.trim(),
        relatedEventId: null,
      })
      setForm({ title: '', body: '' })
      setFieldErrors({})
      toast.success('Sent to committee. It appears for everyone once approved.')
      await loadAnnouncements()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not submit your announcement.'))
    } finally {
      setBusy(false)
    }
  }

  async function openElection(id) {
    try {
      setElectionDetail(await ElectionService.get(id))
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not open this election.'))
    }
  }

  const qrSrc = qr?.configured && qr.imageBase64 ? `data:${qr.contentType};base64,${qr.imageBase64}` : ''

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <SectionTitle title="Pay by QR" subtitle="Scan, pay, then submit a payment claim above" />
          {qrSrc ? (
            <div className="space-y-3">
              <div className="grid place-items-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <img
                  src={qrSrc}
                  alt="Society payment QR"
                  className="max-h-60 w-auto rounded-xl bg-white p-2 shadow-sm"
                />
              </div>
              <p className="break-words text-sm text-slate-600">
                {qr.instruction || 'Scan to pay society maintenance'}
              </p>
              {qr.upiId && (
                <p className="break-all text-sm font-semibold text-slate-900">UPI · {qr.upiId}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Committee has not published a payment QR yet. Use the society bank details instead.
            </p>
          )}
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Upcoming events" subtitle={`${upcomingEvents.length} planned`} />
          <ul className="space-y-3">
            {upcomingEvents.slice(0, 6).map((ev) => (
              <li key={ev.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="min-w-0 break-words font-semibold text-slate-950">{ev.title}</h4>
                  <span className="badge shrink-0 bg-teal-50 text-teal-800">{formatDayDate(ev.eventDate)}</span>
                </div>
                <p className="mt-1 break-words text-xs font-medium text-slate-500">
                  {formatClock(ev.startTime)}
                  {formatClock(ev.endTime) ? ` – ${formatClock(ev.endTime)}` : ''}
                  {ev.location ? `${formatClock(ev.startTime) ? ' · ' : ''}${ev.location}` : ''}
                </p>
                {ev.description && (
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{ev.description}</p>
                )}
                {ev.organizer && <p className="mt-1 break-words text-xs text-slate-500">By {ev.organizer}</p>}
              </li>
            ))}
            {upcomingEvents.length === 0 && <p className="text-sm text-gray-400">No upcoming events.</p>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <SectionTitle
            title="Share an announcement"
            subtitle="Committee approves before other residents see it"
          />
          <form onSubmit={submitAnnouncement} className="space-y-3" noValidate>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Lost keys near B wing gate"
                maxLength={200}
              />
              {fieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>}
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input"
                rows="3"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                maxLength={4000}
              />
              {fieldErrors.body && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.body}</p>}
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send for approval'}
            </button>
          </form>

          {myPending.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {myPending.map((a) => (
                <li key={a.id} className="rounded-xl bg-amber-50 px-3 py-2">
                  <p className="break-words text-sm font-semibold text-amber-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-amber-800/80">Waiting for committee approval</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Resident announcements" subtitle={`${approvedAnnouncements.length} approved`} />
          <ul className="space-y-3">
            {approvedAnnouncements.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="min-w-0 break-words font-semibold text-slate-950">{a.title}</h4>
                  <span className={`badge shrink-0 ${announcementStatusColor[a.status] || ''}`}>APPROVED</span>
                </div>
                <p className="mt-1 break-words text-xs font-medium text-slate-500">
                  {a.authorName || 'Resident'}
                  {a.authorFlatNumber ? ` · Flat ${a.authorFlatNumber}` : ''}
                  {` · ${formatNoticeDate(a.createdAt)}`}
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">{a.body}</p>
              </li>
            ))}
            {approvedAnnouncements.length === 0 && (
              <p className="text-sm text-gray-400">No resident announcements yet.</p>
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <SectionTitle title="My parking" subtitle="Slots allotted to you by the committee" />
          <ul className="space-y-3">
            {assignments.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-slate-950">Slot {a.slotCode}</p>
                  <span className={`badge shrink-0 ${a.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {a.active ? 'ACTIVE' : 'RELEASED'}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm text-slate-600">
                  {a.vehicleNumber || 'No vehicle recorded'}
                  {a.vehicleType ? ` · ${a.vehicleType}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Allotted {formatNoticeDate(a.assignedAt)}</p>
              </li>
            ))}
            {assignments.length === 0 && (
              <p className="text-sm text-gray-400">
                No parking slot allotted to you. Ask the committee if you need one.
              </p>
            )}
          </ul>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Meetings" subtitle="Agenda and minutes published by committee" />
          <ul className="space-y-3">
            {upcomingMeetings.slice(0, 6).map((m) => (
              <li key={m.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="min-w-0 break-words font-semibold text-slate-950">{m.title}</h4>
                  <span className="badge shrink-0 bg-slate-100 text-slate-600">{m.status}</span>
                </div>
                <p className="mt-1 break-words text-xs font-medium text-slate-500">
                  {labelize(m.meetingType)} · {formatDayDate(m.meetingDate)}
                  {formatClock(m.startTime) ? ` · ${formatClock(m.startTime)}` : ''}
                  {m.location ? ` · ${m.location}` : ''}
                </p>
                {m.agenda && (
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{m.agenda}</p>
                )}
                {m.minutes && (
                  <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                    <span className="font-bold text-slate-700">Minutes:</span> {m.minutes}
                  </p>
                )}
                {m.attachmentUrl && (
                  <a
                    className="btn-secondary mt-3 !py-1.5 !text-xs"
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open attachment
                  </a>
                )}
              </li>
            ))}
            {upcomingMeetings.length === 0 && <p className="text-sm text-gray-400">No meetings published yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card min-w-0">
        <SectionTitle title="Elections" subtitle="Nominations, candidates and results recorded by the committee" />
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Voting happens offline at the society.</p>
          <p className="mt-1 text-amber-800/90">
            SocietySimplify does not collect votes. The committee counts ballots offline and records the declared
            result here for everyone to see.
          </p>
        </div>
        <ul className="space-y-3">
          {elections.map((el) => (
            <li key={el.id} className="rounded-xl border border-slate-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="min-w-0 break-words font-semibold text-slate-950">{el.title}</h4>
                <span className="badge shrink-0 bg-slate-100 text-slate-600">{labelize(el.status)}</span>
              </div>
              {el.description && (
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">{el.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Nominations {el.nominationStart ? formatNoticeDate(el.nominationStart) : '—'} to{' '}
                {el.nominationEnd ? formatNoticeDate(el.nominationEnd) : '—'}
              </p>
              <button
                type="button"
                className="btn-secondary mt-3 !py-1.5 !text-xs"
                onClick={() => openElection(el.id)}
              >
                View candidates &amp; result
              </button>
            </li>
          ))}
          {elections.length === 0 && <p className="text-sm text-gray-400">No elections announced yet.</p>}
        </ul>
      </div>

      {electionDetail && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">
              {labelize(electionDetail.status)}
            </p>
            <h3 className="mt-2 break-words text-xl font-extrabold text-slate-950">{electionDetail.title}</h3>
            {electionDetail.description && (
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{electionDetail.description}</p>
            )}
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              {electionDetail.votingNotice
                || 'SocietySimplify supports election administration and results recording only. Votes are cast and counted offline by the society.'}
            </p>

            <div className="mt-4 space-y-4">
              {(electionDetail.positions || []).map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="font-bold text-slate-950">{p.title}</p>
                  <ul className="mt-2 space-y-2">
                    {(p.candidates || []).map((c) => (
                      <li key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {c.fullName}
                          {c.winner && <span className="badge ml-2 bg-emerald-100 text-emerald-700">Winner</span>}
                        </p>
                        {c.flatNumber && <p className="text-xs text-slate-500">Flat {c.flatNumber}</p>}
                        {c.profileText && (
                          <p className="mt-1 break-words text-xs leading-5 text-slate-600">{c.profileText}</p>
                        )}
                      </li>
                    ))}
                    {(p.candidates || []).length === 0 && (
                      <p className="text-sm text-gray-400">No candidates recorded.</p>
                    )}
                  </ul>
                </div>
              ))}
              {(electionDetail.positions || []).length === 0 && (
                <p className="text-sm text-gray-400">Positions are not published yet.</p>
              )}
            </div>

            {electionDetail.resultSummary && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Declared result</p>
                <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-emerald-900">
                  {electionDetail.resultSummary}
                </p>
              </div>
            )}

            <button type="button" className="btn-secondary mt-6 w-full" onClick={() => setElectionDetail(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
