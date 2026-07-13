import { Link } from 'react-router-dom'

/** Features shown on the public homepage — what SocietyWale offers committees and residents today. */
const features = [
  {
    icon: '⌂',
    title: 'Member directory',
    desc: 'Keep flat-wise resident records with email and mobile so your committee always has the right contacts.',
  },
  {
    icon: '★',
    title: 'Committee workspace',
    desc: 'Publish chairman, secretary and treasurer contacts so residents always know whom to reach.',
  },
  {
    icon: '₹',
    title: 'Maintenance tracking',
    desc: 'Set rates, track paid vs pending dues by flat and month, and keep collection history clear.',
  },
  {
    icon: '✓',
    title: 'Payment claims',
    desc: 'Members notify cash or online payments with references; committee reviews and marks dues paid.',
  },
  {
    icon: '🏦',
    title: 'Society bank accounts',
    desc: 'Publish primary bank / UPI details so residents know exactly where to pay maintenance.',
  },
  {
    icon: '▤',
    title: 'Expense logging',
    desc: 'Record operational expenses in one place for transparent committee spending.',
  },
  {
    icon: '◉',
    title: 'Notices & rules',
    desc: 'Post announcements and bye-law style rules, then notify members with an in-app alert.',
  },
  {
    icon: '⚠',
    title: 'Complaint tracker',
    desc: 'Residents and committee raise, update and close society issues with clear status and ownership.',
  },
  {
    icon: '↗',
    title: 'Reports & audit files',
    desc: 'Download branded monthly/annual financial PDFs and store audit documents for AGM-ready sharing.',
  },
  {
    icon: '◌',
    title: 'Resident portal',
    desc: 'Members view dues, claims, notices, complaints, bank details and committee contacts securely.',
  },
]

const trustPoints = [
  ['Committee control', 'Only your managing committee can add or change society records. Residents see what they need — nothing more.'],
  ['Your society, private', 'Each housing society gets its own workspace. Members and data stay within your society only.'],
  ['Ready for AGMs', 'Collections, expenses, notices and payment claims stay organised for reviews, audits and yearly meetings.'],
  ['Safer everyday access', 'Secure sign-in with automatic logout after inactivity, so committee work stays protected on shared devices.'],
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate overflow-hidden bg-[#fff9f6]">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_90%_15%,rgba(255,122,69,.17),transparent_28%),radial-gradient(circle_at_5%_60%,rgba(15,157,138,.09),transparent_26%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-24">
          <div>
            <p className="eyebrow">Smart Society Management solution for India</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Run your housing society with <span className="text-orange-500">clarity, control and trust.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              SocietyWale helps managing committees and residents run the society day to day — maintenance, members, notices, expenses, payment claims and clear reports in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600">
                Start your society workspace <span aria-hidden="true">→</span>
              </Link>
              <Link to="/contact" className="btn-secondary !px-6 !py-3.5">Talk to us</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Built for committees</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Resident self-service</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Audit-friendly records</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="relative rounded-[28px] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
              <div className="rounded-[20px] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Committee overview</p>
                    <h2 className="mt-1 text-xl font-bold">Good evening, Secretary</h2>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-orange-300">⌂</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric value="84%" label="Collected" />
                  <Metric value="₹ 1.2L" label="This month" />
                  <Metric value="8" label="Pending flats" />
                </div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Collections this month</p>
                      <p className="mt-1 text-2xl font-extrabold">₹ 1,24,500</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">On track</span>
                  </div>
                  <div className="mt-4 flex h-20 items-end gap-2">
                    {[35, 52, 44, 68, 61, 83, 74, 95].map((height, i) => (
                      <span key={i} className="flex-1 rounded-t-md bg-orange-100" style={{ height: `${height}%` }}>
                        <span className={`block h-full rounded-t-md ${i > 5 ? 'bg-orange-500' : 'bg-orange-300'}`} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden max-w-[225px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/10 sm:block">
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

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Everything you need to operate</p>
          <h2 className="section-title mt-5">Society operations, organised for committees and residents.</h2>
          <p className="section-copy">
            Built for real housing societies — replace scattered spreadsheets, WhatsApp threads and paper registers with one accountable workspace.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/[.04]"
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

      <section id="trust" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Trust & security</p>
            <h2 className="section-title mt-5">Built for responsible society administration.</h2>
            <p className="section-copy">
              Built for secretaries, treasurers and residents — so your society stays organised, transparent and easier to run every month.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="committees" className="bg-[#fff9f6]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="rounded-[28px] bg-teal-900 p-8 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Designed for real operations</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              No more wondering who paid, what was spent, or what residents were told.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                'A reliable record for every flat',
                'Payment claims with committee approval',
                'Notices that reach members in-app',
                'Reports and audit files ready to share',
              ].map((text) => (
                <p key={text} className="flex gap-3 text-sm leading-6 text-teal-50">
                  <span className="font-bold text-orange-300">✓</span>
                  {text}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">For managing committees</p>
            <h2 className="section-title mt-5">Professional operations without complex enterprise software.</h2>
            <p className="section-copy">
              Start with the essentials your society needs now. SocietyWale is built as a long-term society management platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary !bg-slate-950">
                Create your workspace <span aria-hidden="true">→</span>
              </Link>
              <Link to="/about" className="btn-secondary">
                Our vision
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">FAQs</p>
            <h2 className="section-title mt-5">Questions committees might ask before signing up.</h2>
            <p className="section-copy">
              Straight answers for Indian housing societies evaluating SocietyWale as their daily operations workspace.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {[
              [
                'What is SocietyWale?',
                'SocietyWale is society management software for Indian housing societies and RWAs — maintenance, members, notices, expenses, complaints and audit-ready reports in one secure workspace.',
              ],
              [
                'Who is it for?',
                'Managing committees (admins) run day-to-day operations. Residents (members) use a simple portal to view dues, notices, bank details and raise payment claims or complaints.',
              ],
              [
                'How do we get started?',
                'Create a society workspace, share your society code with residents, publish committee contacts and bank details, then start tracking maintenance.',
              ],
              [
                'Can members raise complaints?',
                'Yes. Members and admins can add, edit and delete complaints. Committee admins can update status and notes so issues stay tracked until resolved.',
              ],
              [
                'Are financial reports available?',
                'Yes. Generate monthly and annual statements and download branded PDFs with your society name, powered by societywale.in.',
              ],
              [
                'How do we reach support?',
                'Email or call us from the Contact page. We help committees with onboarding, member access and day-to-day product questions.',
              ],
            ].map(([q, a]) => (
              <article key={q} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
                <h3 className="text-base font-bold text-slate-950">{q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="eyebrow">Smart Society Management Solution</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
          Bring clarity to your society’s everyday work.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
          Create your society workspace, add members, publish bank details and start tracking maintenance in one afternoon.
        </p>
        <Link to="/register" className="btn-primary mt-8 !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600">
          Get started with SocietyWale →
        </Link>
      </section>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-base font-extrabold">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-300">{label}</p>
    </div>
  )
}
