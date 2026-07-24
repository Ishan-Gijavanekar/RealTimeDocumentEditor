import type { Request, Response } from 'express'
import type { DocumentRole } from '../constants/roles.js'
import { getActor } from '../middleware/request-context.js'
import { Document } from '../models/document.model.js'
import { ShareLink } from '../models/share-link.model.js'
import { Workspace } from '../models/workspace.model.js'
import { AppError } from '../utils/app-error.js'

export async function getShareLink(req: Request, res: Response) {
  const token = String(req.params.token ?? '').trim()
  const shareLink = await ShareLink.findOne({ token, revokedAt: null })
  if (!shareLink || isExpired(shareLink.expiresAt)) throw new AppError(404, 'SHARE_LINK_NOT_FOUND', 'Share link is invalid or expired')

  const document = await Document.findById(shareLink.documentId).select('title type status workspaceId updatedAt')
  if (!document || document.status === 'deleted') throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Shared document not found')

  const workspace = await Workspace.findById(document.workspaceId).select('name slug')
  res.json({ success: true, data: { shareLink: { token: shareLink.token, role: shareLink.role }, document, workspace } })
}

export async function acceptShareLink(req: Request, res: Response) {
  const actor = getActor(req)
  const token = String(req.params.token ?? '').trim()
  const shareLink = await ShareLink.findOne({ token, revokedAt: null })
  if (!shareLink || isExpired(shareLink.expiresAt)) throw new AppError(404, 'SHARE_LINK_NOT_FOUND', 'Share link is invalid or expired')

  const document = await Document.findById(shareLink.documentId)
  if (!document || document.status === 'deleted') throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Shared document not found')

  const workspace = await Workspace.findById(document.workspaceId)
  if (!workspace) throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found')

  const role = shareLink.role as DocumentRole
  const existingPermission = document.permissions.find((permission) => permission.subjectId.toString() === actor.id)
  if (existingPermission) {
    existingPermission.role = maxDocumentRole(existingPermission.role as DocumentRole, role)
  } else {
    document.permissions.push({ subjectType: 'user', subjectId: actor.id, role })
  }

  document.permissionVersion += 1
  await document.save()

  res.json({ success: true, data: { document, workspace, role } })
}

function isExpired(expiresAt?: Date | null) {
  return Boolean(expiresAt && expiresAt.getTime() < Date.now())
}

function maxDocumentRole(current: DocumentRole, incoming: DocumentRole) {
  const rank: DocumentRole[] = ['viewer', 'commenter', 'editor', 'manager', 'owner']
  return rank.indexOf(incoming) > rank.indexOf(current) ? incoming : current
}
