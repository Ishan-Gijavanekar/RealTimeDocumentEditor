import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function LoginPage() {
  const { user, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('Password123!')
  const [displayName, setDisplayName] = useState('Demo Collaborator')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/workspaces" replace />

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'login') await login({ email, password })
      else await register({ email, password, displayName })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed')
    }
  }

  return <main className="auth-page">
    <section className="auth-panel">
      <div className="brand-row"><div className="brand-mark">RT</div><div><strong>Realtime Docs</strong><span>Multi-user workspace editor</span></div></div>
      <div className="panel-tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
      </div>
      {error && <p className="auth-error">{error}</p>}
      <form onSubmit={(event) => void submit(event)} className="auth-form">
        {mode === 'register' && <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
        <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
        <button className="primary" type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
      </form>
      <p className="auth-hint">Seed users: demo@example.com or editor@example.com with password Password123!</p>
    </section>
  </main>
}