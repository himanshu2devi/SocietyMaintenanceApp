import { useEffect, useState } from 'react'
import { BankAccountService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'

const empty = {
  accountName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
  primaryAccount: true,
  notes: '',
}

export default function SocietyAccounts() {
  const toast = useToast()
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setAccounts(await BankAccountService.list())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load bank accounts.'))
    }
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await BankAccountService.create(form)
      setForm(empty)
      toast.success('Bank account saved.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save bank account.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    try {
      await BankAccountService.remove(id)
      toast.success('Bank account removed.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not remove account.'))
    }
  }

  return (
    <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card lg:col-span-1">
        <SectionTitle title="Add society account" subtitle="Members will see these details to pay maintenance" />
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="label">Account name</label>
            <input className="input" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Bank name</label>
            <input className="input" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Account number</label>
            <input className="input" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />
          </div>
          <div>
            <label className="label">IFSC</label>
            <input className="input" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} required />
          </div>
          <div>
            <label className="label">Branch</label>
            <input className="input" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
          </div>
          <div>
            <label className="label">UPI ID (optional)</label>
            <input className="input" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.primaryAccount} onChange={(e) => setForm({ ...form, primaryAccount: e.target.checked })} />
            Primary account
          </label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save account'}</button>
          <p className="text-xs text-slate-400">Online payment is not enabled yet — this section only shows bank details.</p>
        </form>
      </div>
      <div className="card lg:col-span-2">
        <SectionTitle title="Society bank accounts" />
        <div className="grid gap-3">
          {accounts.map((a) => (
            <article key={a.id} className="min-w-0 rounded-xl border border-slate-100 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-slate-950">
                    <span className="break-words">{a.accountName}</span>
                    {a.primaryAccount && <span className="badge bg-orange-50 text-orange-700">Primary</span>}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-600">{a.bankName}{a.branchName ? ` · ${a.branchName}` : ''}</p>
                  <p className="mt-2 break-all text-sm"><span className="text-slate-500">A/C</span> {a.accountNumber}</p>
                  <p className="break-all text-sm"><span className="text-slate-500">IFSC</span> {a.ifscCode}</p>
                  {a.upiId && <p className="break-all text-sm"><span className="text-slate-500">UPI</span> {a.upiId}</p>}
                </div>
                <button type="button" className="self-start text-sm font-semibold text-red-600" onClick={() => remove(a.id)}>Remove</button>
              </div>
            </article>
          ))}
          {accounts.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No bank accounts yet.</p>}
        </div>
      </div>
    </div>
  )
}
