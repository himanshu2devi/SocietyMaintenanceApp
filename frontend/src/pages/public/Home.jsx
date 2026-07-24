import { Link } from 'react-router-dom'
import FaqJsonLd from '../../components/FaqJsonLd'

/** Features shown on the public homepage — what SocietyWale offers committees and residents today. */
const features = [
  {
    icon: '⌂',
    title: 'Member directory',
    desc: 'Keep flat-wise resident records with email and mobile in this apartment management system so your committee always has the right contacts.',
  },
  {
    icon: '★',
    title: 'Committee workspace',
    desc: 'Publish chairman, secretary and treasurer contacts in your RWA management app so residents always know whom to reach.',
  },
  {
    icon: '₹',
    title: 'Maintenance tracking',
    desc: 'Use society maintenance billing software to set rates, track paid vs pending dues by flat and month, and keep collection history clear.',
  },
  {
    icon: '✓',
    title: 'Payment claims',
    desc: 'Members notify cash or online payments with references via this society maintenance payment app; committee reviews and marks dues paid.',
  },
  {
    icon: '🏦',
    title: 'Society bank accounts',
    desc: 'Publish primary bank / UPI details with society accounting software so residents know exactly where to pay maintenance.',
  },
  {
    icon: '▤',
    title: 'Expense logging',
    desc: 'Record operational expenses in one place for transparent committee spending and fewer cooperative housing society billing errors.',
  },
  {
    icon: '◉',
    title: 'Notices & rules',
    desc: 'Post smart notices and bye-law style rules, then notify members with an in-app alert across your gated community workspace.',
  },
  {
    icon: '⚠',
    title: 'Complaint tracker',
    desc: 'Residents and committee raise, update and close issues with a society complaint tracker tool — clear status and ownership every time.',
  },
  {
    icon: '↗',
    title: 'Reports & audit files',
    desc: 'Download branded monthly/annual financial PDFs and store audit documents for AGM-ready sharing from your smart society management app.',
  },
  {
    icon: '◌',
    title: 'Resident portal',
    desc: 'Members view dues, claims, notices, complaints, bank details and committee contacts securely — built for older residents and busy families.',
  },
]

const trustPoints = [
  ['Committee control', 'Only your managing committee can add or change society records. Residents see what they need — nothing more.'],
  ['Your society, private', 'Each housing society gets its own workspace. Members and data stay within your society only — designed with Indian digital privacy expectations in mind.'],
  ['Ready for AGMs', 'Collections, expenses, notices and payment claims stay organised for reviews, audits and yearly meetings.'],
  ['Safer everyday access', 'Secure sign-in with automatic logout after inactivity, so committee work stays protected on shared devices.'],
]

