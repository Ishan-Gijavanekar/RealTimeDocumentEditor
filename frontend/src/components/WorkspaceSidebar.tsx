import { FilePlus2, FolderPlus, LogOut, Plus, Search } from 'lucide-react'
import type { DocumentNode, User, Workspace } from '../types'

type Props = {
  user: User
  workspaces: Workspace[]
  activeWorkspaceId: string
  documents: DocumentNode[]
  query: string
  activeDocumentId: string
  onQueryChange: (query: string) => void
  onWorkspaceChange: (workspaceId: string) => void
  onCreateWorkspace: () => void
  onCreateNode: (type: 'document' | 'folder', parentId?: string | null) => void
  onSelectDocument: (documentId: string) => void
  onLogout: () => void
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function WorkspaceSidebar(props: Props) {
  const visibleDocuments = props.query.trim()
    ? props.documents.filter((document) => `${document.title} ${stripHtml(document.contentHtml)}`.toLowerCase().includes(props.query.toLowerCase()))
    : props.documents
  const folders = visibleDocuments.filter((document) => document.type === 'folder')
  const looseDocuments = visibleDocuments.filter((document) => document.type === 'document' && !document.parentId)

  return <aside className="sidebar">
    <div className="brand-row"><div className="brand-mark">RT</div><div><strong>{props.user.displayName}</strong><span>{props.user.email}</span></div></div>
    <select className="workspace-select" value={props.activeWorkspaceId} onChange={(event) => props.onWorkspaceChange(event.target.value)}>
      {props.workspaces.map((workspace) => <option value={workspace._id} key={workspace._id}>{workspace.name}</option>)}
    </select>
    <div className="sidebar-actions"><button onClick={props.onCreateWorkspace}><Plus size={16} />Workspace</button><button onClick={props.onLogout}><LogOut size={16} />Logout</button></div>
    <label className="search-box"><Search size={16} /><input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="Search docs" /></label>
    <div className="sidebar-actions"><button onClick={() => props.onCreateNode('document')}><FilePlus2 size={16} />Doc</button><button onClick={() => props.onCreateNode('folder')}><FolderPlus size={16} />Folder</button></div>
    <nav className="document-tree">
      {folders.map((folder) => <section key={folder._id}><button className="folder" onClick={() => props.onCreateNode('document', folder._id)}>{folder.title}<FilePlus2 size={14} /></button>{visibleDocuments.filter((document) => document.parentId === folder._id).map((document) => <button key={document._id} className={document._id === props.activeDocumentId ? 'doc active' : 'doc'} onClick={() => props.onSelectDocument(document._id)}>{document.title}</button>)}</section>)}
      {looseDocuments.map((document) => <button key={document._id} className={document._id === props.activeDocumentId ? 'doc active' : 'doc'} onClick={() => props.onSelectDocument(document._id)}>{document.title}</button>)}
    </nav>
  </aside>
}