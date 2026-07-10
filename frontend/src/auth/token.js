export const TOKEN_KEY = 'society_token'
export const USER_KEY = 'society_user'

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return JSON.parse(window.atob(padded))
}

/**
 * Client checks only token shape and expiry for UX. The Spring Security filters
 * remain the authority for signature verification and authorization.
 */
export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false
  try {
    const [, payload] = token.split('.')
    const { exp } = decodeBase64Url(payload)
    return Number.isFinite(exp) && exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function getValidToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (isTokenValid(token)) return token
  clearSession()
  return null
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
