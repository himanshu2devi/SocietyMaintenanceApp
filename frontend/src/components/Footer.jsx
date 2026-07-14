import { Link } from 'react-router-dom'
import { Brand } from './Brand'
import { SITE_EMAIL, SITE_PHONES, mailtoHref, telHref } from '../utils/siteContact'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white" role="contentinfo">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Society management software for Indian housing societies. Maintenance, members, notices, expenses, complaints, audit-ready records and more in one place.
          </p>
          <address className="mt-5 not-italic space-y-1.5 text-sm text-slate-600">
            <a className="block font-semibold text-slate-800 transition hover:text-orange-600" href={mailtoHref()}>
              {SITE_EMAIL}
            </a>
            {SITE_PHONES.map((phone) => (
              <a
                key={phone.digits}
                className="block transition hover:text-orange-600"
                href={telHref(phone.digits)}
              >
                +91 {phone.label}
              </a>
            ))}
          </address>
          <p className="mt-5 text-sm font-semibold text-slate-700">Made for Indian societies with❤</p>
        </div>
        <FooterColumn
          title="Product"
          links={[
            ['Features', '/#features'],
            ['FAQs', '/#faq'],
            // ['For committees', '/#committees'],
            // ['Trust & security', '/#trust'],
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            ['About us', '/about'],
            ['Contact', '/contact'],
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            ['Terms & Conditions', '/terms'],
            ['Privacy policy', '/privacy'],
            ['Refund & Cancellation Policy', '/refund-policy'],
          ]}
        />
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} SocietyWale. All rights reserved.</p>
          <p>Serving housing societies &amp; RWAs across India · societywale.in</p>
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
