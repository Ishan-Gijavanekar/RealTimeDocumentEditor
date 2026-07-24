import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Document } from '../models/document.model.js'
import { ShareLink } from '../models/share-link.model.js'
import { assertDocumentAccess, assertWorkspaceMember } from '../services/permission.service.js'
import { AppError } from '../utils/app-error.js'
import { objectId } from '../utils/validation.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'

export function createDocumentController(collaboration: CollaborationServer) {
  return {
    createDocument: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const body = z.object({
        workspaceId: objectId,
        parentId: objectId.nullish(),
        type: z.enum(['document', 'folder']).default('document'),
        title: z.string().trim().min(1).max(160).default('Untitled'),
      }).parse(req.body)
      await assertWorkspaceMember(body.workspaceId, actor.id)
      const document = await Document.create({
        ...body,
        ownerId: actor.id,
        contentHtml: body.type === 'folder' ? '' : `<h1>${body.title}</h1><p></p>`,
        permissions: [{ subjectId: actor.id, role: 'owner' }],
      })
      res.status(201).json({ success: true, data: { document } })
    },

    getDocument: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'read')
      res.json({ success: true, data: { document } })
    },

    updateDocument: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const body = z.object({
        title: z.string().trim().min(1).max(160).optional(),
        contentHtml: z.string().max(1_000_000).optional(),
        parentId: objectId.nullable().optional(),
        status: z.enum(['active', 'archived', 'deleted']).optional(),
      }).parse(req.body)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'edit')
      const updated = await Document.findByIdAndUpdate(documentId, { ...body, $inc: { updateCount: body.contentHtml ? 1 : 0 } }, { new: true })

      if (body.status === 'deleted' && document.type === 'folder') {
        const descendants = await collectDescendantDocumentIds(document._id.toString())
        if (descendants.length > 0) await Document.updateMany({ _id: { $in: descendants } }, { status: 'deleted' })
      }

      collaboration.emitDocumentPatched(documentId, updated, actor.id)
      res.json({ success: true, data: { document: updated } })
    },

    duplicateDocument: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const source = await Document.findById(documentId)
      if (!source) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(source, actor.id, 'read')
      const document = await Document.create({
        workspaceId: source.workspaceId,
        parentId: source.parentId,
        type: source.type,
        title: `${source.title} Copy`,
        contentHtml: source.contentHtml,
        ownerId: actor.id,
        permissions: [{ subjectId: actor.id, role: 'owner' }],
      })
      res.status(201).json({ success: true, data: { document } })
    },

    createShareLink: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const body = z.object({ role: z.enum(['viewer', 'commenter', 'editor']).default('viewer') }).parse(req.body)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'share')
      const shareLink = await ShareLink.create({
        documentId: document._id,
        role: body.role,
        token: randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', ''),
        createdBy: actor.id,
      })
      res.status(201).json({ success: true, data: { shareLink } })
    },
  }
}

async function collectDescendantDocumentIds(parentId: string): Promise<string[]> {
  const children = await Document.find({ parentId, status: { $ne: 'deleted' } }).select('_id type')
  const childIds = children.map((child) => child._id.toString())
  const nestedIds = await Promise.all(children.filter((child) => child.type === 'folder').map((child) => collectDescendantDocumentIds(child._id.toString())))
  return [...childIds, ...nestedIds.flat()]
}
