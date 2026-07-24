import { useEffect, useState } from 'react'
import { AuditDocumentService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { monthName } from '../../utils/share'

const now = new Date()
const empty = {
  title: '',
  description: '',
  periodType: 'MONTHLY',
  periodYear: now.getFullYear(),
  periodMonth: now.getMonth() + 1,
  documentUrl: '',
  fileName: '',
}

export default function AuditDocuments() {
  const toast = useToast()
  const [docs, setDocs] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setDocs(await AuditDocumentService.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load audit documents.'))
    }
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        ...form,
        periodMonth: form.periodType === 'MONTHLY' ? Number(form.periodMonth) : null,
        periodYear: Number(form.periodYear),
      }
      await AuditDocumentService.create(payload)
      setForm(empty)
      toast.success('Audit document added.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save document.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    try {
      await AuditDocumentService.remove(id)
      toast.success('Document deleted.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete.'))
    }
  }

  return (
    <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-1">
        <SectionTitle title="Add audit report" subtitle="Monthly / annual files for members to view" />
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Period type</label>
            <select className="input" value={form.periodType} onChange={(e) => setForm({ ...form, periodType: e.target.value })}>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Year</label>
              <input type="number" className="input" value={form.periodYear} onChange={(e) => setForm({ ...form, periodYear: e.target.value })} required />
            </div>
            {form.periodType === 'MONTHLY' && (
              <div>
                <label className="label">Month</label>
                <select className="input" value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: e.target.value })}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{monthName(m)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">Document URL</label>
            <input className="input" value={form.documentUrl} onChange={(e) => setForm({ ...form, documentUrl: e.target.value })} required placeholder="https://..." />
          </div>
          <div>
            <label className="label">File name (optional)</label>
            <input className="input" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Publish document'}</button>
        </form>
      </div>
      <div className="card lg:col-span-2">
        <SectionTitle title="Audit library" />
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950">{doc.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.periodType} · {doc.periodMonth ? `${monthName(doc.periodMonth)} ` : ''}{doc.periodYear}
                    {doc.createdByName ? ` · by ${doc.createdByName}` : ''}
                  </p>
                  {doc.description && <p className="mt-2 text-sm text-slate-600">{doc.description}</p>}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  <a className="btn-secondary w-full !py-2 sm:w-auto" href={doc.documentUrl} target="_blank" rel="noreferrer">Open / download</a>
                  <button type="button" className="text-sm font-semibold text-red-600 sm:px-1" onClick={() => remove(doc.id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
          {docs.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No audit documents yet.</p>}
        </ul>
      </div>
    </div>
  )
}
