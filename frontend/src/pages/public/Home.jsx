import { Link } from 'react-router-dom'

const features = [
  { icon: '⌂', title: 'Member records', desc: 'Keep flat-wise owners and residents organised, accessible and up to date.' },
  { icon: '₹', title: 'Maintenance collection', desc: 'Track paid and pending maintenance without chasing spreadsheets.' },
  { icon: '▤', title: 'Expense transparency', desc: 'Record every operational expense and give your committee one source of truth.' },
  { icon: '◉', title: 'Notice centre', desc: 'Publish important updates and society rules where every member can find them.' },
  { icon: '↗', title: 'Clear reports', desc: 'Review monthly income, expenses and outstanding dues in a few clicks.' },
  { icon: '◌', title: 'Member-ready updates', desc: 'Share concise report summaries on WhatsApp, without saving contacts.' },
]

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative isolate overflow-hidden bg-[#fff9f6]">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_90%_15%,rgba(255,122,69,.17),transparent_28%),radial-gradient(circle_at_5%_60%,rgba(15,157,138,.09),transparent_26%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-28 lg:pt-24">
          <div>
            <p className="eyebrow">Built for Satara’s society communities</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Society management that feels <span className="text-orange-500">clear, calm and in control.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              SocietyWale gives committees and residents one dependable place for maintenance, expenses, member records, notices and financial visibility.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600">Start your society workspace <span aria-hidden="true">→</span></Link>
              <Link to="/login" className="btn-secondary !px-6 !py-3.5">Member sign in</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Committee-first workflows</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Role-based access</span>
              <span className="inline-flex items-center gap-2"><b className="text-emerald-600">✓</b> Simple for every resident</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-orange-200/60 blur-3xl" />
            <div className="relative rounded-[28px] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
              <div className="rounded-[20px] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">Committee overview</p><h2 className="mt-1 text-xl font-bold">Good evening, Secretary</h2></div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-orange-300">⌂</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Metric value="84%" label="Collected" />
                  <Metric value="₹ 1.2L" label="This month" />
                  <Metric value="8" label="Pending flats" />
                </div>
                <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-500">Collections this month</p><p className="mt-1 text-2xl font-extrabold">₹ 1,24,500</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">On track</span></div>
                  <div className="mt-4 flex h-20 items-end gap-2">
                    {[35, 52, 44, 68, 61, 83, 74, 95].map((height, i) => <span key={i} className="flex-1 rounded-t-md bg-orange-100" style={{ height: `${height}%` }}><span className={`block h-full rounded-t-md ${i > 5 ? 'bg-orange-500' : 'bg-orange-300'}`} /></span>)}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden max-w-[225px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/10 sm:block">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">✓</span><div><p className="text-sm font-bold text-slate-900">Expense logged</p><p className="text-xs text-slate-500">Security services · ₹12,500</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl"><p className="eyebrow">One connected workspace</p><h2 className="section-title mt-5">The essentials, done properly.</h2><p className="section-copy">Every workflow is designed to replace scattered registers, WhatsApp threads and last-minute committee follow-ups.</p></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/[.04]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-lg font-bold text-orange-600">{feature.icon}</span>
              <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.desc}</p>
              <span className="mt-5 inline-block text-sm font-bold text-slate-800 transition group-hover:text-orange-600">Explore workflow →</span>
            </article>
          ))}
        </div>
      </section>

      <section id="committees" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="rounded-[28px] bg-teal-900 p-8 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">Designed for real operations</p><h2 className="mt-4 text-3xl font-bold leading-tight">No more wondering who paid, what was spent, or what residents were told.</h2><div className="mt-8 space-y-4">{['A reliable record for every flat', 'One view of income, expenses and dues', 'Clear communication for members'].map((text) => <p key={text} className="flex gap-3 text-sm leading-6 text-teal-50"><span className="font-bold text-orange-300">✓</span>{text}</p>)}</div></div>
          <div><p className="eyebrow">Made for committees and members</p><h2 className="section-title mt-5">Professional operations without complex software.</h2><p className="section-copy">Start with everyday essentials today. Your SocietyWale workspace stays focused, accessible and ready to grow alongside your community.</p><Link to="/register" className="btn-primary mt-8 !bg-slate-950">Create your workspace <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="eyebrow">Ready when your committee is</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Bring clarity to your society’s everyday work.</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">Create your society workspace and invite your first members when you are ready.</p>
        <Link to="/register" className="btn-primary mt-8 !bg-orange-500 !px-6 !py-3.5 hover:!bg-orange-600">Get started with SocietyWale →</Link>
      </section>
    </div>
  )
}

function Metric({ value, label }) {
  return <div className="rounded-xl bg-white/10 p-3"><p className="text-base font-extrabold">{value}</p><p className="mt-1 text-[11px] font-medium text-slate-300">{label}</p></div>
}
