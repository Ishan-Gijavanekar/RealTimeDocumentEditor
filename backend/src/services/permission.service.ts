import type { DocumentAction, DocumentRole } from '../constants/roles.js'
import { roleCapabilities } from '../constants/roles.js'
import type { DocumentDocument } from '../models/document.model.js'
import { Workspace } from '../models/workspace.model.js'
import { AppError } from '../utils/app-error.js'

export async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const workspace = await Workspace.findOne({ _id: workspaceId, 'members.userId': userId })
  if (!workspace) throw new AppError(403, 'WORKSPACE_ACCESS_DENIED', 'You are not a member of this workspace')
  return workspace
}

export async function assertWorkspaceOwner(workspaceId: string, userId: string) {
  const workspace = await Workspace.findById(workspaceId)
  if (!workspace) throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found')
  const member = workspace.members.find((item) => item.userId.toString() === userId)
  if (!member || (member.role !== 'workspace_owner' && workspace.ownerUserId.toString() !== userId)) {
    throw new AppError(403, 'WORKSPACE_OWNER_REQUIRED', 'Workspace owner permission is required')
  }
  return workspace
}

export async function assertDocumentAccess(document: DocumentDocument, userId: string, action: DocumentAction) {
  if (document.status === 'deleted') throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')

  const workspace = await Workspace.findById(document.workspaceId)
  const membership = workspace?.members.find((item) => item.userId.toString() === userId)

  if (document.ownerId.toString() === userId) return
  if (workspace?.ownerUserId.toString() === userId || membership?.role === 'workspace_owner') return

  const permission = document.permissions.find((item) => item.subjectId.toString() === userId)
  const role = permission?.role as DocumentRole | undefined

  if (!membership && !role) {
    throw new AppError(403, 'WORKSPACE_ACCESS_DENIED', 'You are not a member of this workspace')
  }

  if (membership && action === 'read' && !role) return

  if (!role || !roleCapabilities[role].includes(action)) {
    throw new AppError(403, 'PERMISSION_DENIED', 'You do not have permission to perform this action')
  }
}