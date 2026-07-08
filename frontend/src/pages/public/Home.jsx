import { Link } from 'react-router-dom'

const features = [
  { title: 'Member Directory', desc: 'Maintain flat-wise resident records in one place.' },
  { title: 'Maintenance Tracker', desc: 'Collect dues and flag pending payments instantly.' },
  { title: 'Expense Logging', desc: 'Record every society expense with full details.' },
  { title: 'Notice Board', desc: 'Broadcast announcements and rules to all members.' },
  { title: 'Financial Reports', desc: 'Monthly income-expense and annual balance sheets.' },
  { title: 'Share on WhatsApp', desc: 'Send reports to members without saving numbers.' },
]

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-white">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">
          Run your housing society the smart way.
        </h1>
        <p className="mt-4 max-w-xl text-brand-50">
          A simple, secure platform to manage members, maintenance, expenses, notices and
          financial reports — built for committees and residents.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Register Your Society
          </Link>
          <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10">
            Member Login
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Everything your committee needs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
