import { useEffect, useState } from 'react'
import { CommitteeService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'

const empty = { fullName: '', title: 'SECRETARY', mobile: '', email: '', displayOrder: 0 }

export default function CommitteeDirectory() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setItems(await CommitteeService.list(true))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load committee.'))
    }
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await CommitteeService.create(form)
      setForm(empty)
      toast.success('Committee member added.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save committee member.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    try {
      await CommitteeService.remove(id)
      toast.success('Committee member removed.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove.'))
    }
  }

  return (
    <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-1">
        <SectionTitle title="Add committee member" subtitle="Chairman, secretary, treasurer" />
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Title</label>
            <select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
              <option value="CHAIRMAN">Chairman</option>
              <option value="SECRETARY">Secretary</option>
              <option value="TREASURER">Treasurer</option>
              <option value="COMMITTEE_MEMBER">Committee member</option>
            </select>
          </div>
          <div>
            <label className="label">Mobile</label>
            <input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Add to committee'}</button>
        </form>
      </div>
      <div className="card lg:col-span-2">
        <SectionTitle title="Committee directory" subtitle="Visible to all society members" />
        <div className="table-scroll">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{item.fullName}</td>
                  <td className="py-2 pr-4">{item.title.replaceAll('_', ' ')}</td>
                  <td className="max-w-[14rem] py-2 pr-4 text-gray-600">
                    <span className="block">{item.mobile || '—'}</span>
                    {item.email ? <span className="block break-all text-xs text-slate-500">{item.email}</span> : null}
                  </td>
                  <td className="py-2 pr-4">{item.active ? 'Active' : 'Inactive'}</td>
                  <td className="py-2 pr-4 text-right">
                    {item.active && (
                      <button type="button" className="text-sm font-semibold text-red-600" onClick={() => remove(item.id)}>Remove</button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="5" className="py-6 text-center text-gray-400">No committee profiles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
