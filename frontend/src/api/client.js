import axios from 'axios'
import { clearSession, getValidToken, TOKEN_KEY } from '../auth/token'

/**
 * Normalize API base URL so Vercel env mistakes like omitting /api/v1 still work.
 * Expected: https://identity.societywale.in/api/v1
 */
function apiBase(envValue, fallback) {
  let url = (envValue || fallback || '').trim().replace(/\/+$/, '')
  if (!url) return fallback
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`
  }
  return url
}

let identityCandidate = apiBase(
  import.meta.env.VITE_IDENTITY_URL,
  'http://localhost:8081/api/v1',
)
let coreCandidate = apiBase(
  import.meta.env.VITE_CORE_URL,
  'http://localhost:8082/api/v1',
)

// Guard against swapped Vercel env values (login would hit core and return
// "Authentication is required" instead of reaching /auth/login).
const identityLooksLikeCore = /\/\/core\./i.test(identityCandidate)
const coreLooksLikeIdentity = /\/\/identity\./i.test(coreCandidate)
if (identityLooksLikeCore && coreLooksLikeIdentity) {
  const swapped = identityCandidate
  identityCandidate = coreCandidate
  coreCandidate = swapped
}

const IDENTITY_URL = identityCandidate
const CORE_URL = coreCandidate

export { TOKEN_KEY }

// withCredentials supports a future secure HttpOnly-cookie session. Current
// login uses a Bearer token in per-tab sessionStorage, attached below.
export const identityApi = axios.create({ baseURL: IDENTITY_URL, withCredentials: true })
export const coreApi = axios.create({ baseURL: CORE_URL, withCredentials: true })

function attachToken(config) {
  const token = getValidToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

identityApi.interceptors.request.use(attachToken)
coreApi.interceptors.request.use(attachToken)

function handle401(error) {
  if (error.response && error.response.status === 401) {
    clearSession()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
  return Promise.reject(error)
}

identityApi.interceptors.response.use((r) => r, handle401)
coreApi.interceptors.response.use((r) => r, handle401)
