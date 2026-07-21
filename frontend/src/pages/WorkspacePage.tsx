import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { apiRequest, getApiUrl } from '../api/client'
import { ApiError } from '../components/ApiError'
import { DocumentEditor } from '../components/DocumentEditor'
import { EditorToolbar } from '../components/EditorToolbar'
import { Inspector } from '../components/Inspector'
import { Topbar } from '../components/Topbar'
import { WorkspaceSidebar } from '../components/WorkspaceSidebar'
import { useAuth } from '../context/useAuth'
import type { CommentThread, DocumentNode, PresenceUser, SaveState, VersionRecord, Workspace } from '../types'

function offlineKey(documentId: string) {
  return `rtdoc:offline:${documentId}`
}

export function WorkspacePage() {
  const { user, token, logout, loading } = useAuth()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [documents, setDocuments] = useState<DocumentNode[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('')
  const [activeDocumentId, setActiveDocumentId] = useState('')
  const [activeDocument, setActiveDocument] = useState<DocumentNode | null>(null)
  const [title, setTitle] = useState('')
  const [comments, setComments] = useState<CommentThread[]>([])
  const [versions, setVersions] = useState<VersionRecord[]>([])
  const [presence, setPresence] = useState<Record<string, PresenceUser>>({})
  const [query, setQuery] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [versionLabel, setVersionLabel] = useState('Milestone snapshot')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [apiError, setApiError] = useState('')
  const [sidePanel, setSidePanel] = useState<'comments' | 'versions'>('comments')

  const runAction = useCallback(async (action: () => Promise<void>) => {
    try { setApiError(''); await action() } catch (error) { setApiError(error instanceof Error ? error.message : 'Unexpected API error') }
  }, [])

  const loadTree = useCallback(async (workspaceId: string) => {
    const { documents } = await apiRequest<{ documents: DocumentNode[] }>(`/api/workspaces/${workspaceId}/tree`)
    setDocuments(documents)
    setActiveDocumentId((current) => documents.some((document) => document._id === current) ? current : documents.find((document) => document.type === 'document')?._id || '')
  }, [])

  const loadDocument = useCallback(async (documentId: string) => {
    const [{ document }, { comments }, { versions }] = await Promise.all([
      apiRequest<{ document: DocumentNode }>(`/api/documents/${documentId}`),
      apiRequest<{ comments: CommentThread[] }>(`/api/documents/${documentId}/comments`),
      apiRequest<{ versions: VersionRecord[] }>(`/api/documents/${documentId}/versions`),
    ])
    const offline = localStorage.getItem(offlineKey(documentId))
    setActiveDocument(document)
    setTitle(document.title)
    setComments(comments)
    setVersions(versions)
    setShareUrl('')
    if (editorRef.current) editorRef.current.innerHTML = offline || document.contentHtml
    setSaveState(offline ? 'offline' : 'saved')
  }, [])

  useEffect(() => {
    if (!user) return
    const timer = window.setTimeout(() => {
      void runAction(async () => {
        const { workspaces } = await apiRequest<{ workspaces: Workspace[] }>('/api/workspaces')
        setWorkspaces(workspaces)
        const first = workspaces[0]?._id || ''
        setActiveWorkspaceId(first)
        if (first) await loadTree(first)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadTree, runAction, user])

  useEffect(() => {
    if (!activeWorkspaceId) return
    const timer = window.setTimeout(() => { void runAction(() => loadTree(activeWorkspaceId)) }, 0)
    return () => window.clearTimeout(timer)
  }, [activeWorkspaceId, loadTree, runAction])

  useEffect(() => {
    if (!activeDocumentId) return
    const timer = window.setTimeout(() => { void runAction(() => loadDocument(activeDocumentId)) }, 0)
    return () => window.clearTimeout(timer)
  }, [activeDocumentId, loadDocument, runAction])

  useEffect(() => {
    if (!activeDocumentId || !token) return
    const socket = io(getApiUrl(), { transports: ['websocket'], auth: { token } })
    socketRef.current = socket
    socket.emit('document:join', { documentId: activeDocumentId })
    socket.on('document:patched', ({ document }: { document: DocumentNode }) => {
      setDocuments((current) => current.map((item) => (item._id === document._id ? document : item)))
      setActiveDocument(document)
      setTitle(document.title)
      if (editorRef.current && document.contentHtml !== editorRef.current.innerHTML) editorRef.current.innerHTML = document.contentHtml
      setSaveState('saved')
    })
    socket.on('comment:created', ({ comment }: { comment: CommentThread }) => setComments((current) => [comment, ...current]))
    socket.on('comment:updated', ({ comment }: { comment: CommentThread }) => setComments((current) => current.map((item) => (item._id === comment._id ? comment : item))))
    socket.on('presence:joined', (user: PresenceUser) => setPresence((current) => ({ ...current, [user.userId]: user })))
    socket.on('presence:update', (user: PresenceUser) => setPresence((current) => ({ ...current, [user.userId]: user })))
    socket.on('presence:left', (user: PresenceUser) => setPresence((current) => { const next = { ...current }; delete next[user.userId]; return next }) )
    socket.on('connect_error', (error) => setApiError(error.message))
    socket.on('collaboration:error', (error: { message: string }) => setApiError(error.message))
    return () => { socket.disconnect(); socketRef.current = null; setPresence({}) }
  }, [activeDocumentId, token])

  const persistDocument = useCallback(async () => {
    if (!activeDocument || !editorRef.current) return
    const contentHtml = editorRef.current.innerHTML
    const localUpdateId = crypto.randomUUID()
    setSaveState('saving')
    try {
      socketRef.current?.emit('document:update', { documentId: activeDocument._id, contentHtml, title, localUpdateId })
      await apiRequest<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}`, { method: 'PATCH', body: JSON.stringify({ title, contentHtml }) })
      localStorage.removeItem(offlineKey(activeDocument._id))
      setSaveState('saved')
      if (activeWorkspaceId) void loadTree(activeWorkspaceId).catch((error) => setApiError(error.message))
    } catch (error) {
      localStorage.setItem(offlineKey(activeDocument._id), contentHtml)
      setSaveState('offline')
      setApiError(error instanceof Error ? error.message : 'Save failed')
    }
  }, [activeDocument, activeWorkspaceId, loadTree, title])

  useEffect(() => {
    if (!activeDocument) return
    const timer = window.setTimeout(() => { void persistDocument() }, 900)
    return () => window.clearTimeout(timer)
  }, [title, activeDocument, persistDocument])

  if (loading) return <main className="auth-page"><section className="auth-panel">Loading...</section></main>
  if (!user) return <Navigate to="/login" replace />

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    void persistDocument()
  }

  return <main className="app-shell">
    <WorkspaceSidebar user={user} workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} documents={documents} query={query} activeDocumentId={activeDocumentId} onQueryChange={setQuery} onWorkspaceChange={setActiveWorkspaceId} onCreateWorkspace={() => void runAction(async () => { const name = prompt('Workspace name')?.trim(); if (!name) return; const { workspace } = await apiRequest<{ workspace: Workspace }>('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) }); setWorkspaces((current) => [workspace, ...current]); setActiveWorkspaceId(workspace._id) })} onCreateNode={(type, parentId) => void runAction(async () => { if (!activeWorkspaceId) return; const label = type === 'folder' ? 'New Folder' : 'Untitled Document'; const { document } = await apiRequest<{ document: DocumentNode }>('/api/documents', { method: 'POST', body: JSON.stringify({ workspaceId: activeWorkspaceId, parentId, type, title: label }) }); await loadTree(activeWorkspaceId); if (document.type === 'document') setActiveDocumentId(document._id) })} onSelectDocument={setActiveDocumentId} onLogout={logout} />
    <section className="editor-stage">
      <ApiError message={apiError} onDismiss={() => setApiError('')} />
      <Topbar presence={Object.values(presence)} saveState={saveState} onShare={() => void runAction(async () => { if (!activeDocument) return; const { shareLink } = await apiRequest<{ shareLink: { token: string } }>(`/api/documents/${activeDocument._id}/share-links`, { method: 'POST', body: JSON.stringify({ role: 'editor' }) }); setShareUrl(`${location.origin}/share/${shareLink.token}`) })} onDuplicate={() => void runAction(async () => { if (!activeDocument || !activeWorkspaceId) return; const { document } = await apiRequest<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}/duplicate`, { method: 'POST' }); await loadTree(activeWorkspaceId); setActiveDocumentId(document._id) })} onArchive={() => void runAction(async () => { if (!activeDocument || !activeWorkspaceId) return; await apiRequest(`/api/documents/${activeDocument._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'archived' }) }); await loadTree(activeWorkspaceId) })} onDelete={() => void runAction(async () => { if (!activeDocument || !activeWorkspaceId) return; await apiRequest(`/api/documents/${activeDocument._id}`, { method: 'PATCH', body: JSON.stringify({ status: 'deleted' }) }); await loadTree(activeWorkspaceId) })} />
      <EditorToolbar onCommand={applyCommand} />
      <DocumentEditor ref={editorRef} title={title} onTitleChange={(value) => { setTitle(value); setSaveState('saving') }} onInput={() => { setSaveState('saving'); socketRef.current?.emit('presence:update', { documentId: activeDocumentId, cursorLabel: title, status: 'active' }); void persistDocument() }} />
    </section>
    <Inspector sidePanel={sidePanel} shareUrl={shareUrl} commentDraft={commentDraft} versionLabel={versionLabel} comments={comments} versions={versions} onPanelChange={setSidePanel} onCommentDraftChange={setCommentDraft} onVersionLabelChange={setVersionLabel} onAddComment={() => void runAction(async () => { if (!activeDocument || !commentDraft.trim()) return; const { comment } = await apiRequest<{ comment: CommentThread }>(`/api/documents/${activeDocument._id}/comments`, { method: 'POST', body: JSON.stringify({ body: commentDraft, quotedText: window.getSelection()?.toString() }) }); setComments((current) => [comment, ...current]); setCommentDraft('') })} onToggleComment={(comment) => void runAction(async () => { await apiRequest(`/api/comments/${comment._id}`, { method: 'PATCH', body: JSON.stringify({ status: comment.status === 'open' ? 'resolved' : 'open' }) }) })} onSaveVersion={() => void runAction(async () => { if (!activeDocument || !versionLabel.trim()) return; await persistDocument(); const { version } = await apiRequest<{ version: VersionRecord }>(`/api/documents/${activeDocument._id}/versions`, { method: 'POST', body: JSON.stringify({ label: versionLabel }) }); setVersions((current) => [version, ...current]) })} onRestoreVersion={(versionId) => void runAction(async () => { if (!activeDocument) return; const { document } = await apiRequest<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}/restore`, { method: 'POST', body: JSON.stringify({ versionId }) }); setActiveDocument(document); setTitle(document.title); if (editorRef.current) editorRef.current.innerHTML = document.contentHtml; await loadDocument(document._id) })} />
  </main>
}