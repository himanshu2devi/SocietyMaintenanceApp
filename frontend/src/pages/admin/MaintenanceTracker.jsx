import { useEffect, useMemo, useState } from 'react'
import { MaintenanceRateService, MaintenanceService, MemberService } from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { inr, monthName } from '../../utils/share'

const now = new Date()
const emptyForm = {
  memberId: '',
  flatNumber: '',
  billingYear: now.getFullYear(),
  billingMonth: now.getMonth() + 1,
  amount: '',
  notes: '',
}

function normalizeFlat(value) {
  return String(value || '').trim().toLowerCase()
}

function periodKey(year, month) {
  return Number(year) * 100 + Number(month)
}

/** Latest rate whose effective-from is on or before the target period. */
function effectiveAmountFor(rates, year, month) {
  const target = periodKey(year, month)
  const applicable = rates
    .filter((r) => periodKey(r.effectiveFromYear, r.effectiveFromMonth) <= target)
    .sort((a, b) => periodKey(b.effectiveFromYear, b.effectiveFromMonth) - periodKey(a.effectiveFromYear, a.effectiveFromMonth))
  return applicable[0] || null
}

function memberLabel(m) {
  return `${m.fullName} · Flat ${m.flatNumber}${m.mobile ? ` · ${m.mobile}` : ''}`
}

