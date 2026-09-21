import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE = 'https://societysimplify.vercel.app'
const DEFAULT_TITLE = 'SocietySimplify — Society Management Software for Indian Housing Societies'
const DEFAULT_DESC =
  'SocietySimplify is society management software for Indian housing societies and RWAs. Track maintenance, members, notices, expenses, complaints and audit-ready reports in one secure workspace.'

const PAGE_SEO = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  '/#faq': {
    title: 'SocietySimplify FAQs — Society Management Software India',
    description:
      'Common questions about SocietySimplify for Indian housing societies: getting started, members, maintenance, complaints and support.',
  },
  '/about': {
    title: 'About SocietySimplify — Built for Indian Housing Societies',
    description:
      'Learn how SocietySimplify helps managing committees run maintenance, members, notices, expenses and complaints with clear, audit-friendly records.',
  },
  '/contact': {
    title: 'Contact SocietySimplify — Talk to Our Team in India',
    description:
      'Contact SocietySimplify for demos, onboarding and committee support. Email contact.societysimplify@gmail.com.',
  },
  '/terms': {
    title: 'Terms of Use — SocietySimplify',
    description: 'Terms of use for SocietySimplify society management software used by Indian housing societies and RWAs.',
  },
  '/privacy': {
    title: 'Privacy Policy — SocietySimplify',
    description:
      'Privacy policy for SocietySimplify. How we process society and resident data as a service provider under Indian data protection expectations.',
  },
  '/refund-policy': {
    title: 'Refund & Cancellation Policy — SocietySimplify',
    description:
      'SocietySimplify refund and cancellation policy for annual society workspace subscriptions. Fees are non-refundable after successful payment.',
  },
  '/login': {
    title: 'Sign in — SocietySimplify',
    description: 'Sign in to your SocietySimplify society workspace.',
  },
  '/register': {
    title: 'Create Society Workspace — SocietySimplify',
    description: 'Register your housing society on SocietySimplify and start managing maintenance, members and records.',
  },
  '/register-member': {
    title: 'Member Signup — SocietySimplify',
    description: 'Join your housing society workspace on SocietySimplify using your society code.',
  },
  '/profile': {
    title: 'My Profile — SocietySimplify',
    description: 'View your SocietySimplify profile and society workspace details.',
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
