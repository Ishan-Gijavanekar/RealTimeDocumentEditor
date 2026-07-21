import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../api/client'
import { AuthContext, type AuthContextValue } from './auth-context-value'
import type { User } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState(() => localStorage.getItem('rtdoc:token'))
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return
    apiRequest<{ user: User }>('/api/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => { localStorage.removeItem('rtdoc:token'); setToken(null); setUser(null) })
      .finally(() => setLoading(false))
  }, [token])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    login: async (input) => {
      const session = await apiRequest<{ user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) })
      localStorage.setItem('rtdoc:token', session.token)
      setToken(session.token)
      setUser(session.user)
    },
    register: async (input) => {
      const session = await apiRequest<{ user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) })
      localStorage.setItem('rtdoc:token', session.token)
      setToken(session.token)
      setUser(session.user)
    },
    logout: () => {
      localStorage.removeItem('rtdoc:token')
      setToken(null)
      setUser(null)
    },
  }), [loading, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
