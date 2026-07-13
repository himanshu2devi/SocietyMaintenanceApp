import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://societywale.in'
const DEFAULT_TITLE = 'SocietyWale — Society Management Software for Indian Housing Societies'
const DEFAULT_DESC =
  'SocietyWale is society management software for Indian housing societies and RWAs. Track maintenance, members, notices, expenses, complaints and audit-ready reports in one secure workspace.'

const PAGE_SEO = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  '/#faq': {
    title: 'SocietyWale FAQs — Society Management Software India',
    description:
      'Common questions about SocietyWale for Indian housing societies: getting started, members, maintenance, complaints and support.',
  },
  '/about': {
    title: 'About SocietyWale — Built for Indian Housing Societies',
    description:
      'Learn how SocietyWale helps managing committees run maintenance, members, notices, expenses and complaints with clear, audit-friendly records.',
  },
  '/contact': {
    title: 'Contact SocietyWale — Talk to Our Team in India',
    description:
      'Contact SocietyWale for demos, onboarding and committee support. Email societywale.in@gmail.com or call +91 97300 96390 / +91 72187 79953.',
  },
  '/terms': {
    title: 'Terms of Use — SocietyWale',
    description: 'Terms of use for SocietyWale society management software used by Indian housing societies and RWAs.',
  },
  '/privacy': {
    title: 'Privacy Policy — SocietyWale',
    description:
      'Privacy policy for SocietyWale. How we process society and resident data as a service provider under Indian data protection expectations.',
  },
  '/login': {
    title: 'Sign in — SocietyWale',
    description: 'Sign in to your SocietyWale society workspace.',
  },
  '/register': {
    title: 'Create Society Workspace — SocietyWale',
    description: 'Register your housing society on SocietyWale and start managing maintenance, members and records.',
  },
  '/register-member': {
    title: 'Member Signup — SocietyWale',
    description: 'Join your housing society workspace on SocietyWale using your society code.',
  },
  '/profile': {
    title: 'My Profile — SocietyWale',
    description: 'View your SocietyWale profile and society workspace details.',
  },
}

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Sets document title and core meta tags per route for SEO. */
export default function SeoManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const conf = PAGE_SEO[pathname] || {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
    }
    const canonical = `${SITE}${pathname === '/' ? '/' : pathname}`

    document.title = conf.title
    upsertMeta('name', 'description', conf.description)
    upsertMeta('property', 'og:title', conf.title)
    upsertMeta('property', 'og:description', conf.description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('name', 'twitter:title', conf.title)
    upsertMeta('name', 'twitter:description', conf.description)
    upsertLink('canonical', canonical)
  }, [pathname])

  return null
}
