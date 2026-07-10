import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { identityApi, TOKEN_KEY } from '../api/client'
import { clearSession, getValidToken, USER_KEY } from '../auth/token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!getValidToken()) return null
    const raw = localStorage.getItem(USER_KEY)
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      clearSession()
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }, [user])

  function persistSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  async function login(email, password) {
    setLoading(true)
    try {
      const { data } = await identityApi.post('/auth/login', { email, password })
      persistSession(data)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  async function registerSociety(payload) {
    setLoading(true)
    try {
      const { data } = await identityApi.post('/auth/register', payload)
      persistSession(data)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user && !!getValidToken(),
      isAdmin: user?.role === 'ADMIN',
      login,
      registerSociety,
      logout,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
