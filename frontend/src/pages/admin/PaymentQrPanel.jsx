import { useEffect, useRef, useState } from 'react'
import { PaymentQrService } from '../../api/services'
import { Alert, SectionTitle } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { formatNoticeDate } from '../../utils/share'

const MAX_BYTES = 1024 * 1024
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']

/** Strips the `data:image/png;base64,` prefix the backend does not expect. */
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => {
      const result = String(reader.result || '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.readAsDataURL(file)
  })
}

export default function PaymentQrPanel() {
  const toast = useToast()
  const fileRef = useRef(null)
  const [qr, setQr] = useState(null)
  const [form, setForm] = useState({ upiId: '', instruction: '' })
  const [picked, setPicked] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    try {
      const res = await PaymentQrService.get()
      setQr(res)
      setForm({ upiId: res?.upiId || '', instruction: res?.instruction || '' })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load the payment QR.'))
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function pickFile(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) {
      setPicked(null)
      return
    }
    if (!ACCEPTED.includes(file.type)) {
      setPicked(null)
      setError('Upload the QR as a PNG, JPG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setPicked(null)
      setError('QR image must be smaller than 1 MB.')
      return
    }
    try {
      const imageBase64 = await readAsBase64(file)
      setPicked({ imageBase64, contentType: file.type, fileName: file.name })
    } catch (err) {
      setError(err.message)
    }
  }

  function clearPicked() {
    setPicked(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save(e) {
    e.preventDefault()
    setError('')
    const image = picked || (qr?.configured
      ? { imageBase64: qr.imageBase64, contentType: qr.contentType, fileName: qr.fileName }
      : null)
    if (!image?.imageBase64) {
      setError('Choose a QR image first.')
      return
    }
    setBusy('save')
    try {
      const saved = await PaymentQrService.upsert({
        upiId: form.upiId.trim() || null,
        instruction: form.instruction.trim() || null,
        contentType: image.contentType,
        imageBase64: image.imageBase64,
        fileName: image.fileName || null,
      })
      setQr(saved)
      clearPicked()
      toast.success('Payment QR published. Members can scan it from their dashboard.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the payment QR.'))
    } finally {
      setBusy('')
    }
  }

  async function remove() {
    if (!window.confirm('Remove the society payment QR? Members will no longer see it.')) return
    setBusy('remove')
    try {
      await PaymentQrService.remove()
      clearPicked()
      toast.success('Payment QR removed.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not remove the payment QR.'))
    } finally {
      setBusy('')
    }
  }

  const previewSrc = picked
    ? `data:${picked.contentType};base64,${picked.imageBase64}`
    : (qr?.configured && qr.imageBase64 ? `data:${qr.contentType};base64,${qr.imageBase64}` : '')

  return (
    <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card">
        <SectionTitle
          title={qr?.configured ? 'Replace payment QR' : 'Publish payment QR'}
          subtitle="Members scan this to pay maintenance, then raise a payment claim."
        />
        <Alert type="error">{error}</Alert>
        <form onSubmit={save} className="mt-3 space-y-3" noValidate>
          <div>
            <label className="label">QR image (PNG / JPG / WebP, max 1 MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={pickFile}
              className="input !py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-700"
            />
            {picked && (
              <p className="mt-1 break-all text-xs font-medium text-teal-700">
                Ready to upload · {picked.fileName}
              </p>
            )}
          </div>
          <div>
            <label className="label">UPI ID (optional)</label>
            <input
              className="input"
              value={form.upiId}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              placeholder="society@bank"
              maxLength={100}
            />
          </div>
          <div>
            <label className="label">Instruction shown to members (optional)</label>
            <textarea
              className="input"
              rows="2"
              value={form.instruction}
              onChange={(e) => setForm({ ...form, instruction: e.target.value })}
              placeholder="Scan to pay society maintenance"
              maxLength={250}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary flex-1" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving…' : qr?.configured ? 'Save changes' : 'Publish QR'}
            </button>
            {picked && (
              <button type="button" className="btn-secondary" onClick={clearPicked}>
                Cancel upload
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Keep the QR current. Residents rely on it for every maintenance cycle.
          </p>
        </form>
      </div>

      <div className="card">
        <SectionTitle
          title="What members see"
          subtitle={qr?.configured ? `Updated ${formatNoticeDate(qr.updatedAt)}` : 'Nothing published yet'}
          action={
            qr?.configured ? (
              <button
                type="button"
                className="btn-secondary w-full !border-red-200 !text-red-700 hover:!bg-red-50 sm:w-auto"
                disabled={busy === 'remove'}
                onClick={remove}
              >
                {busy === 'remove' ? 'Removing…' : 'Remove QR'}
              </button>
            ) : null
          }
        />
        {previewSrc ? (
          <div className="space-y-3">
            <div className="grid place-items-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <img
                src={previewSrc}
                alt="Society payment QR"
                className="max-h-64 w-auto rounded-xl bg-white p-2 shadow-sm"
              />
            </div>
            <p className="break-words text-sm text-slate-600">
              {form.instruction.trim() || qr?.instruction || 'Scan to pay society maintenance'}
            </p>
            {(form.upiId.trim() || qr?.upiId) && (
              <p className="break-all text-sm font-semibold text-slate-900">
                UPI · {form.upiId.trim() || qr?.upiId}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Upload the society UPI QR so residents can pay without asking for account details.
          </p>
        )}
      </div>
    </div>
  )
}
