export const DEMO_USER_ID = '000000000000000000000001'
export const roleValues = ['viewer', 'commenter', 'editor', 'manager', 'owner'] as const
export type DocumentRole = (typeof roleValues)[number]
export type DocumentAction = 'read' | 'comment' | 'edit' | 'share' | 'manage'

export const roleCapabilities: Record<DocumentRole, DocumentAction[]> = {
  viewer: ['read'],
  commenter: ['read', 'comment'],
  editor: ['read', 'comment', 'edit'],
  manager: ['read', 'comment', 'edit', 'share', 'manage'],
  owner: ['read', 'comment', 'edit', 'share', 'manage'],
}