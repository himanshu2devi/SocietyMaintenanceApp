import { useEffect, useState } from 'react'
import { PaymentClaimService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { monthName, whatsappLink } from '../../utils/share'

function formatPaymentMode(mode) {
  if (!mode) return '—'
  const value = String(mode).toUpperCase()
  if (value === 'CASH') return 'Cash'
  if (value === 'ONLINE' || value === 'BANK_TRANSFER' || value === 'UPI' || value === 'NEFT') return 'Online'
  return mode
}

function periodLabel(claim) {
  if (!claim.billingMonth || !claim.billingYear) return '—'
  return `${monthName(claim.billingMonth)} ${claim.billingYear}`
}

export default function PaymentClaims({ onNavigate, onClaimsChanged }) {
  const toast = useToast()
  const [claims, setClaims] = useState([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('SUBMITTED')
  const [busyId, setBusyId] = useState('')
  const [approvePrompt, setApprovePrompt] = useState(null)

  async function load() {
    try {
      setClaims(await PaymentClaimService.list(filter || undefined))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load payment claims.'))
    }
  }

  useEffect(() => { load() }, [filter])

  async function review(claim, decision) {
    setBusyId(claim.id)
    try {
      const mode = claim.paymentMode === 'CASH' ? 'CASH' : 'ONLINE'
      await PaymentClaimService.review(claim.id, {
        decision,
        paymentMode: decision === 'APPROVED' ? mode : undefined,
      })
      if (decision === 'APPROVED') {
        setApprovePrompt(claim)
        toast.success('Claim approved. Maintenance marked paid.')
      } else {
        toast.info('Claim rejected. Member can pay again and resubmit.')
      }
      await load()
      await onClaimsChanged?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not review claim.'))
    } finally {
      setBusyId('')
    }
  }

  function shareWhatsApp(claim) {
    const text = [
      `Payment verification request`,
      `Member: ${claim.memberName}`,
      `Flat: ${claim.flatNumber}`,
      `Period: ${periodLabel(claim)}`,
      `Amount: ₹${Number(claim.amount).toLocaleString('en-IN')}`,
      `Mode: ${formatPaymentMode(claim.paymentMode)}`,
      `Reference: ${claim.referenceNumber || '—'}`,
    ].join('\n')
    window.open(whatsappLink(text), '_blank')
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="card">
        <SectionTitle
          title="Payment claims"
          subtitle="Members notify after paying. Verify, then approve — Maintenance updates automatically."
          action={
            <select className="input w-full sm:w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="">All</option>
            </select>
          }
        />
        <Alert type="error">{error}</Alert>
        <div className="table-scroll">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Member</th>
                <th className="py-2 pr-4">Flat</th>
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4 font-medium text-slate-900">{c.memberName}</td>
                  <td className="py-3 pr-4">{c.flatNumber}</td>
                  <td className="py-3 pr-4">{periodLabel(c)}</td>
                  <td className="py-3 pr-4">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                  <td className="py-3 pr-4">
                    <span className="badge bg-sky-50 text-sky-700">{formatPaymentMode(c.paymentMode)}</span>
                  </td>
                  <td className="py-3 pr-4">{c.referenceNumber || '—'}</td>
                  <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-secondary !py-1.5 !text-xs" onClick={() => shareWhatsApp(c)}>WhatsApp</button>
                      {c.status === 'SUBMITTED' && (
                        <>
                          <button
                            type="button"
                            className="btn-success !py-1.5 !text-xs"
                            disabled={busyId === c.id}
                            onClick={() => review(c, 'APPROVED')}
                          >
                            {busyId === c.id ? '…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="btn-warning !py-1.5 !text-xs"
                            disabled={busyId === c.id}
                            onClick={() => review(c, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    <p className="font-medium text-slate-500">No claims in this filter yet.</p>
                    <p className="mt-2 text-sm">
                      Members submit from their dashboard with <span className="font-semibold">Claim payment</span>.
                      New claims appear here with Approve / Reject.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {approvePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/20">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-600">Payment approved</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">Update this payment in Maintenance</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {approvePrompt.memberName} (Flat {approvePrompt.flatNumber}) · {periodLabel(approvePrompt)} ·{' '}
              ₹{Number(approvePrompt.amount).toLocaleString('en-IN')} via {formatPaymentMode(approvePrompt.paymentMode)}.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This period is now marked <span className="font-semibold text-emerald-700">PAID</span> in Maintenance
              and stays in sync on the member dashboard. Open Maintenance to review the tracker.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  setApprovePrompt(null)
                  onNavigate?.('maintenance')
                }}
              >
                Open Maintenance
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setApprovePrompt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
