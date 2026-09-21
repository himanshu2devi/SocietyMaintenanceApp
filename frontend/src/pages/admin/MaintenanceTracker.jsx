import { useEffect, useMemo, useState } from 'react'
import {
  MaintenanceBillingService,
  MaintenanceRateService,
  MaintenanceService,
  MemberService,
} from '../../api/services'
import { Alert, SectionTitle, StatusBadge } from '../../components/ui/Feedback'
import DuesWhatsAppDraftButton from '../../components/DuesWhatsAppDraftButton'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  buildPeriodRows,
  effectiveAmountFor,
  effectiveMemberAmount,
  normalizeFlat,
} from '../../utils/maintenancePeriod'
import { inr, monthName } from '../../utils/share'

const now = new Date()
const emptyForm = {
  memberId: '',
  flatNumber: '',
  billingYear: now.getFullYear(),
  billingMonth: now.getMonth() + 1,
  amount: '',
  paymentMode: 'CASH',
}

function formatPaymentMode(mode) {
  if (!mode) return ''
  const value = String(mode).toUpperCase()
  if (value === 'CASH') return 'Cash'
  if (value === 'ONLINE') return 'Online'
  return mode
}

function memberLabel(m) {
  return `${m.fullName} · Flat ${m.flatNumber}${m.mobile ? ` · ${m.mobile}` : ''}`
}

