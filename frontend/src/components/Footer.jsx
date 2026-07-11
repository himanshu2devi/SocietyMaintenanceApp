import { Link } from 'react-router-dom'
import { Brand } from './Brand'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Practical digital operations for housing societies in Indian. Built for clearer communication, collections and accountability.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-700">Made for Indian societies with love ❤️</p>
        </div>
        <FooterColumn title="Product" links={[['Features', '/#features'], ['For committees', '/#committees'], ['Sign in', '/login'], ['Create society', '/register']]} />
        <FooterColumn title="Company" links={[['About SocietyWale', '/about'], ['Contact us', '/contact']]} />
        <FooterColumn title="Support" links={[['Contact support', '/contact'], ['Member login', '/login']]} />
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} SocietyWale. All rights reserved.</span>
          <span>Society operations, made simpler.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link className="text-sm text-slate-500 transition hover:text-orange-600" to={to}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
