import type { Request, Response } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Document, type DocumentDocument } from '../models/document.model.js'
import { User } from '../models/user.model.js'
import { Workspace } from '../models/workspace.model.js'
import { assertWorkspaceMember, assertWorkspaceOwner } from '../services/permission.service.js'
import { AppError } from '../utils/app-error.js'
import { objectId } from '../utils/validation.js'

export async function listWorkspaces(req: Request, res: Response) {
  const actor = getActor(req)
  const memberWorkspaces = await Workspace.find({ 'members.userId': actor.id }).sort({ updatedAt: -1 })
  const memberWorkspaceIds = new Set(memberWorkspaces.map((workspace) => workspace._id.toString()))
  const sharedWorkspaceIds = await Document.distinct('workspaceId', {
    'permissions.subjectId': actor.id,
    status: { $ne: 'deleted' },
    workspaceId: { $nin: [...memberWorkspaceIds] },
  })
  const sharedWorkspaces = sharedWorkspaceIds.length
    ? await Workspace.find({ _id: { $in: sharedWorkspaceIds } }).sort({ updatedAt: -1 })
    : []
  const workspaces = [...memberWorkspaces, ...sharedWorkspaces]
  res.json({ success: true, data: { workspaces } })
}

export async function createWorkspace(req: Request, res: Response) {
  const actor = getActor(req)
  const body = z.object({ name: z.string().trim().min(2).max(120) }).parse(req.body)
  const slugBase = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace'
  const slug = `${slugBase}-${Date.now().toString(36)}`
  const workspace = await Workspace.create({
    name: body.name,
    slug,
    ownerUserId: actor.id,
    members: [{ userId: actor.id, role: 'workspace_owner' }],
  })
  res.status(201).json({ success: true, data: { workspace } })
}

export async function getWorkspaceTree(req: Request, res: Response) {
  const actor = getActor(req)
  const workspaceId = objectId.parse(req.params.workspaceId)
  const workspace = await Workspace.findById(workspaceId)
  if (!workspace) throw new AppError(404, 'WORKSPACE_NOT_FOUND', 'Workspace not found')

  const isMember = workspace.members.some((member) => member.userId.toString() === actor.id)
  const documents = isMember
    ? await Document.find({ workspaceId, status: { $ne: 'deleted' } }).sort({ type: 1, updatedAt: -1 })
    : await getSharedDocumentTree(workspaceId, actor.id)

  if (!isMember && documents.length === 0) {
    throw new AppError(403, 'WORKSPACE_ACCESS_DENIED', 'You do not have access to this workspace')
  }

  res.json({ success: true, data: { documents } })
}

async function getSharedDocumentTree(workspaceId: string, userId: string) {
  const included = new Map<string, DocumentDocument>()
  const directDocuments = await Document.find({
    workspaceId,
    status: { $ne: 'deleted' },
    'permissions.subjectId': userId,
  }).sort({ type: 1, updatedAt: -1 })

  directDocuments.forEach((document) => included.set(document._id.toString(), document))
  let parentIds = directDocuments
    .map((document) => document.parentId?.toString())
    .filter((parentId): parentId is string => Boolean(parentId))

  while (parentIds.length) {
    const missingParentIds = [...new Set(parentIds.filter((parentId) => !included.has(parentId)))]
    if (!missingParentIds.length) break
    const parents = await Document.find({ _id: { $in: missingParentIds }, workspaceId, status: { $ne: 'deleted' } })
    parentIds = []
    parents.forEach((parent) => {
      included.set(parent._id.toString(), parent)
      if (parent.parentId) parentIds.push(parent.parentId.toString())
    })
  }

  return [...included.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.title.localeCompare(b.title)
  })
}

export async function listWorkspaceMembers(req: Request, res: Response) {
  const actor = getActor(req)
  const workspaceId = objectId.parse(req.params.workspaceId)
  const workspace = await assertWorkspaceMember(workspaceId, actor.id)
  const members = await User.find({ _id: { $in: workspace.members.map((item) => item.userId) } })
  res.json({ success: true, data: { members } })
}

export async function addWorkspaceMember(req: Request, res: Response) {
  const actor = getActor(req)
  const workspaceId = objectId.parse(req.params.workspaceId)
  const body = z.object({ email: z.string().email(), role: z.enum(['workspace_owner', 'member']).default('member') }).parse(req.body)
  const workspace = await assertWorkspaceOwner(workspaceId, actor.id)
  const user = await User.findOne({ email: body.email.toLowerCase() })
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'No user found with that email')

  const exists = workspace.members.some((item) => item.userId.toString() === user._id.toString())
  if (!exists) {
    workspace.members.push({ userId: user._id, role: body.role })
    await workspace.save()
  }

  res.json({ success: true, data: { workspace } })
}

export async function updateWorkspace(req: Request, res: Response) {
  const actor = getActor(req)
  const workspaceId = objectId.parse(req.params.workspaceId)
  const body = z.object({ name: z.string().trim().min(2).max(120) }).parse(req.body)
  const workspace = await assertWorkspaceOwner(workspaceId, actor.id)
  workspace.name = body.name
  workspace.slug = `${body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace'}-${workspace._id.toString().slice(-6)}`
  await workspace.save()
  res.json({ success: true, data: { workspace } })
}

export async function deleteWorkspace(req: Request, res: Response) {
  const actor = getActor(req)
  const workspaceId = objectId.parse(req.params.workspaceId)
  const workspace = await assertWorkspaceOwner(workspaceId, actor.id)
  await Document.updateMany({ workspaceId: workspace._id }, { status: 'deleted' })
  await Workspace.deleteOne({ _id: workspace._id })
  res.json({ success: true, data: { deletedWorkspaceId: workspaceId } })
}
