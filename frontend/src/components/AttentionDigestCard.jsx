import { useEffect, useState } from 'react'
import { SocietyAiService } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getApiErrorMessage } from '../utils/apiError'
import { inr, monthName } from '../utils/share'
import { AiLanguageSelect } from './AiLanguageSelect'

/**
 * Admin overview card — AI “needs attention” digest from live society stats.
 * Pending dues match Maintenance Tracker (includes flats not yet recorded as charges).
 */
export default function AttentionDigestCard({ onNavigate }) {
  const { user } = useAuth()
  const toast = useToast()
  const [language, setLanguage] = useState('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  async function loadDigest({ notify = false, lang = language } = {}) {
    setBusy(true)
    setError('')
    try {
      const res = await SocietyAiService.attentionDigest({
        language: lang,
        societyName: user?.societyName || 'Your society',
      })
      setData(res)
      if (notify) toast.success('Digest refreshed.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load AI digest.'))
    } finally {
      setBusy(false)
    }
  }

  // Fresh live stats whenever Overview mounts or language changes.
  useEffect(() => {
    loadDigest({ lang: language })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refresh on language / mount
  }, [language, user?.societyName])

  const stats = data?.stats
  const periodLabel = stats
    ? `${monthName(stats.billingMonth)} ${stats.billingYear}`
    : ''

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[.03]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-teal-900 px-4 py-4 text-white sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-300">Powered by AI</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight sm:text-xl">Committee Digest</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Live priorities from Maintenance Tracker, claims, complaints and notices — refreshed when you open Overview.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[11rem] sm:max-w-[14rem]">
            <AiLanguageSelect value={language} onChange={setLanguage} disabled={busy} className="!bg-white !py-2.5 text-slate-900" />
            <button
              type="button"
              className="btn-secondary w-full !border-white/20 !bg-white/10 !py-2.5 !text-white hover:!bg-white/20"
              disabled={busy}
              onClick={() => loadDigest({ notify: true })}
            >
              {busy ? 'Refreshing…' : 'Refresh digest'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {error && <p className="text-sm font-medium text-red-600 break-words">{error}</p>}

        {stats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            <MiniStat
              label={`Pending (${periodLabel})`}
              value={String(stats.currentMonthPendingCount ?? stats.pendingDuesCount ?? 0)}
            />
            <MiniStat
              label={`Amount (${periodLabel})`}
              value={inr(stats.currentMonthPendingAmount ?? stats.pendingDuesAmount)}
            />
            <MiniStat label="Outstanding till date" value={String(stats.pendingDuesCount || 0)} />
            <MiniStat label="Till-date amount" value={inr(stats.pendingDuesAmount)} />
            <MiniStat label="Open complaints" value={String(stats.openComplaints || 0)} />
          </div>
        )}

        {stats && (
          <p className="text-xs text-slate-500">
            Claims awaiting review: {stats.submittedClaims || 0}
            {stats.hasBankAccount === false ? ' · Bank/UPI details missing' : ''}
          </p>
        )}

        {data?.summary && (
          <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-700 break-words">{data.summary}</p>
        )}

        {Array.isArray(data?.items) && data.items.length > 0 ? (
          <ul className="space-y-2">
            {data.items.map((item) => (
              <li
                key={`${item.type}-${item.title}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 break-words">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 break-words">{item.detail}</p>
                </div>
                {item.actionTab && onNavigate && (
                  <button
                    type="button"
                    className="btn-secondary w-full shrink-0 !py-2.5 !text-xs sm:w-auto"
                    onClick={() => onNavigate(item.actionTab)}
                  >
                    Open
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !busy && !error && data && (
            <p className="text-sm text-emerald-700">No urgent items — society operations look steady.</p>
          )
        )}

        {busy && !data && <p className="text-sm text-slate-500">Preparing your AI digest…</p>}
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold leading-snug text-slate-900">{value}</p>
    </div>
  )
}
