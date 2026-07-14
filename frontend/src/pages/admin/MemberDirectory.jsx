import { useEffect, useState } from 'react'
import { MemberService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  collectErrors,
  email,
  firstError,
  flatNumber,
  hasErrors,
  mobile,
  personName,
} from '../../utils/validation'

const emptyForm = { fullName: '', flatNumber: '', mobile: '', email: '' }

export default function MemberDirectory() {
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [editFieldErrors, setEditFieldErrors] = useState({})
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

  function validateMember(values) {
    return collectErrors({
      fullName: personName(values.fullName, 'Name'),
      flatNumber: flatNumber(values.flatNumber),
      mobile: mobile(values.mobile),
      email: email(values.email, { required: false }),
    })
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const errors = validateMember(form)
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    setBusy(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        flatNumber: form.flatNumber.trim(),
        mobile: form.mobile.trim().replace(/\s+/g, ''),
        email: form.email.trim() ? form.email.trim() : null,
      }
      await MemberService.add(payload)
      setForm(emptyForm)
      setFieldErrors({})
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
    const errors = validateMember(editForm)
    setEditFieldErrors(errors)
    if (hasErrors(errors)) {
      toast.error(firstError(errors))
      return
    }
    setRowBusy(editForm.id)
    try {
      await MemberService.update(editForm.id, {
        fullName: editForm.fullName.trim(),
        flatNumber: editForm.flatNumber.trim(),
        mobile: editForm.mobile.trim().replace(/\s+/g, ''),
        email: editForm.email?.trim() ? editForm.email.trim() : null,
      })
      toast.success('Member updated.')
      setEditForm(null)
      setEditFieldErrors({})
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
          <form onSubmit={handleAdd} className="mt-3 space-y-3" noValidate>
            <div>
              <label className="label">Name</label>
              <input name="fullName" className="input" value={form.fullName} onChange={update} maxLength={120} />
              {fieldErrors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.fullName}</p>}
            </div>
            <div>
              <label className="label">Flat Number</label>
              <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} placeholder="A-101" maxLength={30} />
              {fieldErrors.flatNumber && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.flatNumber}</p>}
            </div>
            <div>
              <label className="label">Mobile</label>
              <input name="mobile" className="input" value={form.mobile} onChange={update} inputMode="numeric" maxLength={10} />
              {fieldErrors.mobile && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.mobile}</p>}
            </div>
            <div>
              <label className="label">Email (for login)</label>
              <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="Recommended for sign-in" />
              {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>}
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
          <div className="table-scroll">
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
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" noValidate>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Edit member</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">Update details</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} maxLength={120} />
                {editFieldErrors.fullName && <p className="mt-1 text-xs font-medium text-red-600">{editFieldErrors.fullName}</p>}
              </div>
              <div>
                <label className="label">Flat number</label>
                <input className="input" value={editForm.flatNumber} onChange={(e) => setEditForm({ ...editForm, flatNumber: e.target.value })} maxLength={30} />
                {editFieldErrors.flatNumber && <p className="mt-1 text-xs font-medium text-red-600">{editFieldErrors.flatNumber}</p>}
              </div>
              <div>
                <label className="label">Mobile</label>
                <input className="input" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} inputMode="numeric" maxLength={10} />
                {editFieldErrors.mobile && <p className="mt-1 text-xs font-medium text-red-600">{editFieldErrors.mobile}</p>}
              </div>
              <div>
                <label className="label">Email (for login)</label>
                <input type="email" className="input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Required for member sign-in" />
                {editFieldErrors.email && <p className="mt-1 text-xs font-medium text-red-600">{editFieldErrors.email}</p>}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary flex-1" disabled={rowBusy === editForm.id}>
                {rowBusy === editForm.id ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => { setEditForm(null); setEditFieldErrors({}) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
