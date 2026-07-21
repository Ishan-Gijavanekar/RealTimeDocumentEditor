import { createContext } from 'react'
import type { User } from '../types'

export type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (input: { email: string; password: string }) => Promise<void>
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)