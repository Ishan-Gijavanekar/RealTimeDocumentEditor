export type User = { id: string; email: string; displayName: string; avatarUrl?: string; colorSeed: string }
export type Workspace = { _id: string; name: string; slug: string; ownerUserId: string }
export type DocumentNode = { _id: string; workspaceId: string; parentId?: string | null; type: 'document' | 'folder'; title: string; contentHtml: string; status: 'active' | 'archived' | 'deleted'; updateCount: number; updatedAt: string }
export type CommentThread = { _id: string; body: string; quotedText?: string; status: 'open' | 'resolved'; replies: { body: string; createdAt: string }[]; createdAt: string }
export type VersionRecord = { _id: string; label: string; title: string; updateCount: number; createdAt: string }
export type PresenceUser = { userId: string; displayName: string; color: string; cursorLabel?: string; status?: 'active' | 'idle'; lastActivityAt?: string }
export type SaveState = 'idle' | 'saving' | 'saved' | 'offline'