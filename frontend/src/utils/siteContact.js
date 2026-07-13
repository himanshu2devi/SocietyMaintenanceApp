/** Public SocietyWale contact details shown on marketing pages. */
export const SITE_EMAIL = 'societywale.in@gmail.com'
export const SITE_PHONES = [
  { label: '97300 96390', digits: '9730096390' },
  { label: '72187 79953', digits: '7218779953' },
]

export function mailtoHref(subject, body) {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const qs = params.toString().replace(/\+/g, '%20')
  return `mailto:${SITE_EMAIL}${qs ? `?${qs}` : ''}`
}

export function telHref(digits) {
  return `tel:+91${digits}`
}

export function whatsappHref(digits, text) {
  const encoded = encodeURIComponent(text || '')
  return `https://wa.me/91${digits}${encoded ? `?text=${encoded}` : ''}`
}
