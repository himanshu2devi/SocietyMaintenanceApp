import { useEffect, useState } from 'react'
import { ExpenseService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'

const today = new Date().toISOString().slice(0, 10)
const categories = ['Security', 'Housekeeping', 'Repairs', 'Utilities', 'Admin', 'Miscellaneous']
const emptyForm = {
  category: 'Security',
  title: '',
  description: '',
  amount: '',
  expenseDate: today,
  vendorName: '',
  billId: '',
}

export default function ExpenseLogger() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      setExpenses(await ExpenseService.list())
    } catch {
      setError('Could not load expenses.')
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
    const billId = (form.billId || '').trim()
    if (!billId) {
      setError('Bill ID is required. Enter the invoice number, or N/A if not available.')
      return
    }
    setBusy(true)
    try {
      await ExpenseService.create({ ...form, billId, amount: Number(form.amount) })
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add expense.')
    } finally {
      setBusy(false)
    }
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card">
          <SectionTitle title="Log Expense" subtitle="Record a society expense" />
          <Alert type="error">{error}</Alert>
          <form onSubmit={handleAdd} className="mt-3 space-y-3">
            <div>
              <label className="label">Category</label>
              <select name="category" className="input" value={form.category} onChange={update}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input name="title" className="input" value={form.title} onChange={update} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" rows="2" className="input" value={form.description} onChange={update} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input name="amount" type="number" className="input" value={form.amount} onChange={update} required />
              </div>
              <div>
                <label className="label">Date</label>
                <input name="expenseDate" type="date" className="input" value={form.expenseDate} onChange={update} required />
              </div>
            </div>
            <div>
              <label className="label">Bill ID</label>
              <input
                name="billId"
                className="input"
                value={form.billId}
                onChange={update}
                required
                maxLength={80}
                placeholder="Invoice / bill no. or N/A"
              />
            </div>
            <div>
              <label className="label">Vendor (optional)</label>
              <input name="vendorName" className="input" value={form.vendorName} onChange={update} />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Saving…' : 'Add Expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <SectionTitle
            title="Expense Log"
            subtitle={`Total: ₹${total.toLocaleString('en-IN')}`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Bill ID</th>
                  <th className="py-2 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{e.expenseDate}</td>
                    <td className="py-2 pr-4">
                      <span className="badge bg-brand-50 text-brand-700">{e.category}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium">{e.title}</div>
                      {e.description && <div className="text-xs text-gray-400">{e.description}</div>}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.billId || 'N/A'}</td>
                    <td className="py-2 pr-4">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400">
                      No expenses logged yet.
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
