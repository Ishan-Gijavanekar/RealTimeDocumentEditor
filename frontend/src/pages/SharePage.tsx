import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useSnackbar } from '../context/useSnackbar'
import { useAuth } from '../context/useAuth'
import type { DocumentNode, Workspace } from '../types'

type SharePreview = {
  shareLink: { token: string; role: 'viewer' | 'commenter' | 'editor' }
  document: Pick<DocumentNode, '_id' | 'title' | 'type' | 'workspaceId' | 'status' | 'updatedAt'>
  workspace?: Pick<Workspace, '_id' | 'name' | 'slug'>
}

export function SharePage() {
  const { token = '' } = useParams()
  const { user, loading } = useAuth()
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<SharePreview | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    const timer = window.setTimeout(() => {
      apiRequest<SharePreview>(`/api/share-links/${token}`)
        .then(setPreview)
        .catch((error) => setError(error instanceof Error ? error.message : 'Unable to open share link'))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token])

  async function acceptShare() {
    if (!token) return
    setAccepting(true)
    try {
      const { document, workspace } = await apiRequest<{ document: DocumentNode; workspace: Workspace; role: string }>(`/api/share-links/${token}/accept`, { method: 'POST' })
      enqueueSnackbar('Share access added', { variant: 'success' })
      navigate(`/workspaces?workspaceId=${workspace._id}&documentId=${document._id}`, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to accept share link'
      setError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) return <main className="auth-page"><section className="auth-panel">Loading...</section></main>
  if (!token) return <Navigate to="/workspaces" replace />

  return <main className="auth-page">
    <section className="auth-panel share-panel">
      <div className="brand-row"><div className="brand-mark">RT</div><div><strong>Shared document</strong><span>{preview?.workspace?.name ?? 'Workspace access'}</span></div></div>
      {error && <p className="auth-error">{error}</p>}
      {!error && !preview && <p className="auth-hint">Checking share link...</p>}
      {preview && <div className="share-preview">
        <span className="share-role">{preview.shareLink.role}</span>
        <h1>{preview.document.title}</h1>
        <p>This link grants {preview.shareLink.role} access to this document.</p>
      </div>}
      {preview && user && <button className="primary" onClick={() => void acceptShare()} disabled={accepting}>{accepting ? 'Opening...' : 'Open shared document'}</button>}
      {preview && !user && <Link className="primary link-button" to={`/login?returnTo=${encodeURIComponent(`/share/${token}`)}`}>Login to open</Link>}
    </section>
  </main>
}

