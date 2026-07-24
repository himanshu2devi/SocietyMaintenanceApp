import { useEffect, useState } from 'react'
import { NoticeService, RuleService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { buildNoticeWhatsAppText, formatNoticeDate, whatsappLink } from '../../utils/share'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const emptyNotice = { title: '', body: '', priority: 'NORMAL' }
const emptyRule = { category: '', title: '', ruleText: '' }

export default function NoticeBoard() {
  const { user } = useAuth()
  const toast = useToast()
  const [notices, setNotices] = useState([])
  const [rules, setRules] = useState([])
  const [noticeForm, setNoticeForm] = useState(emptyNotice)
  const [ruleForm, setRuleForm] = useState(emptyRule)
  const [editingNoticeId, setEditingNoticeId] = useState(null)
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [noticeFieldErrors, setNoticeFieldErrors] = useState({})
  const [ruleFieldErrors, setRuleFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [notifyBusy, setNotifyBusy] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    try {
      const [n, r] = await Promise.all([NoticeService.list(), RuleService.list()])
      setNotices(n)
      setRules(r)
    } catch {
      setError('Could not load notices/rules.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEditNotice(n) {
    setEditingNoticeId(n.id)
    setNoticeForm({ title: n.title || '', body: n.body || '', priority: n.priority || 'NORMAL' })
    setNoticeFieldErrors({})
    setError('')
  }

  function cancelNoticeEdit() {
    setEditingNoticeId(null)
    setNoticeForm(emptyNotice)
    setNoticeFieldErrors({})
  }

  function startEditRule(r) {
    setEditingRuleId(r.id)
    setRuleForm({ category: r.category || '', title: r.title || '', ruleText: r.ruleText || '' })
    setRuleFieldErrors({})
    setError('')
  }

  function cancelRuleEdit() {
    setEditingRuleId(null)
    setRuleForm(emptyRule)
    setRuleFieldErrors({})
  }

  async function saveNotice(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      title: text(noticeForm.title, 'Title', { min: 3, max: 250 }),
      body: text(noticeForm.body, 'Message', { min: 3, max: 4000 }),
    })
    setNoticeFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      title: noticeForm.title.trim(),
      body: noticeForm.body.trim(),
      priority: noticeForm.priority,
    }
    setBusy('notice')
    try {
      if (editingNoticeId) {
        await NoticeService.update(editingNoticeId, payload)
        toast.success('Notice updated.')
      } else {
        await NoticeService.create(payload)
        toast.success('Notice posted. Use Notify members when ready.')
      }
      cancelNoticeEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingNoticeId ? 'Could not update notice.' : 'Could not post notice.'))
    } finally {
      setBusy('')
    }
  }

  async function saveRule(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      category: text(ruleForm.category, 'Category', { min: 2, max: 80 }),
      title: text(ruleForm.title, 'Title', { min: 3, max: 250 }),
      ruleText: text(ruleForm.ruleText, 'Rule text', { min: 3, max: 4000 }),
    })
    setRuleFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      category: ruleForm.category.trim(),
      title: ruleForm.title.trim(),
      ruleText: ruleForm.ruleText.trim(),
    }
    setBusy('rule')
    try {
      if (editingRuleId) {
        await RuleService.update(editingRuleId, payload)
        toast.success('Rule updated.')
      } else {
        await RuleService.create(payload)
        toast.success('Rule added.')
      }
      cancelRuleEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingRuleId ? 'Could not update rule.' : 'Could not add rule.'))
    } finally {
      setBusy('')
    }
  }

  async function deleteNotice(n) {
    if (!window.confirm(`Delete notice “${n.title}”?`)) return
    try {
      await NoticeService.remove(n.id)
      toast.success('Notice deleted.')
      if (editingNoticeId === n.id) cancelNoticeEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete notice.'))
    }
  }

  async function deleteRule(r) {
    if (!window.confirm(`Delete rule “${r.title}”?`)) return
    try {
      await RuleService.remove(r.id)
      toast.success('Rule deleted.')
      if (editingRuleId === r.id) cancelRuleEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete rule.'))
    }
  }

  async function notifyMembers(notice) {
    setNotifyBusy(notice.id)
    setError('')
    try {
      await NoticeService.notify(notice.id)
      toast.success('Members notified. They will see a notice badge on their dashboard.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not notify members.'))
    } finally {
      setNotifyBusy('')
    }
  }

  function shareNoticeWhatsApp(notice) {
    window.open(
      whatsappLink(buildNoticeWhatsAppText(notice, user?.societyName || 'Society')),
      '_blank',
      'noopener,noreferrer',
    )
  }

  const priorityColor = {
    URGENT: 'bg-red-100 text-red-700',
    HIGH: 'bg-amber-100 text-amber-700',
    NORMAL: 'bg-sky-50 text-sky-700',
    LOW: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <SectionTitle
            title={editingNoticeId ? 'Edit announcement' : 'Post announcement'}
            subtitle={editingNoticeId ? 'Update and save changes instantly' : 'Broadcast to all members'}
          />
          <form onSubmit={saveNotice} className="space-y-3" noValidate>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                maxLength={250}
              />
              {noticeFieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{noticeFieldErrors.title}</p>}
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input"
                rows="3"
                value={noticeForm.body}
                onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
                maxLength={4000}
              />
              {noticeFieldErrors.body && <p className="mt-1 text-xs font-medium text-red-600">{noticeFieldErrors.body}</p>}
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={noticeForm.priority}
                onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
              >
                {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={busy === 'notice'}>
                {busy === 'notice' ? 'Saving…' : editingNoticeId ? 'Save notice' : 'Post notice'}
              </button>
              {editingNoticeId && (
                <button type="button" className="btn-secondary" onClick={cancelNoticeEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <SectionTitle
            title={editingRuleId ? 'Edit rule' : 'Add rule'}
            subtitle={editingRuleId ? 'Update society rule text' : 'Society rules & bylaws'}
          />
          <form onSubmit={saveRule} className="space-y-3" noValidate>
            <div>
              <label className="label">Category</label>
              <input
                className="input"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                placeholder="Parking, Pets, Noise…"
                maxLength={80}
              />
              {ruleFieldErrors.category && <p className="mt-1 text-xs font-medium text-red-600">{ruleFieldErrors.category}</p>}
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={ruleForm.title}
                onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                maxLength={250}
              />
              {ruleFieldErrors.title && <p className="mt-1 text-xs font-medium text-red-600">{ruleFieldErrors.title}</p>}
            </div>
            <div>
              <label className="label">Rule text</label>
              <textarea
                className="input"
                rows="3"
                value={ruleForm.ruleText}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleText: e.target.value })}
                maxLength={4000}
              />
              {ruleFieldErrors.ruleText && <p className="mt-1 text-xs font-medium text-red-600">{ruleFieldErrors.ruleText}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={busy === 'rule'}>
                {busy === 'rule' ? 'Saving…' : editingRuleId ? 'Save rule' : 'Add rule'}
              </button>
              {editingRuleId && (
                <button type="button" className="btn-secondary" onClick={cancelRuleEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <SectionTitle title="Notice board" subtitle={`${notices.length} notices`} />
          <ul className="space-y-3">
            {notices.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-slate-950">{n.title}</h4>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {formatNoticeDate(n.createdAt)}
                      {n.createdByName ? ` · ${n.createdByName}` : ''}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${priorityColor[n.priority] || ''}`}>{n.priority}</span>
                </div>
                <p className="mt-2 break-words text-sm leading-6 text-slate-600">{n.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.notifiedAt ? (
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                      Members notified
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary !py-1.5 !text-xs"
                      disabled={notifyBusy === n.id}
                      onClick={() => notifyMembers(n)}
                    >
                      {notifyBusy === n.id ? 'Notifying…' : 'Notify members'}
                    </button>
                  )}
                  <button type="button" className="btn-success !py-1.5 !text-xs" onClick={() => shareNoticeWhatsApp(n)}>
                    Share on WhatsApp
                  </button>
                  <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => startEditNotice(n)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                    onClick={() => deleteNotice(n)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {notices.length === 0 && <p className="text-sm text-gray-400">No notices yet.</p>}
          </ul>
        </div>

        <div className="card">
          <SectionTitle title="Society rules" subtitle={`${rules.length} rules`} />
          <ul className="space-y-3">
            {rules.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-100 p-4">
                <span className="badge bg-orange-50 text-orange-700">{r.category}</span>
                <h4 className="mt-2 font-semibold text-slate-950">{r.title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{r.ruleText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => startEditRule(r)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                    onClick={() => deleteRule(r)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {rules.length === 0 && <p className="text-sm text-gray-400">No rules yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
