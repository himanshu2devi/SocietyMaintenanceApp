import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE_EMAIL, SITE_PHONES, mailtoHref } from '../utils/siteContact'
import { AssistantService } from '../api/services'
import { getApiErrorMessage } from '../utils/apiError'

const STARTERS = [
  'What does SocietyWale do?',
  'How do we get started?',
  'What can committees manage?',
  'How do I contact you?',
]

const WELCOME =
  'Hi — I am the SocietyWale assistant. Ask me anything about our society management app, onboarding, features, or support.'

/** Sparkle / AI mark — reads as smart assistant, not generic support chat */
function AiIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2.5 13.4 8.1 19 9.5l-5.6 1.4L12 16.5l-1.4-5.6L5 9.5l5.6-1.4L12 2.5Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      <path
        d="M18.2 14.2 18.9 16.6 21.3 17.3l-2.4.7-.7 2.4-.7-2.4-2.4-.7 2.4-.7.7-2.4Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M5.8 13.8 6.35 15.7 8.25 16.25l-1.9.55-.55 1.9-.55-1.9-1.9-.55 1.9-.55.55-1.9Z"
        fill="currentColor"
        fillOpacity="0.75"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5" aria-label="Assistant is thinking">
      <span className="ai-typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="ai-typing-dot" style={{ animationDelay: '160ms' }} />
      <span className="ai-typing-dot" style={{ animationDelay: '320ms' }} />
    </div>
  )
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [configured, setConfigured] = useState(null)
  const [messages, setMessages] = useState([{ role: 'bot', text: WELCOME }])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, busy])

  useEffect(() => {
    let cancelled = false
    AssistantService.status()
      .then((res) => {
        if (!cancelled) setConfigured(!!res?.configured)
      })
      .catch(() => {
        if (!cancelled) setConfigured(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function ask(question) {
    const q = question.trim()
    if (!q || busy) return

    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setBusy(true)

    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'bot')
      .slice(-10)
      .map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      }))

    try {
      const res = await AssistantService.chat({ message: q, history })
      setConfigured(true)
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply || 'Sorry — I could not answer that.' }])
    } catch (err) {
      const msg = getApiErrorMessage(err, '')
      if (/not configured|GROQ_API_KEY/i.test(msg)) {
        setConfigured(false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `The live assistant is not connected yet. Email ${SITE_EMAIL} or call +91 ${SITE_PHONES[0].label} / +91 ${SITE_PHONES[1].label}.`,
            link: { href: mailtoHref('SocietyWale enquiry'), label: 'Email us' },
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: msg || 'Assistant is temporarily unavailable. Please try again or contact us.',
            link: { to: '/contact', label: 'Contact us' },
          },
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setInput('')
    ask(q)
  }

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3">
      {open && (
        <div className="ai-panel-enter flex h-[min(440px,calc(100dvh-8rem))] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="bg-[linear-gradient(135deg,#102A43,#0f766e)] px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-teal-600 text-white shadow">
                <span className="absolute inset-0 animate-pulse bg-white/10" aria-hidden="true" />
                <AiIcon className="relative h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  SocietyWale AI
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-100">
                    Smart
                  </span>
                </p>
                <p className="truncate text-xs text-teal-100">
                  {configured === false ? 'Setup pending · contact support' : 'Ask about features, onboarding & support'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                  m.role === 'user' ? 'ml-auto bg-orange-500 text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.link?.to && (
                  <Link to={m.link.to} className="mt-2 inline-block text-xs font-bold text-orange-600 hover:text-orange-700">
                    {m.link.label} →
                  </Link>
                )}
                {m.link?.href && (
                  <a href={m.link.href} className="mt-2 inline-block text-xs font-bold text-orange-600 hover:text-orange-700">
                    {m.link.label} →
                  </a>
                )}
              </div>
            ))}
            {busy && (
              <div className="max-w-[70%] rounded-2xl bg-slate-50 px-3 py-2.5">
                <TypingDots />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-slate-100 px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(s)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-orange-200 hover:text-orange-700 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex min-w-0 gap-2">
              <input
                className="input min-w-0 flex-1 !py-2 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI assistant…"
                maxLength={1000}
                disabled={busy}
              />
              <button type="submit" className="btn-primary shrink-0 !px-3 !py-2 text-sm" disabled={busy}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="ai-fab-wrap relative">
        {!open && <span className="ai-fab-label">Ask AI</span>}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`ai-fab ${open ? '!animate-none' : ''}`}
          aria-label={open ? 'Close AI assistant' : 'Open SocietyWale AI assistant'}
          aria-expanded={open}
        >
          {!open && (
            <>
              <span className="ai-fab-ring" aria-hidden="true" />
              <span className="ai-fab-ring ai-fab-ring-delay" aria-hidden="true" />
              <span className="ai-fab-spark" aria-hidden="true">
                <svg viewBox="0 0 8 8" className="h-2 w-2" fill="currentColor">
                  <path d="M4 0l.7 2.3L7 3l-2.3.7L4 6l-.7-2.3L1 3l2.3-.7L4 0z" />
                </svg>
              </span>
            </>
          )}
          <span className="relative z-10">{open ? <CloseIcon /> : <AiIcon className="h-7 w-7" />}</span>
        </button>
      </div>
    </div>
  )
}
