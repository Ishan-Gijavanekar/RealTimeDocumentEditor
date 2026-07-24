import { useEffect, useMemo, useState } from 'react'

type NodeType = 'document' | 'folder'

type Props = {
  open: boolean
  type: NodeType
  parentName?: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function NodeDialog({ open, type, parentName, onClose, onSubmit }: Props) {
  const defaultName = useMemo(() => type === 'folder' ? 'New Folder' : 'Untitled Document', [type])
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    const timer = window.setTimeout(() => setName(defaultName), 0)
    return () => window.clearTimeout(timer)
  }, [defaultName, open])

  if (!open) return null

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="node-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id="node-dialog-title">Create {type === 'folder' ? 'folder' : 'document'}</h2><button onClick={onClose}>Close</button></header>
      {parentName && <p className="dialog-context">Inside <strong>{parentName}</strong></p>}
      <label>{type === 'folder' ? 'Folder name' : 'Document name'}<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={defaultName} /></label>
      <footer>
        <button onClick={onClose}>Cancel</button>
        <button className="primary" onClick={() => onSubmit(name.trim())} disabled={name.trim().length < 1}>Create</button>
      </footer>
    </section>
  </div>
}