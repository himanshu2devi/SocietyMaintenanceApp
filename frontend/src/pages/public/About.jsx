export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p className="text-gray-600">
        SocietyHub is a lightweight society management platform that helps residential
        committees digitize their day-to-day operations — from member records and
        maintenance collection to expense tracking and transparent financial reporting.
      </p>
      <p className="text-gray-600">
        Our goal is to make society administration transparent and effortless, so committees
        can spend less time on paperwork and more time building community.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Transparent', 'Every rupee in and out is recorded and reportable.'],
          ['Secure', 'Role-based access with JWT-secured APIs.'],
          ['Mobile-ready', 'Designed to move seamlessly to a mobile app.'],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-gray-500">{d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
