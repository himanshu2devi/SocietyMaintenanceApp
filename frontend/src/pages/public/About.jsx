export default function About() {
  return (
    <div>
      <section className="border-b border-slate-200 bg-[#fff9f6]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <p className="eyebrow">About SocietyWale</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-6xl">A better daily operating system for housing societies.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">We are focused on making the committee’s essential work easier to understand, easier to run and more transparent for residents.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div><p className="eyebrow">Why we exist</p><h2 className="section-title mt-5">Local societies deserve more than scattered records and endless follow-ups.</h2></div>
        <div className="space-y-5 text-base leading-7 text-slate-600"><p>SocietyWale brings everyday operations into one purposeful workspace: member information, maintenance, expenses, notices and reporting.</p><p>We are beginning with society communities in India, with a practical product that works for real committees and real residents.</p></div>
      </section>
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Transparent by default', 'Record collections and expenses in a way that is ready to review.'],
          ['Built with access control', 'Committee and member roles are intentionally separated.'],
          ['Ready for everyday use', 'Designed for desktop now, with a mobile-first future in mind.'],
        ].map(([t, d]) => (
          <div key={t} className="card p-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 font-bold text-orange-600">✓</span>
            <h3 className="mt-5 font-bold text-slate-950">{t}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
          </div>
        ))}
          </div>
        </div>
      </section>
    </div>
  )
}