export default function MaintenanceTracker() {
  const { user } = useAuth()
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
  const [trackerPaymentMode, setTrackerPaymentMode] = useState('CASH')
  const [rates, setRates] = useState([])
  const [rateForm, setRateForm] = useState({
    amount: '',
    effectiveFromYear: now.getFullYear(),
    effectiveFromMonth: now.getMonth() + 1,
    notes: '',
  })
  const [rateBusy, setRateBusy] = useState(false)
  const [billingSettings, setBillingSettings] = useState({ configured: false, billingMode: null })
  const [memberDefaults, setMemberDefaults] = useState([])
  const [defaultDrafts, setDefaultDrafts] = useState({})
  const [defaultsBusy, setDefaultsBusy] = useState(false)
  const [modeBusy, setModeBusy] = useState(false)
  const [bulkFillAmount, setBulkFillAmount] = useState('')
  const [memberRateForm, setMemberRateForm] = useState({
    effectiveFromYear: now.getFullYear(),
    effectiveFromMonth: now.getMonth() + 1,
  })

  const isVariable = billingSettings.configured && billingSettings.billingMode === 'VARIABLE'
  const isSame = billingSettings.configured && billingSettings.billingMode === 'SAME'
  const needsModeChoice = !billingSettings.configured

  function buildDraftsForPeriod(activeMembers, defaults, year, month) {
    const drafts = {}
    activeMembers.forEach((m) => {
      const exact = (defaults || []).find(
        (d) =>
          d.memberId === m.id
          && Number(d.effectiveFromYear) === Number(year)
          && Number(d.effectiveFromMonth) === Number(month),
      )
      drafts[m.id] = exact ? String(exact.amount) : ''
    })
    return drafts
  }

  async function load() {
    try {
      const [chargeList, memberList, rateList, settings, defaults] = await Promise.all([
        MaintenanceService.list(),
        MemberService.list(),
        MaintenanceRateService.list(),
        MaintenanceBillingService.settings(),
        MaintenanceBillingService.listMemberDefaults().catch(() => []),
      ])
      const activeMembers = memberList.filter((m) => m.active !== false)
      setCharges(chargeList)
      setMembers(activeMembers)
      setRates(rateList)
      setBillingSettings(settings || { configured: false, billingMode: null })
      setMemberDefaults(defaults || [])
      setDefaultDrafts((prev) => {
        // Keep current form period if already set; otherwise use memberRateForm defaults via functional update below
        return prev
      })
      setMemberRateForm((prev) => {
        const drafts = buildDraftsForPeriod(
          activeMembers,
          defaults || [],
          prev.effectiveFromYear,
          prev.effectiveFromMonth,
        )
        setDefaultDrafts(drafts)
        return prev
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load maintenance records.'))
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!isVariable || members.length === 0) return
    setDefaultDrafts(
      buildDraftsForPeriod(
        members,
        memberDefaults,
        memberRateForm.effectiveFromYear,
        memberRateForm.effectiveFromMonth,
      ),
    )
  }, [isVariable, members, memberDefaults, memberRateForm.effectiveFromYear, memberRateForm.effectiveFromMonth])

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

  const periodRate = useMemo(
    () => effectiveAmountFor(rates, trackerYear, trackerMonth),
    [rates, trackerYear, trackerMonth],
  )

  const periodRows = useMemo(() => {
    const base = buildPeriodRows({
      members,
      charges,
      rates,
      memberDefaults,
      billingMode: billingSettings.billingMode || 'SAME',
      year: trackerYear,
      month: trackerMonth,
    })
    return base.map((row) => {
      const member = members.find((m) => m.id === row.memberId)
      const charge = charges.find((c) => c.id === row.chargeId)
      return {
        ...row,
        memberMobile: member?.mobile || '',
        memberEmail: member?.email || '',
        paymentMode: charge?.paymentMode || null,
        notes: charge?.notes || '',
        usesSchedule: row.isVirtual,
        hasDefault: !row.isVirtual || Number(row.amount) > 0,
      }
    })
  }, [members, charges, rates, memberDefaults, billingSettings.billingMode, trackerYear, trackerMonth])

  const byMember = useMemo(() => {
    const map = {}

    function ensureEntry(key, { flatNumber, memberName, memberMobile }) {
      if (!map[key]) {
        map[key] = {
          flatNumber,
          memberName,
          memberMobile: memberMobile || '',
          periods: [],
        }
      }
      return map[key]
    }

    function periodExists(entry, year, month) {
      return entry.periods.some(
        (p) => Number(p.year) === Number(year) && Number(p.month) === Number(month),
      )
    }

    for (const c of filtered) {
      if (String(c.status || '').toUpperCase() === 'PAID') continue
      const key = (c.memberId && String(c.memberId)) || normalizeFlat(c.flatNumber) || c.id
      const entry = ensureEntry(key, {
        flatNumber: c.flatNumber,
        memberName: c.memberName,
        memberMobile: c.memberMobile,
      })
      if (periodExists(entry, c.billingYear, c.billingMonth)) continue
      entry.periods.push({
        year: Number(c.billingYear),
        month: Number(c.billingMonth),
        amount: Number(c.amount || 0),
        isVirtual: false,
      })
    }

    for (const row of periodRows) {
      if (!row.isVirtual || String(row.status).toUpperCase() === 'PAID') continue
      if (Number(row.amount || 0) <= 0) continue
      if (flatFilter && normalizeFlat(row.flatNumber) !== normalizeFlat(flatFilter)) continue
      const q = search.trim().toLowerCase()
      if (q) {
        const hay = `${row.memberName} ${row.flatNumber} ${row.memberMobile || ''} ${row.memberEmail || ''}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      const key = (row.memberId && String(row.memberId)) || normalizeFlat(row.flatNumber) || row.key
      const entry = ensureEntry(key, {
        flatNumber: row.flatNumber,
        memberName: row.memberName,
        memberMobile: row.memberMobile,
      })
      if (periodExists(entry, row.billingYear, row.billingMonth)) continue
      entry.periods.push({
        year: Number(row.billingYear),
        month: Number(row.billingMonth),
        amount: Number(row.amount || 0),
        isVirtual: true,
      })
    }

    return Object.values(map)
      .map((entry) => {
        const periods = entry.periods
          .slice()
          .sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))
        const totalDue = periods.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        return { ...entry, periods, totalDue }
      })
      .filter((entry) => entry.periods.length > 0)
      .sort((a, b) => b.totalDue - a.totalDue || a.memberName.localeCompare(b.memberName))
  }, [filtered, periodRows, flatFilter, search])

  const periodStats = useMemo(() => {
    const paid = periodRows.filter((r) => r.status === 'PAID').length
    const pending = periodRows.length - paid
    return { paid, pending, total: periodRows.length }
  }, [periodRows])

  const defaultsConfiguredCount = useMemo(
    () => members.filter((m) => effectiveMemberAmount(memberDefaults, m, trackerYear, trackerMonth) > 0).length,
    [members, memberDefaults, trackerYear, trackerMonth],
  )

  function selectMember(memberId) {
    const member = membersById[memberId]
    const next = {
      ...form,
      memberId,
      flatNumber: member?.flatNumber || form.flatNumber,
    }
    if (member && !form.amount) {
      const suggested = isVariable
        ? effectiveMemberAmount(memberDefaults, member, form.billingYear, form.billingMonth)
        : (effectiveAmountFor(rates, form.billingYear, form.billingMonth)?.amount || 0)
      if (suggested > 0) next.amount = String(suggested)
    }
    setForm(next)
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
      paymentMode: form.paymentMode,
      memberId: form.memberId || null,
    }
  }

  function suggestedAmountLabel() {
    if (!form.memberId) return null
    const member = membersById[form.memberId]
    if (!member) return null
    if (isVariable) {
      const amt = effectiveMemberAmount(memberDefaults, member, form.billingYear, form.billingMonth)
      return amt > 0 ? amt : null
    }
    const rate = effectiveAmountFor(rates, form.billingYear, form.billingMonth)
    return rate ? Number(rate.amount) : null
  }

  async function submit(action) {
    setError('')
    if (!form.flatNumber) {
      setError('Select a member or enter a flat number.')
      return
    }
    if (action === 'PAID' && !form.paymentMode) {
      setError('Payment mode is required when marking paid.')
      return
    }
    setBusy(true)
    try {
      if (action === 'PAID') await MaintenanceService.collect(payload())
      else {
        const { paymentMode, ...pendingPayload } = payload()
        await MaintenanceService.markPending(pendingPayload)
      }
      setForm({ ...emptyForm, billingYear: form.billingYear, billingMonth: form.billingMonth, paymentMode: form.paymentMode })
      toast.success(action === 'PAID' ? 'Maintenance marked paid.' : 'Maintenance marked pending.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Operation failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function chooseBillingMode(billingMode) {
    setModeBusy(true)
    try {
      const settings = await MaintenanceBillingService.chooseMode(billingMode)
      setBillingSettings(settings)
      toast.success(
        billingMode === 'SAME'
          ? 'Same amount for every flat selected. Set the society amount below.'
          : 'Variable amounts selected. Set a default amount for each member below.',
      )
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save billing mode.'))
    } finally {
      setModeBusy(false)
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

  async function saveMemberDefaults(e) {
    e?.preventDefault?.()
    const year = Number(memberRateForm.effectiveFromYear)
    const month = Number(memberRateForm.effectiveFromMonth)
    const payloadDefaults = members
      .map((m) => {
        const raw = defaultDrafts[m.id]
        if (raw == null || String(raw).trim() === '') return null
        const amount = Number(raw)
        if (!Number.isFinite(amount) || amount <= 0) return null
        return {
          memberId: m.id,
          flatNumber: m.flatNumber,
          amount,
          effectiveFromYear: year,
          effectiveFromMonth: month,
        }
      })
      .filter(Boolean)

    if (payloadDefaults.length === 0) {
      toast.error('Enter at least one member amount greater than zero.')
      return
    }

    setDefaultsBusy(true)
    try {
      await MaintenanceBillingService.upsertMemberDefaults(payloadDefaults)
      toast.success(
        `Saved amounts for ${payloadDefaults.length} member${payloadDefaults.length === 1 ? '' : 's'} from ${monthName(month)} ${year}.`,
      )
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save member amounts.'))
    } finally {
      setDefaultsBusy(false)
    }
  }

  function applyBulkFill() {
    const amount = Number(bulkFillAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to fill.')
      return
    }
    const next = { ...defaultDrafts }
    members.forEach((m) => {
      next[m.id] = String(amount)
    })
    setDefaultDrafts(next)
    toast.info(`Filled ${inr(amount)} for all ${members.length} members. Click Save to confirm.`)
  }

  async function togglePeriodStatus(row) {
    if (!row.amount || Number(row.amount) <= 0) {
      toast.error(
        isVariable
          ? 'Set this member’s default maintenance amount above first.'
          : 'Set the society maintenance amount above for this month first.',
      )
      return
    }
    if (row.status === 'PENDING' && !trackerPaymentMode) {
      toast.error('Select payment mode (Cash or Online) before marking paid.')
      return
    }
    setTrackerBusyKey(row.key)
    try {
      if (row.status === 'PENDING') {
        if (row.chargeId) {
          await MaintenanceService.markPaid(row.chargeId, trackerPaymentMode)
        } else {
          await MaintenanceService.collect({
            flatNumber: row.flatNumber,
            billingYear: row.billingYear,
            billingMonth: row.billingMonth,
            amount: Number(row.amount),
            memberId: row.memberId,
            paymentMode: trackerPaymentMode,
            notes: `Marked paid for ${monthName(row.billingMonth)} ${row.billingYear}`,
          })
        }
        toast.success(`${row.memberName} marked paid (${formatPaymentMode(trackerPaymentMode)}).`)
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

  const suggested = suggestedAmountLabel()

  return (
    <div className="space-y-6">
      {needsModeChoice && (
        <div className="card border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
          <SectionTitle
            title="How is maintenance billed?"
            subtitle="One-time setup for your society. Pick how monthly maintenance amounts work for flats and shops."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              disabled={modeBusy}
              onClick={() => chooseBillingMode('SAME')}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-300 hover:shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-700">Option 1</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">Same for every flat / shop</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                One society amount applies to all members. You can still change the amount from a start month later
                (past recorded payments stay unchanged).
              </p>
            </button>
            <button
              type="button"
              disabled={modeBusy}
              onClick={() => chooseBillingMode('VARIABLE')}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-teal-300 hover:shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-teal-700">Option 2</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">Different per flat / shop</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Set a default monthly amount for each member. Use this when shops, larger flats, or special units
                pay different dues.
              </p>
            </button>
          </div>
          {modeBusy && <p className="mt-3 text-sm text-slate-500">Saving your choice…</p>}
        </div>
      )}

      {isSame && (
        <div className="card border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
          <SectionTitle
            title="Society maintenance amount"
            subtitle="Same amount for every flat. Set from a start month — past recorded payments stay unchanged."
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Billing mode: <span className="text-teal-800">Same for all</span>
          </p>
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
            <button className="btn-primary !bg-teal-600 hover:!bg-teal-700" disabled={rateBusy}>
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
            <div className="mt-4 table-scroll">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-400">Amount timeline</p>
              <table className="w-full min-w-[20rem] text-sm">
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
      )}

      {isVariable && (
        <div className="card border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
          <SectionTitle
            title="Default amount per flat / shop"
            subtitle="Different amounts per flat. Set from a start month — past recorded payments stay unchanged."
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Billing mode: <span className="text-teal-700">Variable per flat</span>
            {' · '}
            {defaultsConfiguredCount}/{members.length} members covered for {monthName(trackerMonth)} {trackerYear}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <div>
              <label className="label">Starts from month</label>
              <select
                className="input"
                value={memberRateForm.effectiveFromMonth}
                onChange={(e) => setMemberRateForm({
                  ...memberRateForm,
                  effectiveFromMonth: Number(e.target.value),
                })}
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
                value={memberRateForm.effectiveFromYear}
                onChange={(e) => setMemberRateForm({
                  ...memberRateForm,
                  effectiveFromYear: Number(e.target.value),
                })}
              />
            </div>
            <div>
              <label className="label">Fill all with (₹)</label>
              <input
                type="number"
                className="input"
                min="1"
                step="1"
                placeholder="e.g. 3000"
                value={bulkFillAmount}
                onChange={(e) => setBulkFillAmount(e.target.value)}
              />
            </div>
            <button type="button" className="btn-secondary" onClick={applyBulkFill} disabled={members.length === 0}>
              Fill all
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary w-full !bg-teal-600 text-left hover:!bg-teal-700 sm:w-auto"
              disabled={defaultsBusy || members.length === 0}
              onClick={saveMemberDefaults}
            >
              {defaultsBusy
                ? 'Saving…'
                : `Save amounts from ${monthName(memberRateForm.effectiveFromMonth)} ${memberRateForm.effectiveFromYear}`}
            </button>
            <p className="text-xs text-slate-500">
              Editing the form above only affects the selected start month. Earlier recorded payments are not changed.
            </p>
          </div>

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Add members in the directory first, then set their amounts here.</p>
          ) : (
            <div className="mt-4 table-scroll">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Member</th>
                    <th className="py-2 pr-4">Flat / shop</th>
                    <th className="py-2 pr-4">
                      Amount from {monthName(memberRateForm.effectiveFromMonth)} {memberRateForm.effectiveFromYear} (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .slice()
                    .sort((a, b) => String(a.flatNumber).localeCompare(String(b.flatNumber)))
                    .map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4">
                          <p className="font-semibold text-slate-950">{m.fullName}</p>
                          <p className="text-xs text-slate-400">{m.mobile || 'No mobile'}</p>
                        </td>
                        <td className="py-2.5 pr-4 font-medium">{m.flatNumber}</td>
                        <td className="py-2.5 pr-4">
                          <input
                            type="number"
                            className="input w-36"
                            min="1"
                            step="1"
                            placeholder="Amount"
                            value={defaultDrafts[m.id] ?? ''}
                            onChange={(e) => setDefaultDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {periodRows.some((r) => r.amount > 0) ? (
              <p className="rounded-xl bg-white px-3 py-2 font-semibold text-slate-800 shadow-sm">
                Tracker month {monthName(trackerMonth)} {trackerYear}: amounts come from each member’s effective timeline
              </p>
            ) : (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                No member amounts cover {monthName(trackerMonth)} {trackerYear} yet. Set amounts from a start month above.
              </p>
            )}
          </div>

          {memberDefaults.length > 0 && (
            <div className="mt-4 table-scroll">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-400">Amount timeline</p>
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Member / flat</th>
                    <th className="py-2 pr-4">Effective from</th>
                    <th className="py-2 pr-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {memberDefaults.map((d) => {
                    const member = membersById[d.memberId]
                    return (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <span className="font-semibold text-slate-900">{member?.fullName || 'Member'}</span>
                          <span className="text-slate-500"> · {d.flatNumber}</span>
                        </td>
                        <td className="py-2 pr-4">{monthName(d.effectiveFromMonth)} {d.effectiveFromYear}</td>
                        <td className="py-2 pr-4 font-semibold">{inr(d.amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!needsModeChoice && (
      <div className="min-w-0 max-w-full space-y-6">
      <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-1">
          <div className="card min-w-0">
            <SectionTitle title="Record Maintenance" subtitle="Pick a member, then mark paid or pending" />
            <Alert type="error">{error}</Alert>
            <form className="mt-3 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="min-w-0">
                <label className="label">Member</label>
                <select name="memberId" className="input max-w-full" value={form.memberId} onChange={update}>
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{memberLabel(m)}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label className="label">Flat Number</label>
                <input name="flatNumber" className="input" value={form.flatNumber} onChange={update} required placeholder="Auto-filled from member" />
              </div>
              {form.memberId && membersById[form.memberId] && (
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <p className="break-words font-semibold text-slate-900">{membersById[form.memberId].fullName}</p>
                  <p className="break-words">{membersById[form.memberId].mobile || 'No mobile'}</p>
                  <p className="break-words">{membersById[form.memberId].email || 'No email'}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                {suggested != null && (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-teal-700"
                    onClick={() => setForm({ ...form, amount: String(suggested) })}
                  >
                    Use default ({inr(suggested)})
                  </button>
                )}
              </div>
              <div>
                <label className="label">Mode of payment</label>
                <select name="paymentMode" className="input" value={form.paymentMode} onChange={update} required>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">Required when marking paid.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button className="btn-success w-full sm:flex-1" disabled={busy} onClick={() => submit('PAID')}>Mark Paid</button>
                <button className="btn-warning w-full sm:flex-1" disabled={busy} onClick={() => submit('PENDING')}>Mark Pending</button>
              </div>
            </form>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <div className="card min-w-0 overflow-hidden">
            <SectionTitle
              title="Pending dues by member"
              subtitle="Unpaid months only — click a card to filter the tracker"
              action={
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <input
                    className="input min-w-0 w-full sm:max-w-[11rem]"
                    placeholder="Search name / flat"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select className="input w-full sm:w-36" value={flatFilter} onChange={(e) => setFlatFilter(e.target.value)}>
                    <option value="">All flats</option>
                    {flats.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              }
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {byMember.map((row) => (
                <button
                  key={`${row.flatNumber}-${row.memberName}`}
                  type="button"
                  onClick={() => setFlatFilter(row.flatNumber)}
                  className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition ${
                    flatFilter === row.flatNumber ? 'border-teal-300 bg-teal-50/50' : 'border-slate-100 hover:border-teal-200'
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-words text-sm font-bold leading-snug text-slate-950">
                        {row.memberName}
                      </p>
                      <p className="shrink-0 pt-0.5 text-sm font-extrabold tabular-nums text-amber-800">
                        ₹{row.totalDue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="break-words text-xs text-slate-500">
                      Flat {row.flatNumber}
                      {row.memberMobile ? ` · ${row.memberMobile}` : ''}
                      {row.periods.length > 1 ? ` · ${row.periods.length} months` : ''}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.periods.map((p) => (
                      <span
                        key={`${p.year}-${p.month}`}
                        className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-amber-900"
                      >
                        {monthName(p.month).slice(0, 3)} {p.year} · ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {byMember.length === 0 && (
                <p className="col-span-full text-sm text-emerald-700">No pending dues for this filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>

          <div className="card min-w-0">
            <SectionTitle
              title="Maintenance Tracker"
              subtitle={`${monthName(trackerMonth)} ${trackerYear} · ${periodStats.paid} paid · ${periodStats.pending} not paid · ${periodStats.total} members`}
              action={
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
                  <div className="min-w-0">
                    <label className="label !mb-1">Month</label>
                    <select className="input w-full sm:w-36" value={trackerMonth} onChange={(e) => setTrackerMonth(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{monthName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="label !mb-1">Year</label>
                    <input
                      type="number"
                      className="input w-full sm:w-24"
                      value={trackerYear}
                      onChange={(e) => setTrackerYear(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-2 min-w-0 sm:col-auto">
                    <label className="label !mb-1">Mark paid via</label>
                    <select className="input w-full sm:w-32" value={trackerPaymentMode} onChange={(e) => setTrackerPaymentMode(e.target.value)}>
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                </div>
              }
            />
            <p className="mb-4 text-sm leading-6 text-slate-500">
              All members for {monthName(trackerMonth)} {trackerYear}.{' '}
              {isVariable
                ? 'Amount comes from each member’s default when not yet recorded.'
                : `Amount comes from the society timeline${periodRate ? ` (${inr(periodRate.amount)})` : ''}.`}
              {' '}Already recorded payments keep their original amount.
              Default status is <span className="font-semibold text-amber-700">not paid</span> until marked paid.
              Payment mode appears only for paid members.
            </p>

            {/* Phones / tablets: stacked cards — no sideways scroll */}
            <div className="space-y-3 lg:hidden">
              {periodRows.map((row) => (
                <article key={row.key} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/40 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 break-words">{row.memberName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Flat {row.flatNumber}
                        {row.memberMobile ? ` · ${row.memberMobile}` : ''}
                      </p>
                      {row.memberEmail && (
                        <p className="mt-0.5 break-all text-xs text-slate-400">{row.memberEmail}</p>
                      )}
                    </div>
                    <StatusBadge status={row.status === 'PAID' ? 'PAID' : 'PENDING'} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-white px-2.5 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Period</p>
                      <p className="mt-0.5 font-medium text-slate-800">{monthName(row.billingMonth)} {row.billingYear}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2.5 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amount</p>
                      <p className="mt-0.5 font-semibold text-slate-900">
                        {row.amount > 0 ? `₹${Number(row.amount).toLocaleString('en-IN')}` : '—'}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-white px-2.5 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment mode</p>
                      <p className="mt-0.5 text-slate-800">
                        {row.status === 'PAID'
                          ? (formatPaymentMode(row.paymentMode) || '—')
                          : '—'}
                      </p>
                      {row.isVirtual && row.status !== 'PAID' && (
                        <p className="mt-1 text-[11px] text-slate-400">Not recorded yet</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={trackerBusyKey === row.key}
                      onClick={() => togglePeriodStatus(row)}
                      className={`${row.status === 'PENDING' ? 'btn-success' : 'btn-secondary'} w-full !text-sm sm:w-auto`}
                    >
                      {trackerBusyKey === row.key
                        ? 'Updating…'
                        : row.status === 'PENDING'
                          ? 'Mark Paid'
                          : 'Mark Not Paid'}
                    </button>
                    {row.status === 'PENDING' && (
                      <DuesWhatsAppDraftButton row={row} societyName={user?.societyName} />
                    )}
                  </div>
                </article>
              ))}
              {periodRows.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">No members in directory yet. Add members first.</p>
              )}
            </div>

            {/* Desktop: full-width table */}
            <div className="hidden table-scroll lg:block">
              <table className="w-full min-w-0 text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-3 whitespace-nowrap">Member</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Flat</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Period</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Amount</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Status</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Payment mode</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {periodRows.map((row) => (
                    <tr key={row.key} className="border-b last:border-0 align-top">
                      <td className="min-w-0 py-3 pr-3">
                        <p className="font-semibold text-slate-950 break-words">{row.memberName}</p>
                        <p className="text-xs text-slate-500 break-all">{row.memberMobile || 'No mobile'}</p>
                        <p className="text-xs text-slate-400 break-all">{row.memberEmail || 'No email'}</p>
                      </td>
                      <td className="py-3 pr-3 font-medium whitespace-nowrap">{row.flatNumber}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">{monthName(row.billingMonth)} {row.billingYear}</td>
                      <td className="py-3 pr-3 font-semibold whitespace-nowrap">
                        {row.amount > 0 ? `₹${Number(row.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <StatusBadge status={row.status === 'PAID' ? 'PAID' : 'PENDING'} />
                        {row.isVirtual && row.status !== 'PAID' && (
                          <p className="mt-1 text-[11px] text-slate-400">Not recorded yet</p>
                        )}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {row.status === 'PAID' ? (
                          <span className="badge bg-sky-50 text-sky-700">{formatPaymentMode(row.paymentMode) || '—'}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="max-w-md space-y-1">
                          <button
                            type="button"
                            disabled={trackerBusyKey === row.key}
                            onClick={() => togglePeriodStatus(row)}
                            className={`${row.status === 'PENDING' ? 'btn-success' : 'btn-secondary'} !px-2.5 !py-1.5 !text-xs`}
                          >
                            {trackerBusyKey === row.key
                              ? 'Updating…'
                              : row.status === 'PENDING'
                                ? 'Mark Paid'
                                : 'Mark Not Paid'}
                          </button>
                          {row.status === 'PENDING' && (
                            <DuesWhatsAppDraftButton row={row} societyName={user?.societyName} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {periodRows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-gray-400">
                        No members in directory yet. Add members first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
      )}
    </div>
  )
}
