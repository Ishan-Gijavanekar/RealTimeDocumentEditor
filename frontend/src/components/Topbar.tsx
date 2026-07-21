import { Archive, Copy, Share2, Trash2, Users } from 'lucide-react'
import type { PresenceUser, SaveState } from '../types'

export function Topbar({ presence, saveState, onShare, onDuplicate, onArchive, onDelete }: { presence: PresenceUser[]; saveState: SaveState; onShare: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void }) {
  return <header className="topbar">
    <div className="presence"><Users size={17} />{presence.length ? presence.map((user) => <span key={user.userId} style={{ borderColor: user.color }}>{user.displayName.slice(0, 2).toUpperCase()}</span>) : <small>Solo editing</small>}</div>
    <div className={`save-state ${saveState}`}>{saveState === 'offline' ? 'Offline draft saved locally' : saveState === 'saving' ? 'Saving...' : 'Saved'}</div>
    <button title="Share" onClick={onShare}><Share2 size={17} /></button>
    <button title="Duplicate" onClick={onDuplicate}><Copy size={17} /></button>
    <button title="Archive" onClick={onArchive}><Archive size={17} /></button>
    <button title="Delete" onClick={onDelete}><Trash2 size={17} /></button>
  </header>
}