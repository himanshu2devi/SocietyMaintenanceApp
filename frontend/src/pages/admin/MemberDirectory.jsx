import { useEffect, useState } from 'react'
import { MemberService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'

const emptyForm = { fullName: '', flatNumber: '', mobile: '', email: '' }

export default function MemberDirectory() {
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState('')

  async function load() {
    try {
      setMembers(await MemberService.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load members.'))
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        ...form,
        email: form.email.trim() ? form.email.trim() : null,
      }
      await MemberService.add(payload)
      setForm(emptyForm)
      toast.success('Member added. Default password is their mobile number (needs email to sign in).')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add member.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editForm?.id) return
    setRowBusy(editForm.id)
    try {
      await MemberService.update(editForm.id, {
        fullName: editForm.fullName,
        flatNumber: editForm.flatNumber,
        mobile: editForm.mobile,
        email: editForm.email?.trim() ? editForm.email.trim() : null,
      })
      toast.success('Member updated.')
      setEditForm(null)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update member.'))
    } finally {
      setRowBusy('')
    }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Delete ${member.fullName} from the active directory? They will not be able to sign in. Records are kept for history.`)) {
      return
    }
    setRowBusy(member.id)
    try {
      await MemberService.deactivate(member.id)
      toast.info(`${member.fullName} removed from active members.`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete member.'))
    } finally {
      setRowBusy('')
    }
  }

  async function handleReactivate(member) {
    setRowBusy(member.id)
    try {
      await MemberService.reactivate(member.id)
      toast.success(`${member.fullName} restored.`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not restore member.'))
    } finally {
      setRowBusy('')
    }
  }

  const activeCount = members.filter((m) => m.active !== false).length

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card">
          <SectionTitle title="Add Member" subtitle="Register a resident" />
          <Alert type="error">{error}</Alert>
          <form onSubmit={handleAdd} className="mt-3 space-y-3">
            <div>
              <label className="label">Name</label>
              <input name="fullName" className="input" value={form.fullName} onChange={update} required />
            </div>
            <div>
              <label className="label">Flat Number</label>
              <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required placeholder="A-101" />
            </div>
            <div>
              <label className="label">Mobile</label>
              <input name="mobile" className="input" value={form.mobile} onChange={update} required />
            </div>
            <div>
              <label className="label">Email (for login)</label>
              <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="Recommended for sign-in" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Adding…' : 'Add Member'}
            </button>
            <p className="text-xs text-gray-400">
              Default password is the mobile number. Members need an email to sign in. They can use Forgot password on the login page.
            </p>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <SectionTitle title="Member Directory" subtitle={`${activeCount} active · ${members.length} total`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Flat</th>
                  <th className="py-2 pr-4">Mobile</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className={`border-b last:border-0 ${m.active === false ? 'opacity-60' : ''}`}>
                    <td className="py-3 pr-4 font-medium">{m.fullName}</td>
                    <td className="py-3 pr-4">{m.flatNumber}</td>
                    <td className="py-3 pr-4">{m.mobile}</td>
                    <td className="py-3 pr-4 text-gray-500">{m.email || '—'}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={m.active === false ? 'INACTIVE' : 'ACTIVE'} />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary !py-1.5 !text-xs"
                          disabled={rowBusy === m.id}
                          onClick={() => setEditForm({
                            id: m.id,
                            fullName: m.fullName || '',
                            flatNumber: m.flatNumber || '',
                            mobile: m.mobile || '',
                            email: m.email || '',
                          })}
                        >
                          Edit
                        </button>
                        {m.active === false ? (
                          <button
                            type="button"
                            className="btn-success !py-1.5 !text-xs"
                            disabled={rowBusy === m.id}
                            onClick={() => handleReactivate(m)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-warning !py-1.5 !text-xs"
                            disabled={rowBusy === m.id}
                            onClick={() => handleDelete(m)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-400">
                      No members yet. Add your first resident.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Edit member</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">Update details</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Flat number</label>
                <input className="input" value={editForm.flatNumber} onChange={(e) => setEditForm({ ...editForm, flatNumber: e.target.value })} required />
              </div>
              <div>
                <label className="label">Mobile</label>
                <input className="input" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email (for login)</label>
                <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Required for member sign-in" />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary flex-1" disabled={rowBusy === editForm.id}>
                {rowBusy === editForm.id ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setEditForm(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
