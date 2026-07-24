import { Link } from 'react-router-dom'
import { SITE_EMAIL, SITE_PHONES, mailtoHref, telHref } from '../../utils/siteContact'

const values = [
  {
    title: 'Transparency',
    body: 'Collections, expenses and claims stay review-ready for residents, audits and AGMs — not locked in private chats.',
  },
  {
    title: 'Simplicity',
    body: 'Secretaries and treasurers get clear workflows for members, maintenance, notices and bank details without heavy training.',
  },
  {
    title: 'Trust',
    body: 'Members can view dues, submit payment claims and follow society updates with clear committee and resident access.',
  },
  {
    title: 'Accountability',
    body: 'Every payment, expense, approval and committee decision is securely recorded, making society operations transparent and accountable.',
  },
]

const longTerm = [
  ['One platform', 'Replace scattered spreadsheets, WhatsApp threads and paper registers with a single society management system.'],
  ['Built on transparency', 'Every payment, expense, approval and notice is securely recorded, helping committees build trust with residents through complete visibility.'],
  ['Grow with you', 'Whether your society has 20 apartments or 2,000, SocietyWale scales with your community while keeping operations simple and organized.'],
]

export default function About() {
  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[#fff9f6]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="eyebrow">About SocietyWale</p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              A clearer management solution for housing societies.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              We help committees run maintenance, expenses, notices and member records with transparency residents can trust — so everyday society work stays organised for the long term.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary !bg-orange-500 hover:!bg-orange-600">Start free</Link>
              <Link to="/contact" className="btn-secondary">Talk to us</Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 shadow-2xl shadow-slate-900/10">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
              alt="Modern residential buildings representing organised society living"
              className="h-72 w-full object-cover sm:h-96"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-orange-300">Built for India</p>
              <p className="mt-1 text-sm font-semibold">Committees · Residents · Everyday accountability</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-8">
            <p className="eyebrow">Vision</p>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-950">A better way to manage every housing society in India.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
            We envision housing societies where committee members, residents and service staff work together through one trusted digital workspace. From maintenance collections to notices, expenses and records, SocietyWale aims to make community management simple, transparent and accessible for every society.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-8">
            <p className="eyebrow">Mission</p>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-950">Making society management simpler, faster and more transparent.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
            Our mission is to help housing societies replace spreadsheets, paper registers and scattered WhatsApp conversations with one secure platform. SocietyWale empowers committee members to manage finances, maintenance, communication and day-to-day operations while giving residents complete visibility into their community.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="eyebrow">Our values</p>
          <h2 className="section-title mt-5">The principles behind SocietyWale.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h3 className="font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="eyebrow">Long-term purpose</p>
        <h2 className="section-title mt-5">All-in-one digital platform for housing societies.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
        SocietyWale is built to simplify everyday society management for committees and residents. As communities grow, we help them stay organized with transparent finances, reliable communication and secure records all from one platform.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {longTerm.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#fff9f6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-16">
          <div>
            <p className="eyebrow">Talk to the team</p>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">Ready to set up your society?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Email{' '}
              <a className="font-semibold text-orange-600 hover:text-orange-700" href={mailtoHref()}>{SITE_EMAIL}</a>
              {' '}or call{' '}
              <a className="font-semibold text-orange-600 hover:text-orange-700" href={telHref(SITE_PHONES[0].digits)}>
                +91 {SITE_PHONES[1].label}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary !bg-orange-500 hover:!bg-orange-600">Create workspace</Link>
            <Link to="/contact" className="btn-secondary">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
