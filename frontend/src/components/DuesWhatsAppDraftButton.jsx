import { useEffect, useState } from 'react'
import { SocietyAiService } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getApiErrorMessage } from '../utils/apiError'
import { monthName, whatsappLink } from '../utils/share'
import { AiLanguageSelect } from './AiLanguageSelect'

/**
 * AI WhatsApp dues reminder for a pending maintenance row.
 */
export default function DuesWhatsAppDraftButton({ row, societyName }) {
  const { user } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState('en')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setDraft('')
      setError('')
    }
  }, [open])

  if (!row || row.status === 'PAID') return null

  async function generate() {
    setBusy(true)
    setError('')
    try {
      const res = await SocietyAiService.duesWhatsAppDraft({
        language,
        societyName: societyName || user?.societyName || 'Society',
        memberName: row.memberName || 'Resident',
        flatNumber: row.flatNumber || '—',
        memberMobile: row.memberMobile || '',
        amount: Number(row.amount || 0),
        billingMonth: Number(row.billingMonth),
        billingYear: Number(row.billingYear),
      })
      setDraft(res.message || '')
      toast.success('WhatsApp draft ready.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not generate WhatsApp draft.'))
    } finally {
      setBusy(false)
    }
  }

  async function copyDraft() {
    if (!draft) return
    try {
      await navigator.clipboard.writeText(draft)
      toast.success('Copied to clipboard.')
    } catch {
      toast.error('Could not copy. Select the text manually.')
    }
  }

  function openWhatsApp() {
    if (!draft) return
    const phone = String(row.memberMobile || '').replace(/\D/g, '')
    const withCountry = phone.length === 10 ? `91${phone}` : phone
    window.open(whatsappLink(draft, withCountry || undefined), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-2 min-w-0 w-full">
      <button
        type="button"
        className="btn-secondary w-full !px-2.5 !py-2 !text-xs sm:w-auto sm:!py-1.5"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide AI draft' : 'AI WhatsApp draft'}
      </button>

      {open && (
        <div className="mt-2 min-w-0 max-w-full rounded-xl border border-teal-100 bg-teal-50/60 p-3">
          <p className="text-xs font-semibold text-slate-700">
            Pending reminder · {monthName(row.billingMonth)} {row.billingYear}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="label" htmlFor={`dues-lang-${row.key}`}>Language</label>
              <AiLanguageSelect
                id={`dues-lang-${row.key}`}
                value={language}
                onChange={setLanguage}
                disabled={busy}
              />
            </div>
            <button
              type="button"
              className="btn-primary w-full shrink-0 !bg-teal-600 !py-2.5 hover:!bg-teal-700 sm:w-auto"
              disabled={busy || Number(row.amount || 0) <= 0}
              onClick={generate}
            >
              {busy ? 'Writing…' : 'Generate'}
            </button>
          </div>
          {Number(row.amount || 0) <= 0 && (
            <p className="mt-2 text-xs text-amber-700">Set / record an amount before generating a reminder.</p>
          )}
          {error && <p className="mt-2 text-xs font-medium text-red-600 break-words">{error}</p>}
          {draft && (
            <>
              <textarea
                className="input mt-3 min-h-[7rem] w-full max-w-full text-sm leading-6"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={copyDraft}>Copy</button>
                <button type="button" className="btn-success w-full sm:flex-1 sm:max-w-xs" onClick={openWhatsApp}>
                  Open WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