export default function Home() {
  return (
    <main className="w-full min-w-0 overflow-hidden">
      <FaqJsonLd />
      <section className="relative isolate overflow-hidden bg-[#fff9f6]" aria-label="Hero — AI-powered society management software for India">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_90%_15%,rgba(255,122,69,.17),transparent_28%),radial-gradient(circle_at_5%_60%,rgba(15,157,138,.09),transparent_26%)]" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 pb-12 pt-10 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-20 xl:pt-24">
          <div className="min-w-0 w-full">
            <p className="eyebrow">AI-Powered Society Management Software for India</p>
            <h1 className="mt-4 max-w-3xl text-2xl font-extrabold leading-[1.15] tracking-tight text-slate-950 sm:mt-6 sm:text-4xl sm:leading-[1.1] md:text-5xl xl:text-6xl">
              AI-powered society management software for India — with <span className="text-orange-500">clarity, control and trust.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              SocietyWale is AI-powered society management software for Indian housing societies and RWAs — with automated maintenance billing, smart notices, an integrated AI chatbot, complaint tracking, UPI-ready society accounting and audit-ready reports in one secure workspace.
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="btn-primary w-full justify-center !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600 sm:w-auto"
                aria-label="Start your society workspace — register for SocietyWale AI society management software"
              >
                Start your society workspace <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/contact"
                className="btn-secondary w-full justify-center !px-6 !py-3.5 sm:w-auto"
                aria-label="Talk to us about SocietyWale society management software for Indian housing societies"
              >
                Talk to us
              </Link>
            </div>
            <div className="mt-6 flex flex-col gap-2 text-sm font-medium text-slate-600 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Built for Indian committees</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> AI-assisted operations</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Audit-friendly records</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl min-w-0 px-0 sm:px-0">
            <div className="absolute -right-4 -top-6 h-32 w-32 rounded-full bg-orange-200/60 blur-3xl sm:-right-8 sm:-top-8 sm:h-40 sm:w-40" />
            <div className="relative w-full rounded-[20px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 sm:rounded-[28px] sm:p-3">
              <div className="rounded-[16px] bg-slate-950 p-3 text-white sm:rounded-[20px] sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 sm:pb-5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-300 sm:text-xs">Committee overview</p>
                    <h2 className="mt-1 truncate text-base font-bold sm:text-xl">Good evening, Secretary</h2>
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-orange-300 sm:h-10 sm:w-10">⌂</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-5 sm:gap-3">
                  <Metric value="84%" label="Collected" />
                  <Metric value="₹ 1.2L" label="This month" />
                  <Metric value="8" label="Pending flats" />
                </div>
                <div className="mt-3 rounded-2xl bg-white p-2.5 text-slate-900 sm:mt-5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Collections this month</p>
                      <p className="mt-1 text-lg font-extrabold sm:text-2xl">₹ 1,24,500</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">On track</span>
                  </div>
                  <div className="mt-4 flex h-16 items-end gap-1.5 sm:h-20 sm:gap-2">
                    {[35, 52, 44, 68, 61, 83, 74, 95].map((height, i) => (
                      <span key={i} className="flex-1 rounded-t-md bg-orange-100" style={{ height: `${height}%` }}>
                        <span className={`block h-full rounded-t-md ${i > 5 ? 'bg-orange-500' : 'bg-orange-300'}`} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 hidden max-w-[min(225px,70%)] rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-900/10 sm:bottom-auto sm:-bottom-6 sm:left-auto sm:-left-4 sm:block sm:p-4 lg:-left-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Expense logged</p>
                    <p className="text-xs text-slate-500">Security services · ₹12,500</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-28" aria-label="Society management software features">
        <div className="max-w-2xl min-w-0">
          <p className="eyebrow">Everything you need to operate</p>
          <h2 className="section-title mt-5">AI housing society software organised for committees and residents.</h2>
          <p className="section-copy">
            Built for real housing societies across India — replace scattered spreadsheets, WhatsApp threads and paper registers with one accountable cooperative housing society software workspace.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/[.04] sm:p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-lg font-bold text-orange-600">
                {feature.icon}
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className="border-y border-slate-200 bg-white" aria-label="Trust and security for Indian housing societies">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-2xl min-w-0">
            <p className="eyebrow">Trust & security</p>
            <h2 className="section-title mt-5">Built for responsible society administration across India.</h2>
            <p className="section-copy">
              Built for secretaries, treasurers and residents — so your society stays organised, transparent and easier to run every month with secure society app practices.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-6">
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="committees" className="bg-[#fff9f6]" aria-label="For managing committees and RWAs">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="min-w-0 rounded-[22px] bg-teal-900 p-5 text-white sm:rounded-[28px] sm:p-8 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Designed for real operations</p>
            <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
              No more wondering who paid, what was spent, or what residents were told.
            </h2>
            <div className="mt-6 space-y-4 sm:mt-8">
              {[
                'A reliable record for every flat',
                'Automated maintenance bill tracking with committee approval',
                'Smart notices that reach members in-app',
                'Reports and audit files ready to share',
              ].map((text) => (
                <p key={text} className="flex gap-3 text-sm leading-6 text-teal-50">
                  <span className="shrink-0 font-bold text-orange-300">✓</span>
                  <span className="min-w-0">{text}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="eyebrow">For managing committees</p>
            <h2 className="section-title mt-5">Professional RWA operations without complex enterprise software.</h2>
            <p className="section-copy">
              Start with the essentials your society needs now. SocietyWale is built as long-term AI-powered society management software for small apartment buildings and large gated communities alike.
            </p>
            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="btn-primary w-full justify-center !bg-slate-950 sm:w-auto"
                aria-label="Create your SocietyWale workspace for housing society management"
              >
                Create your workspace <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/about"
                className="btn-secondary w-full justify-center sm:w-auto"
                aria-label="Read our vision for AI-powered society management software in India"
              >
                Our vision
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-white" aria-label="Frequently asked questions about society management software">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-2xl min-w-0">
            <p className="eyebrow">FAQs</p>
            <h2 className="section-title mt-5">Questions about society apps in India.</h2>
            <p className="section-copy">
              Straight answers for Indian housing societies evaluating SocietyWale as their daily AI-powered operations workspace.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 lg:grid-cols-2">
            {[
              [
                'Which is a secure society app in India for housing societies?',
                'SocietyWale is society management software for Indian housing societies and RWAs — with private per-society workspaces, secure sign-in, maintenance, members, notices, expenses, complaints and audit-ready reports.',
              ],
              [
                'What AI tools help manage residential building maintenance fees?',
                'SocietyWale combines AI-powered features such as automated maintenance billing, smart notices and an integrated AI chatbot so committees can reduce manual work while tracking paid vs pending dues by flat.',
              ],
              [
                'How can we automate housing society accounting and billing?',
                'Set society rates or per-member amounts, publish bank/UPI details, let members raise payment claims, approve collections, log expenses and download branded financial PDFs — fewer spreadsheet errors in cooperative housing society billing.',
              ],
              [
                'Is there an affordable ad-free society app for small apartment buildings?',
                'Yes. SocietyWale is built for small apartment buildings and larger gated communities alike — an ad-free society management platform focused on committee and resident workflows, not ads.',
              ],
              [
                'How do we handle continuous non-payment of society maintenance?',
                'Track pending flats month by month, review payment claims with references, keep clear collection history and share reports with the committee so follow-ups on overdue society maintenance stay organised and fair.',
              ],
              [
                'Can a progressive web app replace native society management apps for older residents?',
                'SocietyWale runs in the browser as a practical workspace — residents can view dues, notices, bank details and raise claims or complaints without installing a heavy native app, which many older residents prefer.',
              ],
            ].map(([q, a]) => (
              <article key={q} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
                <h3 className="text-sm font-bold text-slate-950 sm:text-base">{q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-20 lg:py-28" aria-label="Get started with SocietyWale">
        <p className="eyebrow">AI-Powered Society Management Software</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
          Bring clarity to your society’s everyday work across India.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base">
          Create your society workspace, add members, publish bank details and start tracking maintenance with AI-assisted society management software — often in one afternoon.
        </p>
        <Link
          to="/register"
          className="btn-primary mt-6 inline-flex w-full max-w-sm justify-center !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600 sm:mt-8 sm:w-auto sm:max-w-none"
          aria-label="Get started with SocietyWale — create your AI society management workspace"
        >
          Get started with SocietyWale →
        </Link>
      </section>
    </main>
  )
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/10 p-2 sm:p-3">
      <p className="truncate text-sm font-extrabold sm:text-base">{value}</p>
      <p className="mt-1 truncate text-[10px] font-medium text-slate-300 sm:text-[11px]">{label}</p>
    </div>
  )
}
