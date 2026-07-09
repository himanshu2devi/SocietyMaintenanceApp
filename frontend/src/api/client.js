import axios from 'axios'

// API base URLs include /api/v1 (see .env.example)
const IDENTITY_URL =
  import.meta.env.VITE_IDENTITY_URL || 'http://localhost:8081/api/v1'
const CORE_URL =
  import.meta.env.VITE_CORE_URL || 'http://localhost:8082/api/v1'

export const TOKEN_KEY = 'society_token'

export const identityApi = axios.create({ baseURL: IDENTITY_URL })
export const coreApi = axios.create({ baseURL: CORE_URL })

function attachToken(config) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

identityApi.interceptors.request.use(attachToken)
coreApi.interceptors.request.use(attachToken)

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
