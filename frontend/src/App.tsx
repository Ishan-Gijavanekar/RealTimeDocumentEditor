import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import {
  Archive,
  Bold,
  CheckCircle2,
  Copy,
  FilePlus2,
  FolderPlus,
  History,
  Italic,
  Link,
  List,
  MessageSquarePlus,
  PanelRight,
  Redo2,
  Search,
  Share2,
  Trash2,
  Underline,
  Undo2,
  Users,
} from 'lucide-react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const DEMO_USER_ID = '000000000000000000000001'

type Workspace = { _id: string; name: string }
type DocumentNode = {
  _id: string
  workspaceId: string
  parentId?: string | null
  type: 'document' | 'folder'
  title: string
  contentHtml: string
  status: 'active' | 'archived' | 'deleted'
  updateCount: number
  updatedAt: string
}
type CommentThread = { _id: string; body: string; quotedText?: string; status: 'open' | 'resolved'; replies: { body: string; createdAt: string }[]; createdAt: string }
type VersionRecord = { _id: string; label: string; title: string; updateCount: number; createdAt: string }
type PresenceUser = { userId: string; displayName: string; color: string; cursorLabel?: string; status?: 'active' | 'idle'; lastActivityAt?: string }
type SaveState = 'idle' | 'saving' | 'saved' | 'offline'
type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code: string; message: string; details?: unknown } }

