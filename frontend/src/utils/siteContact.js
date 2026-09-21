/** Public SocietySimplify contact details shown on marketing pages. */
export const SITE_EMAIL = 'contact.societysimplify@gmail.com'

export function mailtoHref(subject, body) {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const qs = params.toString().replace(/\+/g, '%20')
  return `mailto:${SITE_EMAIL}${qs ? `?${qs}` : ''}`
}
