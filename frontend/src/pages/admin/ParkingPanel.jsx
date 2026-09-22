import { useEffect, useState } from 'react'
import { MemberService, ParkingService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { pageContent } from '../../utils/page'
import { collectErrors, firstError, hasErrors, text } from '../../utils/validation'

const CATEGORIES = ['COMMON', 'ASSIGNED']
const SLOT_STATUSES = ['AVAILABLE', 'ASSIGNED', 'UNAVAILABLE']

const emptySlot = { slotCode: '', category: 'ASSIGNED', buildingWing: '', status: 'AVAILABLE', notes: '' }

const emptyAssign = {
  memberUserId: '',
  memberName: '',
  flatNumber: '',
  vehicleNumber: '',
  vehicleType: '',
  notes: '',
  replaceExisting: false,
}

const statusColor = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700',
  ASSIGNED: 'bg-sky-50 text-sky-700',
  UNAVAILABLE: 'bg-slate-100 text-slate-600',
}

export default function ParkingPanel() {
  const toast = useToast()
  const [slots, setSlots] = useState([])
  const [members, setMembers] = useState([])
  const [filters, setFilters] = useState({ category: '', status: '', q: '' })
  const [slotForm, setSlotForm] = useState(emptySlot)
  const [editingId, setEditingId] = useState(null)
  const [assignSlot, setAssignSlot] = useState(null)
  const [assignForm, setAssignForm] = useState(emptyAssign)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState('')

  async function load() {
    try {
      const res = await ParkingService.listSlots({
        category: filters.category || undefined,
        status: filters.status || undefined,
        q: filters.q.trim() || undefined,
        size: 200,
      })
      setSlots(pageContent(res))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load parking slots.'))
    }
  }

  useEffect(() => {
    load()
  }, [filters.category, filters.status])

  useEffect(() => {
    MemberService.list()
      .then((list) => setMembers(Array.isArray(list) ? list.filter((m) => m.active !== false) : []))
      .catch(() => setMembers([]))
  }, [])

  function startEdit(slot) {
    setEditingId(slot.id)
    setSlotForm({
      slotCode: slot.slotCode || '',
      category: slot.category || 'ASSIGNED',
      buildingWing: slot.buildingWing || '',
      status: slot.status || 'AVAILABLE',
      notes: slot.notes || '',
    })
    setFieldErrors({})
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setSlotForm(emptySlot)
    setFieldErrors({})
  }

  async function saveSlot(e) {
    e.preventDefault()
    setError('')
    const errors = collectErrors({
      slotCode: text(slotForm.slotCode, 'Slot code', { min: 1, max: 40 }),
      buildingWing: text(slotForm.buildingWing, 'Building / wing', { required: false, max: 80 }),
    })
    setFieldErrors(errors)
    if (hasErrors(errors)) {
      setError(firstError(errors))
      return
    }
    const payload = {
      slotCode: slotForm.slotCode.trim(),
      category: slotForm.category,
      buildingWing: slotForm.buildingWing.trim() || null,
      status: slotForm.status,
      notes: slotForm.notes.trim() || null,
    }
    setBusy(true)
    try {
      if (editingId) {
        await ParkingService.updateSlot(editingId, payload)
        toast.success('Slot updated.')
      } else {
        await ParkingService.createSlot(payload)
        toast.success('Slot added to the parking register.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, editingId ? 'Could not update slot.' : 'Could not add slot.'))
    } finally {
      setBusy(false)
    }
  }

  function openAssign(slot) {
    setAssignSlot(slot)
    setAssignForm(emptyAssign)
  }

  function pickMember(memberUserId) {
    const member = members.find((m) => m.id === memberUserId)
    setAssignForm((prev) => ({
      ...prev,
      memberUserId,
      memberName: member?.fullName || prev.memberName,
      flatNumber: member?.flatNumber || prev.flatNumber,
    }))
  }

  async function submitAssign(e) {
    e.preventDefault()
    if (!assignSlot) return
    if (!assignForm.memberUserId && !assignForm.memberName.trim()) {
      toast.error('Pick a member or type the resident name.')
      return
    }
    setRowBusy(assignSlot.id)
    try {
      await ParkingService.assign(assignSlot.id, {
        memberUserId: assignForm.memberUserId || null,
        memberName: assignForm.memberName.trim() || null,
        flatNumber: assignForm.flatNumber.trim() || null,
        vehicleNumber: assignForm.vehicleNumber.trim() || null,
        vehicleType: assignForm.vehicleType.trim() || null,
        notes: assignForm.notes.trim() || null,
        replaceExisting: assignForm.replaceExisting,
      })
      toast.success(`Slot ${assignSlot.slotCode} allotted.`)
      setAssignSlot(null)
      setAssignForm(emptyAssign)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not allot this slot.'))
    } finally {
      setRowBusy('')
    }
  }

  async function unassign(slot) {
    if (!window.confirm(`Release slot ${slot.slotCode} from ${slot.activeAssignment?.memberName || 'the current resident'}?`)) return
    setRowBusy(slot.id)
    try {
      await ParkingService.unassign(slot.id, null)
      toast.success(`Slot ${slot.slotCode} is available again.`)
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not release this slot.'))
    } finally {
      setRowBusy('')
    }
  }

  async function toggleAvailability(slot) {
    setRowBusy(slot.id)
    try {
      if (slot.status === 'UNAVAILABLE') {
        await ParkingService.markAvailable(slot.id)
        toast.success(`Slot ${slot.slotCode} marked available.`)
      } else {
        await ParkingService.markUnavailable(slot.id)
        toast.info(`Slot ${slot.slotCode} marked unavailable.`)
      }
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not change slot availability.'))
    } finally {
      setRowBusy('')
    }
  }

  async function removeSlot(slot) {
    if (!window.confirm(`Delete slot ${slot.slotCode} from the register?`)) return
    setRowBusy(slot.id)
    try {
      await ParkingService.removeSlot(slot.id)
      if (editingId === slot.id) cancelEdit()
      toast.success('Slot deleted.')
      await load()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete this slot.'))
    } finally {
      setRowBusy('')
    }
  }

  const assignedCount = slots.filter((s) => s.status === 'ASSIGNED').length
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length

  return (
    <div className="space-y-6">
      <Alert type="error">{error}</Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-gray-500">Total slots</p><p className="mt-1 text-2xl font-bold">{slots.length}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Allotted</p><p className="mt-1 text-2xl font-bold text-sky-700">{assignedCount}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Available</p><p className="mt-1 text-2xl font-bold text-emerald-600">{availableCount}</p></div>
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="card">
          <SectionTitle
            title={editingId ? 'Edit slot' : 'Add parking slot'}
            subtitle={editingId ? 'Update code, wing or notes' : 'Build the society parking register'}
          />
          <form onSubmit={saveSlot} className="space-y-3" noValidate>
            <div>
              <label className="label">Slot code</label>
              <input
                className="input uppercase"
                value={slotForm.slotCode}
                onChange={(e) => setSlotForm({ ...slotForm, slotCode: e.target.value })}
                placeholder="P-12"
                maxLength={40}
              />
              {fieldErrors.slotCode && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slotCode}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={slotForm.category}
                  onChange={(e) => setSlotForm({ ...slotForm, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={slotForm.status}
                  onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })}
                >
                  {SLOT_STATUSES.filter((s) => editingId || s !== 'ASSIGNED').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Building / wing</label>
              <input
                className="input"
                value={slotForm.buildingWing}
                onChange={(e) => setSlotForm({ ...slotForm, buildingWing: e.target.value })}
                placeholder="A wing basement"
                maxLength={80}
              />
              {fieldErrors.buildingWing && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.buildingWing}</p>}
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="2"
                value={slotForm.notes}
                onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                maxLength={500}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save slot' : 'Add slot'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              A slot becomes ASSIGNED only after you allot it to a resident. Release it before deleting.
            </p>
          </form>
        </div>

        <div className="card min-w-0">
          <SectionTitle title="Parking register" subtitle={`${slots.length} slots shown`} />
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,150px)_minmax(0,160px)_auto]">
            <input
              className="input"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search slot, wing…"
            />
            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {SLOT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={load}>Search</button>
          </div>

          <div className="table-scroll">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Slot</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Wing</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Allotted to</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-semibold">{slot.slotCode}</td>
                    <td className="py-3 pr-4">{slot.category}</td>
                    <td className="py-3 pr-4 text-slate-500">{slot.buildingWing || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${statusColor[slot.status] || 'bg-slate-100 text-slate-600'}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {slot.activeAssignment ? (
                        <div className="min-w-0">
                          <p className="break-words font-medium text-slate-900">{slot.activeAssignment.memberName || '—'}</p>
                          <p className="break-words text-xs text-slate-500">
                            {slot.activeAssignment.flatNumber ? `Flat ${slot.activeAssignment.flatNumber}` : ''}
                            {slot.activeAssignment.vehicleNumber ? ` · ${slot.activeAssignment.vehicleNumber}` : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {slot.activeAssignment ? (
                          <button
                            type="button"
                            className="btn-warning !py-1.5 !text-xs"
                            disabled={rowBusy === slot.id}
                            onClick={() => unassign(slot)}
                          >
                            Release
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary !py-1.5 !text-xs"
                            disabled={rowBusy === slot.id || slot.status === 'UNAVAILABLE'}
                            onClick={() => openAssign(slot)}
                          >
                            Allot
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary !py-1.5 !text-xs"
                          disabled={rowBusy === slot.id}
                          onClick={() => startEdit(slot)}
                        >
                          Edit
                        </button>
                        {!slot.activeAssignment && (
                          <button
                            type="button"
                            className="btn-secondary !py-1.5 !text-xs"
                            disabled={rowBusy === slot.id}
                            onClick={() => toggleAvailability(slot)}
                          >
                            {slot.status === 'UNAVAILABLE' ? 'Mark available' : 'Mark unavailable'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary !border-red-200 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50"
                          disabled={rowBusy === slot.id}
                          onClick={() => removeSlot(slot)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-400">
                      No slots match this view. Add slots to start the register.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {assignSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4">
          <form onSubmit={submitAssign} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" noValidate>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-700">Allot parking</p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">Slot {assignSlot.slotCode}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Member</label>
                <select className="input" value={assignForm.memberUserId} onChange={(e) => pickMember(e.target.value)}>
                  <option value="">Not a registered member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} · {m.flatNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Resident name</label>
                <input
                  className="input"
                  value={assignForm.memberName}
                  onChange={(e) => setAssignForm({ ...assignForm, memberName: e.target.value })}
                  maxLength={150}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Flat number</label>
                  <input
                    className="input"
                    value={assignForm.flatNumber}
                    onChange={(e) => setAssignForm({ ...assignForm, flatNumber: e.target.value })}
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="label">Vehicle type</label>
                  <input
                    className="input"
                    value={assignForm.vehicleType}
                    onChange={(e) => setAssignForm({ ...assignForm, vehicleType: e.target.value })}
                    placeholder="Car / two-wheeler"
                    maxLength={40}
                  />
                </div>
              </div>
              <div>
                <label className="label">Vehicle number</label>
                <input
                  className="input uppercase"
                  value={assignForm.vehicleNumber}
                  onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value })}
                  placeholder="MH12AB1234"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  rows="2"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  maxLength={500}
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={assignForm.replaceExisting}
                  onChange={(e) => setAssignForm({ ...assignForm, replaceExisting: e.target.checked })}
                />
                Release any existing allotment for this slot first
              </label>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary flex-1" disabled={rowBusy === assignSlot.id}>
                {rowBusy === assignSlot.id ? 'Allotting…' : 'Allot slot'}
              </button>
              <button type="button" className="btn-secondary flex-1" onClick={() => setAssignSlot(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
