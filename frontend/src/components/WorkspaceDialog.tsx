import { useEffect, useState } from 'react'
import type { Workspace } from '../types'

type Mode = 'create' | 'edit' | 'delete'

type Props = {
  open: boolean
  mode: Mode
  workspace?: Workspace
  onClose: () => void
  onSubmit: (name?: string) => void
}

export function WorkspaceDialog({ open, mode, workspace, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setName(mode === 'edit' ? workspace?.name ?? '' : ''), 0)
    return () => window.clearTimeout(timer)
  }, [mode, workspace, open])

  if (!open) return null

  const title = mode === 'create' ? 'Create workspace' : mode === 'edit' ? 'Edit workspace' : 'Delete workspace'
  const action = mode === 'delete' ? 'Delete workspace' : mode === 'edit' ? 'Save changes' : 'Create workspace'

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id="workspace-dialog-title">{title}</h2><button onClick={onClose}>Close</button></header>
      {mode === 'delete'
        ? <p>Delete <strong>{workspace?.name}</strong>? Documents in this workspace will be soft-deleted.</p>
        : <label>Workspace name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Product Docs" /></label>}
      <footer>
        <button onClick={onClose}>Cancel</button>
        <button className={mode === 'delete' ? 'danger' : 'primary'} onClick={() => onSubmit(mode === 'delete' ? undefined : name.trim())} disabled={mode !== 'delete' && name.trim().length < 2}>{action}</button>
      </footer>
    </section>
  </div>
}