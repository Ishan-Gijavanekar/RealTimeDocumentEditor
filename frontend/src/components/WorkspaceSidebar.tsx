import { ChevronDown, ChevronRight, Edit3, FilePlus2, FileText, Folder, FolderOpen, FolderPlus, LogOut, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  onEditWorkspace: () => void
  onDeleteWorkspace: () => void
  onCreateNode: (type: 'document' | 'folder', parentId?: string | null) => void
  onDeleteNode: (node: DocumentNode) => void
  onSelectDocument: (documentId: string) => void
  onLogout: () => void
}

type TreeNode = DocumentNode & { children: TreeNode[] }

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildTree(documents: DocumentNode[]) {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  documents.forEach((document) => nodeMap.set(document._id, { ...document, children: [] }))
  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) nodeMap.get(node.parentId)?.children.push(node)
    else roots.push(node)
  })

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    nodes.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
  return roots
}

export function WorkspaceSidebar(props: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const visibleDocuments = props.query.trim()
    ? props.documents.filter((document) => `${document.title} ${stripHtml(document.contentHtml)}`.toLowerCase().includes(props.query.toLowerCase()) || document.type === 'folder')
    : props.documents
  const tree = useMemo(() => buildTree(visibleDocuments), [visibleDocuments])

  function toggleFolder(folderId: string) {
    setExpanded((current) => ({ ...current, [folderId]: current[folderId] === false }))
  }

  function renderNode(node: TreeNode, depth: number) {
    const isFolder = node.type === 'folder'
    const isOpen = expanded[node._id] !== false
    const hasChildren = node.children.length > 0
    const paddingLeft = 10 + depth * 16

    if (isFolder) {
      return <div className="tree-node" key={node._id}>
        <div className="tree-row folder-row" style={{ paddingLeft }}>
          <button className="tree-icon-button" title={isOpen ? 'Collapse folder' : 'Expand folder'} onClick={() => toggleFolder(node._id)}>{hasChildren ? isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} /> : <span className="tree-spacer" />}</button>
          <button className="tree-label folder-label" onClick={() => toggleFolder(node._id)}>{isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}<span>{node.title}</span></button>
          <div className="tree-actions">
            <button className="tree-action" title="New document in folder" onClick={() => props.onCreateNode('document', node._id)}><FilePlus2 size={14} /></button>
            <button className="tree-action" title="New folder inside folder" onClick={() => props.onCreateNode('folder', node._id)}><FolderPlus size={14} /></button>
            <button className="tree-action danger-action" title="Delete folder" onClick={() => props.onDeleteNode(node)}><Trash2 size={14} /></button>
          </div>
        </div>
        {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    }

    return <div key={node._id} className={node._id === props.activeDocumentId ? 'tree-row file-row active' : 'tree-row file-row'} style={{ paddingLeft }}>
      <button className="tree-label file-label" onClick={() => props.onSelectDocument(node._id)}><span className="tree-indent-spacer" /><FileText size={15} /><span>{node.title}</span></button>
      <button className="tree-action danger-action" title="Delete document" onClick={() => props.onDeleteNode(node)}><Trash2 size={14} /></button>
    </div>
  }

  return <aside className="sidebar">
    <div className="brand-row"><div className="brand-mark">RT</div><div><strong>{props.user.displayName}</strong><span>{props.user.email}</span></div></div>
    <select className="workspace-select" value={props.activeWorkspaceId} onChange={(event) => props.onWorkspaceChange(event.target.value)}>
      {props.workspaces.map((workspace) => <option value={workspace._id} key={workspace._id}>{workspace.name}</option>)}
    </select>
    <div className="sidebar-actions workspace-actions"><button title="Create workspace" onClick={props.onCreateWorkspace}><Plus size={16} />New</button><button title="Edit workspace" onClick={props.onEditWorkspace} disabled={!props.activeWorkspaceId}><Edit3 size={16} />Edit</button><button title="Delete workspace" onClick={props.onDeleteWorkspace} disabled={!props.activeWorkspaceId}><Trash2 size={16} />Delete</button></div>
    <button className="logout-button" onClick={props.onLogout}><LogOut size={16} />Logout</button>
    <label className="search-box"><Search size={16} /><input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="Search docs" /></label>
    <div className="sidebar-actions"><button onClick={() => props.onCreateNode('document')}><FilePlus2 size={16} />Doc</button><button onClick={() => props.onCreateNode('folder')}><FolderPlus size={16} />Folder</button></div>
    <nav className="document-tree ide-tree" aria-label="Workspace files">
      {tree.length ? tree.map((node) => renderNode(node, 0)) : <p className="empty-tree">No documents yet</p>}
    </nav>
  </aside>
}
