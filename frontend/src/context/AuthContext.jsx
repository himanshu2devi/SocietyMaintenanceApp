import { createContext, useContext, useMemo, useState } from 'react'
import { identityApi } from '../api/client'
import { clearSession, getStoredUser, getValidToken, setSession } from '../auth/token'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!getValidToken()) return null
    return getStoredUser()
  })
  const [loading, setLoading] = useState(false)

  function persistSession(data) {
    setSession(data.token, data.user)
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

  async function registerMember(payload) {
    setLoading(true)
    try {
      const { data } = await identityApi.post('/auth/register-member', payload)
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
      registerMember,
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
