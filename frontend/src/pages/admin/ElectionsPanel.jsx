import { useEffect, useState } from 'react'
import { ElectionService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { formatNoticeDate } from '../../utils/share'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const STATUSES = ['DRAFT', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'CLOSED', 'RESULTS_PUBLISHED']

/** Mirrors ElectionService.ALLOWED_TRANSITIONS on the backend. */
const NEXT_STATUSES = {
  DRAFT: ['NOMINATIONS_OPEN', 'CLOSED'],
  NOMINATIONS_OPEN: ['VOTING_OPEN', 'CLOSED'],
  VOTING_OPEN: ['CLOSED'],
  CLOSED: ['RESULTS_PUBLISHED'],
  RESULTS_PUBLISHED: [],
}

const statusColor = {
  DRAFT: 'bg-slate-100 text-slate-600',
  NOMINATIONS_OPEN: 'bg-sky-50 text-sky-700',
  VOTING_OPEN: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-slate-200 text-slate-700',
  RESULTS_PUBLISHED: 'bg-emerald-50 text-emerald-700',
}

const emptyForm = {
  title: '',
  description: '',
  nominationStart: '',
  nominationEnd: '',
  votingStart: '',
  votingEnd: '',
}

const emptyPosition = { title: '', sortOrder: '' }
const emptyCandidate = { positionId: '', fullName: '', flatNumber: '', profileText: '' }

function statusLabel(value) {
  return String(value || '').replaceAll('_', ' ')
}

/** `datetime-local` value <-> backend Instant. */
function toLocalInput(instant) {
  if (!instant) return ''
  const d = new Date(instant)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toInstant(localValue) {
  if (!localValue) return null
  const d = new Date(localValue)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export default function ElectionsPanel() {
  const toast = useToast()
  const [elections, setElections] = useState([])
  const [filters, setFilters] = useState({ status: '', q: '' })
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [positionForm, setPositionForm] = useState(emptyPosition)
  const [candidateForm, setCandidateForm] = useState(emptyCandidate)
  const [winners, setWinners] = useState([])
  const [resultSummary, setResultSummary] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    try {
      const res = await ElectionService.list({
        status: filters.status || undefined,
        q: filters.q.trim() || undefined,
        size: 100,
      })
      setElections(pageContent(res))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load elections.'))
    }
  }

  useEffect(() => {
    load()
  }, [filters.status])

  function applyDetail(next) {
    setDetail(next)
    setWinners(
      (next?.positions || [])
        .flatMap((p) => p.candidates || [])
        .filter((c) => c.winner)
        .map((c) => c.id),
    )
    setResultSummary(next?.resultSummary || '')
  }

  async function openDetail(id) {
    setError('')
    setBusy('detail')
    try {
      applyDetail(await ElectionService.get(id))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open this election.'))
    } finally {
      setBusy('')
    }
  }

  function startEdit(election) {
    setEditingId(election.id)
    setForm({
      title: election.title || '',
      description: election.description || '',
      nominationStart: toLocalInput(election.nominationStart),
      nominationEnd: toLocalInput(election.nominationEnd),
      votingStart: toLocalInput(election.votingStart),
      votingEnd: toLocalInput(election.votingEnd),
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
      description: text(form.description, 'Description', { required: false, max: 8000 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      nominationStart: toInstant(form.nominationStart),
      nominationEnd: toInstant(form.nominationEnd),
      votingStart: toInstant(form.votingStart),
      votingEnd: toInstant(form.votingEnd),
    }
    setBusy('save')
    try {
      if (editingId) {
        const updated = await ElectionService.update(editingId, payload)
        if (detail?.id === editingId) applyDetail(updated)
        toast.success('Election updated.')
      } else {
        const created = await ElectionService.create(payload)
        applyDetail(created)
        toast.success('Election created as DRAFT. Add positions next.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingId ? 'Could not update election.' : 'Could not create election.'))
    } finally {
      setBusy('')
    }
  }

  async function changeStatus(status) {
    if (!detail) return
    setBusy('status')
    try {
      applyDetail(await ElectionService.setStatus(detail.id, status))
      toast.success(`Election moved to ${statusLabel(status)}.`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not change election status.'))
    } finally {
      setBusy('')
    }
  }

  async function addPosition(e) {
    e.preventDefault()
    if (!detail) return
    if (!positionForm.title.trim()) {
      toast.error('Position title is required.')
      return
    }
    setBusy('position')
    try {
      applyDetail(await ElectionService.addPosition(detail.id, {
        title: positionForm.title.trim(),
        sortOrder: positionForm.sortOrder === '' ? null : Number(positionForm.sortOrder),
      }))
      setPositionForm(emptyPosition)
      toast.success('Position added.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add position.'))
    } finally {
      setBusy('')
    }
  }

  async function removePosition(position) {
    if (!detail) return
    if (!window.confirm(`Remove position “${position.title}” and its candidates?`)) return
    setBusy('position')
    try {
      applyDetail(await ElectionService.removePosition(detail.id, position.id))
      toast.success('Position removed.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove position.'))
    } finally {
      setBusy('')
    }
  }

  async function addCandidate(e) {
    e.preventDefault()
    if (!detail) return
    if (!candidateForm.positionId) {
      toast.error('Pick the position this candidate is contesting.')
      return
    }
    if (!candidateForm.fullName.trim()) {
      toast.error('Candidate name is required.')
      return
    }
    setBusy('candidate')
    try {
      applyDetail(await ElectionService.addCandidate(detail.id, {
        positionId: candidateForm.positionId,
        fullName: candidateForm.fullName.trim(),
        flatNumber: candidateForm.flatNumber.trim() || null,
        profileText: candidateForm.profileText.trim() || null,
      }))
      setCandidateForm({ ...emptyCandidate, positionId: candidateForm.positionId })
      toast.success('Candidate added.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not add candidate.'))
    } finally {
      setBusy('')
    }
  }

  async function removeCandidate(candidate) {
    if (!detail) return
    if (!window.confirm(`Remove candidate “${candidate.fullName}”?`)) return
    setBusy('candidate')
    try {
      applyDetail(await ElectionService.removeCandidate(detail.id, candidate.id))
      toast.success('Candidate removed.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove candidate.'))
    } finally {
      setBusy('')
    }
  }

  function toggleWinner(candidateId) {
    setWinners((prev) => (
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    ))
  }

  async function saveResults(e) {
    e.preventDefault()
    if (!detail) return
    if (!resultSummary.trim()) {
      toast.error('Add a short result summary declared by the society.')
      return
    }
    setBusy('results')
    try {
      applyDetail(await ElectionService.publishResults(detail.id, {
        winnerCandidateIds: winners,
        resultSummary: resultSummary.trim(),
      }))
      toast.success('Result recorded. Move the election to Results published when ready.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not record the result.'))
    } finally {
      setBusy('')
    }
  }

  async function removeElection(election) {
    if (!window.confirm(`Delete election “${election.title}”?`)) return
    setBusy('delete')
    try {
      await ElectionService.remove(election.id)
      if (detail?.id === election.id) setDetail(null)
      if (editingId === election.id) cancelEdit()
      toast.success('Election deleted.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete election.'))
    } finally {
      setBusy('')
    }
  }

  const positions = detail?.positions || []
  const allCandidates = positions.flatMap((p) => (p.candidates || []).map((c) => ({ ...c, positionTitle: p.title })))

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
        <p className="font-bold text-amber-950">
          Administration &amp; recorded results only — not secure electronic voting
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800/90">
          SocietySimplify keeps the nomination register, candidate list and the outcome your society declares.
          Votes must be cast and counted offline; the committee records the final result here.
        </p>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="card">
            <SectionTitle
              title={editingId ? 'Edit election' : 'Create election'}
              subtitle={editingId ? 'Update title, notes or the schedule' : 'Starts as DRAFT until you open nominations'}
            />
            <form onSubmit={save} className="space-y-3" noValidate>
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Managing committee election 2026"
                  maxLength={200}
                />
                {fieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.title}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={8000}
                />
                {fieldErrors.description && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Nominations open</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.nominationStart}
                    onChange={(e) => setForm({ ...form, nominationStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nominations close</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.nominationEnd}
                    onChange={(e) => setForm({ ...form, nominationEnd: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Voting starts</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.votingStart}
                    onChange={(e) => setForm({ ...form, votingStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Voting ends</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.votingEnd}
                    onChange={(e) => setForm({ ...form, votingEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary flex-1" disabled={busy === 'save'}>
                  {busy === 'save' ? 'Saving…' : editingId ? 'Save election' : 'Create election'}
                </button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <SectionTitle title="Elections" subtitle={`${elections.length} shown`} />
            <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
              <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            </div>
            <ul className="space-y-2">
              {elections.map((el) => (
                <li
                  key={el.id}
                  className={`rounded-xl border p-3 ${detail?.id === el.id ? 'border-teal-200 bg-teal-50/60' : 'border-slate-100'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-950">{el.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">Created {formatNoticeDate(el.createdAt)}</p>
                    </div>
                    <span className={`badge shrink-0 ${statusColor[el.status] || 'bg-slate-100 text-slate-600'}`}>
                      {statusLabel(el.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary !py-1.5 !text-xs"
                      onClick={() => openDetail(el.id)}
                      disabled={busy === 'detail'}
                    >
                      Manage
                    </button>
                    <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => startEdit(el)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                      onClick={() => removeElection(el)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {elections.length === 0 && (
                <p className="text-sm text-gray-400">No elections yet. Create one to start the register.</p>
              )}
            </ul>
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          {!detail ? (
            <div className="card">
              <SectionTitle title="Election workspace" subtitle="Pick Manage on an election to add positions, candidates and results" />
              <p className="text-sm text-gray-400">Nothing selected yet.</p>
            </div>
          ) : (
            <>
              <div className="card">
                <SectionTitle
                  title={detail.title}
                  subtitle={`Status · ${statusLabel(detail.status)}`}
                  action={
                    <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setDetail(null)}>
                      Close
                    </button>
                  }
                />
                {detail.description && (
                  <p className="break-words text-sm leading-6 text-slate-600">{detail.description}</p>
                )}
                <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-slate-100 sm:grid-cols-2">
                  {[
                    ['Nominations open', detail.nominationStart],
                    ['Nominations close', detail.nominationEnd],
                    ['Voting starts', detail.votingStart],
                    ['Voting ends', detail.votingEnd],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{value ? formatNoticeDate(value) : '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Move to</span>
                  {(NEXT_STATUSES[detail.status] || []).map((next) => (
                    <button
                      key={next}
                      type="button"
                      className="btn-secondary !py-1.5 !text-xs"
                      disabled={busy === 'status'}
                      onClick={() => changeStatus(next)}
                    >
                      {statusLabel(next)}
                    </button>
                  ))}
                  {(NEXT_STATUSES[detail.status] || []).length === 0 && (
                    <span className="text-sm text-slate-500">This election is final.</span>
                  )}
                </div>
                {detail.status === 'CLOSED' && !detail.resultSummary && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Record the declared result below before moving to Results published.
                  </p>
                )}
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="card">
                  <SectionTitle title="Positions" subtitle="Chairman, secretary, treasurer…" />
                  <form onSubmit={addPosition} className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]" noValidate>
                    <input
                      className="input"
                      value={positionForm.title}
                      onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                      placeholder="Secretary"
                      maxLength={120}
                    />
                    <input
                      type="number"
                      className="input"
                      value={positionForm.sortOrder}
                      onChange={(e) => setPositionForm({ ...positionForm, sortOrder: e.target.value })}
                      placeholder="Order"
                    />
                    <button className="btn-primary" disabled={busy === 'position'}>Add</button>
                  </form>
                  <ul className="space-y-2">
                    {positions.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-slate-900">{p.title}</p>
                          <p className="text-xs text-slate-500">{(p.candidates || []).length} candidate(s)</p>
                        </div>
                        <button
                          type="button"
                          className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                          disabled={busy === 'position'}
                          onClick={() => removePosition(p)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {positions.length === 0 && <p className="text-sm text-gray-400">No positions yet.</p>}
                  </ul>
                </div>

                <div className="card">
                  <SectionTitle title="Candidates" subtitle="Nominations recorded by the committee" />
                  <form onSubmit={addCandidate} className="mb-4 space-y-3" noValidate>
                    <select
                      className="input"
                      value={candidateForm.positionId}
                      onChange={(e) => setCandidateForm({ ...candidateForm, positionId: e.target.value })}
                    >
                      <option value="">Select position</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="input"
                        value={candidateForm.fullName}
                        onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                        placeholder="Candidate name"
                        maxLength={150}
                      />
                      <input
                        className="input"
                        value={candidateForm.flatNumber}
                        onChange={(e) => setCandidateForm({ ...candidateForm, flatNumber: e.target.value })}
                        placeholder="Flat number"
                        maxLength={30}
                      />
                    </div>
                    <textarea
                      className="input"
                      rows="2"
                      value={candidateForm.profileText}
                      onChange={(e) => setCandidateForm({ ...candidateForm, profileText: e.target.value })}
                      placeholder="Short profile shown to members"
                      maxLength={4000}
                    />
                    <button className="btn-primary w-full" disabled={busy === 'candidate' || positions.length === 0}>
                      {positions.length === 0 ? 'Add a position first' : 'Add candidate'}
                    </button>
                  </form>
                  <ul className="space-y-2">
                    {allCandidates.map((c) => (
                      <li key={c.id} className="rounded-xl border border-slate-100 px-3 py-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-900">
                              {c.fullName}
                              {c.winner && <span className="ml-2 badge bg-emerald-100 text-emerald-700">Winner</span>}
                            </p>
                            <p className="break-words text-xs text-slate-500">
                              {c.positionTitle}
                              {c.flatNumber ? ` · Flat ${c.flatNumber}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                            disabled={busy === 'candidate'}
                            onClick={() => removeCandidate(c)}
                          >
                            Remove
                          </button>
                        </div>
                        {c.profileText && (
                          <p className="mt-1 break-words text-xs leading-5 text-slate-600">{c.profileText}</p>
                        )}
                      </li>
                    ))}
                    {allCandidates.length === 0 && <p className="text-sm text-gray-400">No candidates yet.</p>}
                  </ul>
                </div>
              </div>

              <div className="card">
                <SectionTitle
                  title="Record declared result"
                  subtitle="Tick the winners your society declared offline, then save the summary."
                />
                <form onSubmit={saveResults} className="space-y-3" noValidate>
                  <div className="space-y-2">
                    {allCandidates.map((c) => (
                      <label key={c.id} className="flex items-start gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={winners.includes(c.id)}
                          onChange={() => toggleWinner(c.id)}
                        />
                        <span className="min-w-0">
                          <span className="break-words font-semibold text-slate-900">{c.fullName}</span>
                          <span className="block break-words text-xs text-slate-500">
                            {c.positionTitle}
                            {c.flatNumber ? ` · Flat ${c.flatNumber}` : ''}
                          </span>
                        </span>
                      </label>
                    ))}
                    {allCandidates.length === 0 && (
                      <p className="text-sm text-gray-400">Add candidates before recording a result.</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Result summary</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={resultSummary}
                      onChange={(e) => setResultSummary(e.target.value)}
                      placeholder="Counting done at the society office on 12 Apr in front of members…"
                      maxLength={8000}
                    />
                  </div>
                  <button className="btn-primary w-full sm:w-auto" disabled={busy === 'results'}>
                    {busy === 'results' ? 'Saving…' : 'Save recorded result'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
