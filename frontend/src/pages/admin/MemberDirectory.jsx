import { useEffect, useState } from 'react'
import { MemberService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'

const emptyForm = { fullName: '', flatNumber: '', mobile: '', email: '' }

export default function MemberDirectory() {
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
      toast.success('Member added successfully.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add member.'))
    } finally {
      setBusy(false)
    }
  }

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
              <label className="label">Email (optional)</label>
              <input name="email" type="email" className="input" value={form.email} onChange={update} placeholder="Leave blank if not available" />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Adding…' : 'Add Member'}
            </button>
            <p className="text-xs text-gray-400">
              Default login password is the member's mobile number. Email is optional.
            </p>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <SectionTitle title="Member Directory" subtitle={`${members.length} members`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Flat</th>
                  <th className="py-2 pr-4">Mobile</th>
                  <th className="py-2 pr-4">Email</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m.fullName}</td>
                    <td className="py-2 pr-4">{m.flatNumber}</td>
                    <td className="py-2 pr-4">{m.mobile}</td>
                    <td className="py-2 pr-4 text-gray-500">{m.email || '—'}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400">
                      No members yet. Add your first resident.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