export default function MaintenanceTracker() {
  const toast = useToast()
  const [charges, setCharges] = useState([])
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [flatFilter, setFlatFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [trackerYear, setTrackerYear] = useState(now.getFullYear())
  const [trackerMonth, setTrackerMonth] = useState(now.getMonth() + 1)
  const [trackerBusyKey, setTrackerBusyKey] = useState('')
  const [rates, setRates] = useState([])
  const [rateForm, setRateForm] = useState({
    amount: '',
    effectiveFromYear: now.getFullYear(),
    effectiveFromMonth: now.getMonth() + 1,
    notes: '',
  })
  const [rateBusy, setRateBusy] = useState(false)

  async function load() {
    try {
      const [chargeList, memberList, rateList] = await Promise.all([
        MaintenanceService.list(),
        MemberService.list(),
        MaintenanceRateService.list(),
      ])
      setCharges(chargeList)
      setMembers(memberList.filter((m) => m.active !== false))
      setRates(rateList)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load maintenance records.'))
    }
  }

  useEffect(() => { load() }, [])

  const membersById = useMemo(() => {
    const map = {}
    members.forEach((m) => { map[m.id] = m })
    return map
  }, [members])

  const membersByFlat = useMemo(() => {
    const map = {}
    members.forEach((m) => {
      const key = normalizeFlat(m.flatNumber)
      if (!key) return
      if (!map[key]) map[key] = m
    })
    return map
  }, [members])

  function resolveMember(charge) {
    if (charge.memberId && membersById[charge.memberId]) return membersById[charge.memberId]
    return membersByFlat[normalizeFlat(charge.flatNumber)] || null
  }

  const enriched = useMemo(
    () => charges.map((c) => {
      const member = resolveMember(c)
      return {
        ...c,
        memberName: member?.fullName || 'Unknown member',
        memberMobile: member?.mobile || '',
        memberEmail: member?.email || '',
        memberActive: member?.active !== false,
        matched: !!member,
      }
    }),
    [charges, membersById, membersByFlat],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter((c) => {
      if (flatFilter && normalizeFlat(c.flatNumber) !== normalizeFlat(flatFilter)) return false
      if (!q) return true
      return (
        c.memberName.toLowerCase().includes(q)
        || String(c.flatNumber).toLowerCase().includes(q)
        || String(c.memberMobile).includes(q)
        || String(c.memberEmail).toLowerCase().includes(q)
      )
    })
  }, [enriched, flatFilter, search])

  const flats = useMemo(
    () => [...new Set(charges.map((c) => c.flatNumber))].sort((a, b) => String(a).localeCompare(String(b))),
    [charges],
  )

  const byMember = useMemo(() => {
    const map = {}
    for (const c of filtered) {
      const key = normalizeFlat(c.flatNumber) || c.id
      if (!map[key]) {
        map[key] = {
          flatNumber: c.flatNumber,
          memberName: c.memberName,
          memberMobile: c.memberMobile,
          pending: 0,
          paid: 0,
          count: 0,
        }
      }
      map[key].count += 1
      if (c.status === 'PENDING') map[key].pending += Number(c.amount)
      else map[key].paid += Number(c.amount)
    }
    return Object.values(map).sort((a, b) => a.memberName.localeCompare(b.memberName))
  }, [filtered])

  /** One row per registered member for the selected tracker month/year. */
  const periodRate = useMemo(
    () => effectiveAmountFor(rates, trackerYear, trackerMonth),
    [rates, trackerYear, trackerMonth],
  )

  const periodRows = useMemo(() => {
    const year = Number(trackerYear)
    const month = Number(trackerMonth)
    const scheduledAmount = periodRate ? Number(periodRate.amount) : 0
    return members
      .slice()
      .sort((a, b) => String(a.flatNumber).localeCompare(String(b.flatNumber)) || a.fullName.localeCompare(b.fullName))
      .map((member) => {
        const charge = charges.find(
          (c) =>
            Number(c.billingYear) === year
            && Number(c.billingMonth) === month
            && (
              (c.memberId && c.memberId === member.id)
              || normalizeFlat(c.flatNumber) === normalizeFlat(member.flatNumber)
            ),
        )

        return {
          key: member.id,
          memberId: member.id,
          memberName: member.fullName,
          memberMobile: member.mobile || '',
          memberEmail: member.email || '',
          flatNumber: member.flatNumber,
          billingYear: year,
          billingMonth: month,
          chargeId: charge?.id || null,
          // Recorded charges keep historical amount; unrecorded rows use timeline rate.
          amount: charge ? Number(charge.amount) : scheduledAmount,
          status: charge?.status || 'PENDING',
          notes: charge?.notes || '',
          isVirtual: !charge,
          usesSchedule: !charge,
        }
      })
  }, [members, charges, trackerYear, trackerMonth, periodRate])

  const periodStats = useMemo(() => {
    const paid = periodRows.filter((r) => r.status === 'PAID').length
    const pending = periodRows.length - paid
    return { paid, pending, total: periodRows.length }
  }, [periodRows])

  function selectMember(memberId) {
    const member = membersById[memberId]
    setForm((prev) => ({
      ...prev,
      memberId,
      flatNumber: member?.flatNumber || prev.flatNumber,
    }))
  }

  function update(e) {
    const { name, value } = e.target
    if (name === 'memberId') {
      selectMember(value)
      return
    }
    setForm({ ...form, [name]: value })
  }

  function payload() {
    return {
      flatNumber: form.flatNumber,
      billingYear: Number(form.billingYear),
      billingMonth: Number(form.billingMonth),
      amount: Number(form.amount),
      notes: form.notes,
      memberId: form.memberId || null,
    }
  }

  async function submit(action) {
    setError('')
    if (!form.flatNumber) {
      setError('Select a member or enter a flat number.')
      return
    }
    setBusy(true)
    try {
      if (action === 'PAID') await MaintenanceService.collect(payload())
      else await MaintenanceService.markPending(payload())
      setForm({ ...emptyForm, billingYear: form.billingYear, billingMonth: form.billingMonth })
      toast.success(action === 'PAID' ? 'Maintenance marked paid.' : 'Maintenance marked pending.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Operation failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function togglePaid(charge) {
    try {
      if (charge.status === 'PENDING') {
        await MaintenanceService.markPaid(charge.id)
        toast.success(`${charge.memberName} (Flat ${charge.flatNumber}) marked paid.`)
      } else {
        await MaintenanceService.markPending({
          flatNumber: charge.flatNumber,
          billingYear: charge.billingYear,
          billingMonth: charge.billingMonth,
          amount: charge.amount,
          notes: charge.notes,
          memberId: charge.memberId || null,
        })
        toast.info(`${charge.memberName} (Flat ${charge.flatNumber}) marked pending.`)
      }
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update status.'))
    }
  }

  async function saveSocietyRate(e) {
    e.preventDefault()
    setRateBusy(true)
    try {
      await MaintenanceRateService.setRate({
        amount: Number(rateForm.amount),
        effectiveFromYear: Number(rateForm.effectiveFromYear),
        effectiveFromMonth: Number(rateForm.effectiveFromMonth),
        notes: rateForm.notes || null,
      })
      toast.success(`Maintenance amount ${inr(rateForm.amount)} set from ${monthName(rateForm.effectiveFromMonth)} ${rateForm.effectiveFromYear}.`)
      setRateForm((prev) => ({ ...prev, amount: '', notes: '' }))
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save maintenance amount.'))
    } finally {
      setRateBusy(false)
    }
  }

  async function togglePeriodStatus(row) {
    if (!row.amount || Number(row.amount) <= 0) {
      toast.error('Set the society maintenance amount above for this month first.')
      return
    }
    setTrackerBusyKey(row.key)
    try {
      if (row.status === 'PENDING') {
        if (row.chargeId) {
          await MaintenanceService.markPaid(row.chargeId)
        } else {
          await MaintenanceService.collect({
            flatNumber: row.flatNumber,
            billingYear: row.billingYear,
            billingMonth: row.billingMonth,
            amount: Number(row.amount),
            memberId: row.memberId,
            notes: `Marked paid for ${monthName(row.billingMonth)} ${row.billingYear}`,
          })
        }
        toast.success(`${row.memberName} marked paid for ${monthName(row.billingMonth)} ${row.billingYear}.`)
      } else {
        await MaintenanceService.markPending({
          flatNumber: row.flatNumber,
          billingYear: row.billingYear,
          billingMonth: row.billingMonth,
          amount: Number(row.amount),
          memberId: row.memberId,
          notes: row.notes,
        })
        toast.info(`${row.memberName} marked not paid for ${monthName(row.billingMonth)} ${row.billingYear}.`)
      }
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not update maintenance status.'))
    } finally {
      setTrackerBusyKey('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card border-orange-100 bg-gradient-to-br from-white to-orange-50/40">
        <SectionTitle
          title="Society maintenance amount"
          subtitle="Same amount for every flat. Set from a start month — past recorded payments stay unchanged."
        />
        <form onSubmit={saveSocietyRate} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <div>
            <label className="label">Monthly amount (₹)</label>
            <input
              type="number"
              className="input"
              required
              min="1"
              step="1"
              placeholder="e.g. 3000"
              value={rateForm.amount}
              onChange={(e) => setRateForm({ ...rateForm, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Starts from month</label>
            <select
              className="input"
              value={rateForm.effectiveFromMonth}
              onChange={(e) => setRateForm({ ...rateForm, effectiveFromMonth: Number(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Starts from year</label>
            <input
              type="number"
              className="input"
              required
              value={rateForm.effectiveFromYear}
              onChange={(e) => setRateForm({ ...rateForm, effectiveFromYear: Number(e.target.value) })}
            />
          </div>
          <button className="btn-primary !bg-orange-500 hover:!bg-orange-600" disabled={rateBusy}>
            {rateBusy ? 'Saving…' : 'Save amount'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {periodRate ? (
            <p className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm">
              Effective for {monthName(trackerMonth)} {trackerYear}: {inr(periodRate.amount)}
              <span className="ml-2 font-normal text-slate-500">
                (from {monthName(periodRate.effectiveFromMonth)} {periodRate.effectiveFromYear})
              </span>
            </p>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
              No society amount covers {monthName(trackerMonth)} {trackerYear} yet. Set one above.
            </p>
          )}
        </div>
        {rates.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-400">Amount timeline</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Effective from</th>
                  <th className="py-2 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{monthName(r.effectiveFromMonth)} {r.effectiveFromYear}</td>
                    <td className="py-2 pr-4 font-semibold">{inr(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <SectionTitle title="Record Maintenance" subtitle="Pick a member, then mark paid or pending" />
            <Alert type="error">{error}</Alert>
            <form className="mt-3 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="label">Member</label>
                <select name="memberId" className="input" value={form.memberId} onChange={update}>
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{memberLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Flat Number</label>
                <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required placeholder="Auto-filled from member" />
              </div>
              {form.memberId && membersById[form.memberId] && (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{membersById[form.memberId].fullName}</p>
                  <p>{membersById[form.memberId].mobile || 'No mobile'}</p>
                  <p>{membersById[form.memberId].email || 'No email'}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year</label>
                  <input name="billingYear" type="number" className="input" value={form.billingYear} onChange={update} />
                </div>
                <div>
                  <label className="label">Month</label>
                  <select name="billingMonth" className="input" value={form.billingMonth} onChange={update}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{monthName(m)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Amount (₹)</label>
                <input name="amount" type="number" className="input" value={form.amount} onChange={update} required />
                {effectiveAmountFor(rates, form.billingYear, form.billingMonth) && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-orange-600"
                    onClick={() => setForm({
                      ...form,
                      amount: String(effectiveAmountFor(rates, form.billingYear, form.billingMonth).amount),
                    })}
                  >
                    Use society rate ({inr(effectiveAmountFor(rates, form.billingYear, form.billingMonth).amount)})
                  </button>
                )}
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input name="notes" className="input" value={form.notes} onChange={update} />
              </div>
              <div className="flex gap-2">
                <button className="btn-success flex-1" disabled={busy} onClick={() => submit('PAID')}>Mark Paid</button>
                <button className="btn-warning flex-1" disabled={busy} onClick={() => submit('PENDING')}>Mark Pending</button>
              </div>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <SectionTitle
              title="Member-wise summary"
              subtitle="Who has paid and who still owes"
              action={
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input w-44"
                    placeholder="Search name / flat"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select className="input w-36" value={flatFilter} onChange={(e) => setFlatFilter(e.target.value)}>
                    <option value="">All flats</option>
                    {flats.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {byMember.map((row) => (
                <button
                  key={row.flatNumber}
                  type="button"
                  onClick={() => setFlatFilter(row.flatNumber)}
                  className={`rounded-xl border p-4 text-left transition ${
                    flatFilter === row.flatNumber ? 'border-orange-300 bg-orange-50/40' : 'border-slate-100 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-950">{row.memberName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">Flat {row.flatNumber}{row.memberMobile ? ` · ${row.memberMobile}` : ''}</p>
                    </div>
                    <span className="badge bg-slate-100 text-slate-600">{row.count}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-emerald-50 px-2.5 py-2 text-emerald-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wide">Paid</p>
                      <p className="font-bold">₹{row.paid.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-2.5 py-2 text-amber-800">
                      <p className="text-[11px] font-semibold uppercase tracking-wide">Pending</p>
                      <p className="font-bold">₹{row.pending.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </button>
              ))}
              {byMember.length === 0 && <p className="text-sm text-gray-400">No records yet.</p>}
            </div>
          </div>

          <div className="card">
            <SectionTitle
              title="Maintenance Tracker"
              subtitle={`${monthName(trackerMonth)} ${trackerYear} · ${periodStats.paid} paid · ${periodStats.pending} not paid · ${periodStats.total} members`}
              action={
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="label !mb-1">Month</label>
                    <select className="input w-36" value={trackerMonth} onChange={(e) => setTrackerMonth(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{monthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label !mb-1">Year</label>
                    <input
                      type="number"
                      className="input w-24"
                      value={trackerYear}
                      onChange={(e) => setTrackerYear(Number(e.target.value))}
                    />
                  </div>
                </div>
              }
            />
            <p className="mb-4 text-sm text-slate-500">
              All members for {monthName(trackerMonth)} {trackerYear}. Amount comes from the society timeline
              {periodRate ? ` (${inr(periodRate.amount)})` : ''}. Already recorded payments keep their original amount.
              Default status is <span className="font-semibold text-amber-700">not paid</span> until marked paid.
            </p>            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Member</th>
                    <th className="py-2 pr-4">Flat</th>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {periodRows.map((row) => (
                    <tr key={row.key} className="border-b last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-950">{row.memberName}</p>
                        <p className="text-xs text-slate-500">{row.memberMobile || 'No mobile'}</p>
                        <p className="text-xs text-slate-400">{row.memberEmail || 'No email'}</p>
                      </td>
                      <td className="py-3 pr-4 font-medium">{row.flatNumber}</td>
                      <td className="py-3 pr-4">{monthName(row.billingMonth)} {row.billingYear}</td>
                      <td className="py-3 pr-4 font-semibold">
                        {row.amount > 0 ? `₹${Number(row.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={row.status === 'PAID' ? 'PAID' : 'PENDING'} />
                        {row.isVirtual && row.status !== 'PAID' && (
                          <p className="mt-1 text-[11px] text-slate-400">Not recorded yet</p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          disabled={trackerBusyKey === row.key}
                          onClick={() => togglePeriodStatus(row)}
                          className={row.status === 'PENDING' ? 'btn-success' : 'btn-secondary'}
                        >
                          {trackerBusyKey === row.key
                            ? 'Updating…'
                            : row.status === 'PENDING'
                              ? 'Mark Paid'
                              : 'Mark Not Paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {periodRows.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-gray-400">
                        No members in directory yet. Add members first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
