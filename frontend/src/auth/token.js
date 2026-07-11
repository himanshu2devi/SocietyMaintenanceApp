export const TOKEN_KEY = 'society_token'
export const USER_KEY = 'society_user'

/**
 * Per-tab session store so admin and member can stay signed in in different tabs
 * (or windows) at the same time. Concurrent users on different devices are already
 * independent via JWT; this only fixes shared-browser testing and multi-role use.
 * Legacy localStorage keys are migrated once, then cleared.
 */
function readStore(key) {
  const fromSession = sessionStorage.getItem(key)
  if (fromSession != null) return fromSession
  const legacy = localStorage.getItem(key)
  if (legacy != null) {
    sessionStorage.setItem(key, legacy)
    localStorage.removeItem(key)
    return legacy
  }
  return null
}

function writeStore(key, value) {
  sessionStorage.setItem(key, value)
  localStorage.removeItem(key)
}

function removeStore(key) {
  sessionStorage.removeItem(key)
  localStorage.removeItem(key)
}

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
  const token = readStore(TOKEN_KEY)
  if (isTokenValid(token)) return token
  clearSession()
  return null
}

export function getStoredUser() {
  const raw = readStore(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    removeStore(USER_KEY)
    return null
  }
}

export function setSession(token, user) {
  writeStore(TOKEN_KEY, token)
  writeStore(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  removeStore(TOKEN_KEY)
  removeStore(USER_KEY)
}
