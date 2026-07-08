import { useEffect, useState } from 'react'
import { MaintenanceService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'

const now = new Date()
const emptyForm = {
  flatNumber: '',
  billingYear: now.getFullYear(),
  billingMonth: now.getMonth() + 1,
  amount: '',
  notes: '',
}

export default function MaintenanceTracker() {
  const [charges, setCharges] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setCharges(await MaintenanceService.list())
    } catch {
      setError('Could not load maintenance records.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function payload() {
    return {
      flatNumber: form.flatNumber,
      billingYear: Number(form.billingYear),
      billingMonth: Number(form.billingMonth),
      amount: Number(form.amount),
      notes: form.notes,
    }
  }

  async function submit(action) {
    setError('')
    setBusy(true)
    try {
      if (action === 'PAID') await MaintenanceService.collect(payload())
      else await MaintenanceService.markPending(payload())
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.')
    } finally {
      setBusy(false)
    }
  }

  async function togglePaid(charge) {
    try {
      if (charge.status === 'PENDING') {
        await MaintenanceService.markPaid(charge.id)
      } else {
        await MaintenanceService.markPending({
          flatNumber: charge.flatNumber,
          billingYear: charge.billingYear,
          billingMonth: charge.billingMonth,
          amount: charge.amount,
          notes: charge.notes,
        })
      }
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card">
          <SectionTitle title="Record Maintenance" subtitle="Collect or flag dues" />
          <Alert type="error">{error}</Alert>
          <form className="mt-3 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="label">Flat Number</label>
              <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required placeholder="A-101" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Year</label>
                <input name="billingYear" type="number" className="input" value={form.billingYear} onChange={update} />
              </div>
              <div>
                <label className="label">Month</label>
                <input name="billingMonth" type="number" min="1" max="12" className="input" value={form.billingMonth} onChange={update} />
              </div>
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <input name="amount" type="number" className="input" value={form.amount} onChange={update} required />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input name="notes" className="input" value={form.notes} onChange={update} />
            </div>
            <div className="flex gap-2">
              <button className="btn-success flex-1" disabled={busy} onClick={() => submit('PAID')}>
                Mark Paid
              </button>
              <button className="btn-warning flex-1" disabled={busy} onClick={() => submit('PENDING')}>
                Mark Pending
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <SectionTitle title="Maintenance Tracker" subtitle={`${charges.length} records`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Flat</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{c.flatNumber}</td>
                    <td className="py-2 pr-4">{c.billingMonth}/{c.billingYear}</td>
                    <td className="py-2 pr-4">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4"><StatusBadge status={c.status} /></td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => togglePaid(c)}
                        className={c.status === 'PENDING' ? 'btn-success' : 'btn-secondary'}
                      >
                        {c.status === 'PENDING' ? 'Mark Paid' : 'Mark Pending'}
                      </button>
                    </td>
                  </tr>
                ))}
                {charges.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400">
                      No maintenance records yet.
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