function isApiEnvelope<T>(payload: ApiEnvelope<T> | T | null): payload is ApiEnvelope<T> {
  return typeof payload === 'object' && payload !== null && 'success' in payload
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': DEMO_USER_ID,
      'x-user-name': 'Demo Collaborator',
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | T | null

  if (!response.ok) {
    const message = isApiEnvelope(payload) && payload.error ? `${payload.error.code}: ${payload.error.message}` : 'Request failed'
    throw new Error(message)
  }

  if (isApiEnvelope(payload)) return payload.data as T
  return payload as T
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function offlineKey(documentId: string) {
  return `rtdoc:offline:${documentId}`
}

function App() {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [documents, setDocuments] = useState<DocumentNode[]>([])
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
  const workspace = workspaces[0]

  const visibleDocuments = useMemo(() => {
    if (!query.trim()) return documents
    const needle = query.toLowerCase()
    return documents.filter((document) => `${document.title} ${stripHtml(document.contentHtml)}`.toLowerCase().includes(needle))
  }, [documents, query])

  const folders = visibleDocuments.filter((document) => document.type === 'folder')
  const looseDocuments = visibleDocuments.filter((document) => document.type === 'document' && !document.parentId)

  function showApiError(error: unknown) {
    setApiError(error instanceof Error ? error.message : 'Unexpected API error')
  }

  function clearApiError() {
    setApiError('')
  }

  async function runAction(action: () => Promise<void>) {
    try {
      clearApiError()
      await action()
    } catch (error) {
      showApiError(error)
    }
  }

  const loadTree = useCallback(async (workspaceId: string) => {
    const { documents: loaded } = await request<{ documents: DocumentNode[] }>(`/api/workspaces/${workspaceId}/tree`)
    setDocuments(loaded)
    setActiveDocumentId((current) => current || loaded.find((document) => document.type === 'document')?._id || '')
  }, [])

  const loadDocument = useCallback(async (documentId: string) => {
    const [{ document }, { comments }, { versions }] = await Promise.all([
      request<{ document: DocumentNode }>(`/api/documents/${documentId}`),
      request<{ comments: CommentThread[] }>(`/api/documents/${documentId}/comments`),
      request<{ versions: VersionRecord[] }>(`/api/documents/${documentId}/versions`),
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
    request<{ workspaces: Workspace[] }>('/api/workspaces')
      .then(({ workspaces }) => {
        clearApiError()
        setWorkspaces(workspaces)
        if (workspaces[0]) void loadTree(workspaces[0]._id).catch(showApiError)
      })
      .catch((error) => {
        showApiError(error)
        setSaveState('offline')
      })
  }, [loadTree])

  useEffect(() => {
    if (!activeDocumentId) return
    const timer = window.setTimeout(() => { void loadDocument(activeDocumentId).catch(showApiError) }, 0)
    return () => window.clearTimeout(timer)
  }, [activeDocumentId, loadDocument])

  useEffect(() => {
    if (!activeDocumentId) return
    const socket = io(API_URL, { transports: ['websocket'] })
    socketRef.current = socket
    socket.emit('document:join', { documentId: activeDocumentId, userId: DEMO_USER_ID, displayName: 'Demo Collaborator', color: '#2563eb' })
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
    socket.on('presence:left', (user: PresenceUser) => setPresence((current) => {
      const next = { ...current }
      delete next[user.userId]
      return next
    }))
    socket.on('collaboration:error', (error: { message: string }) => showApiError(error.message))
    return () => { socket.disconnect(); socketRef.current = null; setPresence({}) }
  }, [activeDocumentId])

  const persistDocument = useCallback(async () => {
    if (!activeDocument || !editorRef.current) return
    const contentHtml = editorRef.current.innerHTML
    const localUpdateId = crypto.randomUUID()
    setSaveState('saving')
    try {
      socketRef.current?.emit('document:update', { documentId: activeDocument._id, contentHtml, title, localUpdateId })
      await request<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}`, { method: 'PATCH', body: JSON.stringify({ title, contentHtml }) })
      localStorage.removeItem(offlineKey(activeDocument._id))
      setSaveState('saved')
      clearApiError()
      if (workspace) void loadTree(workspace._id).catch(showApiError)
    } catch (error) {
      localStorage.setItem(offlineKey(activeDocument._id), contentHtml)
      setSaveState('offline')
      showApiError(error)
    }
  }, [activeDocument, loadTree, title, workspace])

  useEffect(() => {
    if (!activeDocument) return
    const timer = window.setTimeout(() => { void persistDocument() }, 900)
    return () => window.clearTimeout(timer)
  }, [title, activeDocument, persistDocument])

  function applyCommand(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    void persistDocument()
  }

  async function createNode(type: 'document' | 'folder', parentId?: string | null) {
    if (!workspace) return
    const label = type === 'folder' ? 'New Folder' : 'Untitled Document'
    const { document } = await request<{ document: DocumentNode }>('/api/documents', { method: 'POST', body: JSON.stringify({ workspaceId: workspace._id, parentId, type, title: label }) })
    await loadTree(workspace._id)
    if (document.type === 'document') setActiveDocumentId(document._id)
  }

  async function duplicateDocument() {
    if (!activeDocument || !workspace) return
    const { document } = await request<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}/duplicate`, { method: 'POST' })
    await loadTree(workspace._id)
    setActiveDocumentId(document._id)
  }

  async function updateStatus(status: 'archived' | 'deleted') {
    if (!activeDocument || !workspace) return
    await request(`/api/documents/${activeDocument._id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    await loadTree(workspace._id)
    setActiveDocumentId(documents.find((document) => document._id !== activeDocument._id && document.type === 'document')?._id || '')
  }

  async function addComment() {
    if (!activeDocument || !commentDraft.trim()) return
    const selection = window.getSelection()?.toString()
    const { comment } = await request<{ comment: CommentThread }>(`/api/documents/${activeDocument._id}/comments`, { method: 'POST', body: JSON.stringify({ body: commentDraft, quotedText: selection }) })
    setComments((current) => [comment, ...current])
    setCommentDraft('')
  }

  async function saveVersion() {
    if (!activeDocument || !versionLabel.trim()) return
    await persistDocument()
    const { version } = await request<{ version: VersionRecord }>(`/api/documents/${activeDocument._id}/versions`, { method: 'POST', body: JSON.stringify({ label: versionLabel }) })
    setVersions((current) => [version, ...current])
  }

  async function restoreVersion(versionId: string) {
    if (!activeDocument) return
    const { document } = await request<{ document: DocumentNode }>(`/api/documents/${activeDocument._id}/restore`, { method: 'POST', body: JSON.stringify({ versionId }) })
    setActiveDocument(document)
    setTitle(document.title)
    if (editorRef.current) editorRef.current.innerHTML = document.contentHtml
    await loadDocument(document._id)
  }

  async function createShareLink() {
    if (!activeDocument) return
    const { shareLink } = await request<{ shareLink: { token: string } }>(`/api/documents/${activeDocument._id}/share-links`, { method: 'POST', body: JSON.stringify({ role: 'editor' }) })
    setShareUrl(`${location.origin}/share/${shareLink.token}`)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark">RT</div><div><strong>{workspace?.name ?? 'Workspace'}</strong><span>MERN TypeScript</span></div></div>
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search docs" /></label>
        <div className="sidebar-actions"><button onClick={() => void runAction(() => createNode('document'))}><FilePlus2 size={16} />Doc</button><button onClick={() => void runAction(() => createNode('folder'))}><FolderPlus size={16} />Folder</button></div>
        <nav className="document-tree">
          {folders.map((folder) => <section key={folder._id}><button className="folder" onClick={() => void runAction(() => createNode('document', folder._id))}>{folder.title}<FilePlus2 size={14} /></button>{visibleDocuments.filter((document) => document.parentId === folder._id).map((document) => <button key={document._id} className={document._id === activeDocumentId ? 'doc active' : 'doc'} onClick={() => setActiveDocumentId(document._id)}>{document.title}</button>)}</section>)}
          {looseDocuments.map((document) => <button key={document._id} className={document._id === activeDocumentId ? 'doc active' : 'doc'} onClick={() => setActiveDocumentId(document._id)}>{document.title}</button>)}
        </nav>
      </aside>

      <section className="editor-stage">
        {apiError && <div className="api-error" role="alert"><strong>API error</strong><span>{apiError}</span><button onClick={() => setApiError('')}>Dismiss</button></div>}
        <header className="topbar">
          <div className="presence"><Users size={17} />{Object.values(presence).length ? Object.values(presence).map((user) => <span key={user.userId} style={{ borderColor: user.color }}>{user.displayName.slice(0, 2).toUpperCase()}</span>) : <small>Solo editing</small>}</div>
          <div className={`save-state ${saveState}`}>{saveState === 'offline' ? 'Offline draft saved locally' : saveState === 'saving' ? 'Saving...' : 'Saved'}</div>
          <button title="Share" onClick={() => void runAction(createShareLink)}><Share2 size={17} /></button>
          <button title="Duplicate" onClick={() => void runAction(duplicateDocument)}><Copy size={17} /></button>
          <button title="Archive" onClick={() => void runAction(() => updateStatus('archived'))}><Archive size={17} /></button>
          <button title="Delete" onClick={() => void runAction(() => updateStatus('deleted'))}><Trash2 size={17} /></button>
        </header>

        <div className="toolbar" aria-label="Formatting toolbar">
          <button title="Undo" onClick={() => applyCommand('undo')}><Undo2 size={16} /></button><button title="Redo" onClick={() => applyCommand('redo')}><Redo2 size={16} /></button>
          <button title="Bold" onClick={() => applyCommand('bold')}><Bold size={16} /></button><button title="Italic" onClick={() => applyCommand('italic')}><Italic size={16} /></button><button title="Underline" onClick={() => applyCommand('underline')}><Underline size={16} /></button>
          <button title="Heading" onClick={() => applyCommand('formatBlock', 'h2')}>H2</button><button title="Paragraph" onClick={() => applyCommand('formatBlock', 'p')}>P</button><button title="Checklist" onClick={() => applyCommand('insertHTML', '<label><input type="checkbox"> Task</label><br>')}>Check</button>
          <button title="Bullet list" onClick={() => applyCommand('insertUnorderedList')}><List size={16} /></button><button title="Link" onClick={() => applyCommand('createLink', prompt('URL') ?? '')}><Link size={16} /></button>
        </div>

        <article className="document-canvas">
          <input className="title-input" value={title} onChange={(event) => { setTitle(event.target.value); setSaveState('saving') }} placeholder="Untitled" />
          <div ref={editorRef} className="rich-editor" contentEditable suppressContentEditableWarning onInput={() => { setSaveState('saving'); socketRef.current?.emit('presence:update', { documentId: activeDocumentId, cursorLabel: title, status: 'active' }); void persistDocument() }} />
        </article>
      </section>

      <aside className="inspector">
        <div className="panel-tabs"><button className={sidePanel === 'comments' ? 'active' : ''} onClick={() => setSidePanel('comments')}><MessageSquarePlus size={16} />Comments</button><button className={sidePanel === 'versions' ? 'active' : ''} onClick={() => setSidePanel('versions')}><History size={16} />Versions</button></div>
        {shareUrl && <p className="share-result">{shareUrl}</p>}
        {sidePanel === 'comments' ? <section className="panel-body"><textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Comment or @mention by user id" /><button className="primary" onClick={() => void runAction(addComment)}><MessageSquarePlus size={16} />Add comment</button>{comments.map((comment) => <div className="thread" key={comment._id}><p>{comment.body}</p>{comment.quotedText && <blockquote>{comment.quotedText}</blockquote>}<small>{comment.status}</small><button onClick={() => void runAction(async () => { await request(`/api/comments/${comment._id}`, { method: 'PATCH', body: JSON.stringify({ status: comment.status === 'open' ? 'resolved' : 'open' }) }) })}><CheckCircle2 size={15} />Toggle</button></div>)}</section> : <section className="panel-body"><input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} /><button className="primary" onClick={() => void runAction(saveVersion)}><History size={16} />Save version</button>{versions.map((version) => <div className="thread" key={version._id}><p>{version.label}</p><small>{new Date(version.createdAt).toLocaleString()} update {version.updateCount}</small><button onClick={() => void runAction(() => restoreVersion(version._id))}><PanelRight size={15} />Restore</button></div>)}</section>}
      </aside>
    </main>
  )
}

export default App
