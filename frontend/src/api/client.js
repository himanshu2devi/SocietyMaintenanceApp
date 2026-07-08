import axios from 'axios'

const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:8081'
const CORE_URL = import.meta.env.VITE_CORE_URL || 'http://localhost:8082'

export const TOKEN_KEY = 'society_token'

// Two axios instances, one per microservice.
export const identityApi = axios.create({ baseURL: `${IDENTITY_URL}/api/v1` })
export const coreApi = axios.create({ baseURL: `${CORE_URL}/api/v1` })

// Attach JWT to every request from a single source of truth.
function attachToken(config) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

identityApi.interceptors.request.use(attachToken)
coreApi.interceptors.request.use(attachToken)

// Global 401 handling: clear session and bounce to login.
function handle401(error) {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }
  return Promise.reject(error)
}

identityApi.interceptors.response.use((r) => r, handle401)
coreApi.interceptors.response.use((r) => r, handle401)
