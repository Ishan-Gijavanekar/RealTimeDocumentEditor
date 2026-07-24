import type { DocumentNode } from '../types'

type Props = {
  open: boolean
  node?: DocumentNode
  onClose: () => void
  onConfirm: () => void
}

export function DeleteNodeDialog({ open, node, onClose, onConfirm }: Props) {
  if (!open || !node) return null

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-node-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><h2 id="delete-node-dialog-title">Delete {node.type}</h2><button onClick={onClose}>Close</button></header>
      <p>Delete <strong>{node.title}</strong>? {node.type === 'folder' ? 'All nested folders and documents will also be removed from the tree.' : 'This document will be removed from the tree.'}</p>
      <footer>
        <button onClick={onClose}>Cancel</button>
        <button className="danger" onClick={onConfirm}>Delete</button>
      </footer>
    </section>
  </div>
}
