import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { Document } from '../models/document.model.js'
import { ShareLink } from '../models/share-link.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import { AppError } from '../utils/app-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { getActor } from '../middleware/request-context.js'
import { objectId } from '../utils/validation.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'

export function createDocumentRouter(collaboration: CollaborationServer) {
  const router = Router()

  router.post('/documents', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    const body = z.object({
      workspaceId: objectId,
      parentId: objectId.nullish(),
      type: z.enum(['document', 'folder']).default('document'),
      title: z.string().trim().min(1).max(160).default('Untitled'),
    }).parse(req.body)

    const document = await Document.create({
      ...body,
      ownerId: actor.id,
      contentHtml: body.type === 'folder' ? '' : `<h1>${body.title}</h1><p></p>`,
      permissions: [{ subjectId: actor.id, role: 'owner' }],
    })

    res.status(201).json({ success: true, data: { document } })
  }))

  router.get('/documents/:documentId', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const document = await Document.findById(req.params.documentId)
    if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(document, actor.id, 'read')
    res.json({ success: true, data: { document } })
  }))

  router.patch('/documents/:documentId', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const body = z.object({
      title: z.string().trim().min(1).max(160).optional(),
      contentHtml: z.string().max(1_000_000).optional(),
      parentId: objectId.nullable().optional(),
      status: z.enum(['active', 'archived', 'deleted']).optional(),
    }).parse(req.body)

    const document = await Document.findById(req.params.documentId)
    if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(document, actor.id, 'edit')

    const updated = await Document.findByIdAndUpdate(req.params.documentId, {
      ...body,
      $inc: { updateCount: body.contentHtml ? 1 : 0 },
    }, { new: true })

    collaboration.emitDocumentPatched(String(req.params.documentId), updated, actor.id)
    res.json({ success: true, data: { document: updated } })
  }))

  router.post('/documents/:documentId/duplicate', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const source = await Document.findById(req.params.documentId)
    if (!source) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(source, actor.id, 'read')

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
  }))

  router.post('/documents/:documentId/share-links', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const body = z.object({ role: z.enum(['viewer', 'commenter', 'editor']).default('viewer') }).parse(req.body)
    const document = await Document.findById(req.params.documentId)
    if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(document, actor.id, 'share')

    const shareLink = await ShareLink.create({
      documentId: document._id,
      role: body.role,
      token: randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', ''),
      createdBy: actor.id,
    })

    res.status(201).json({ success: true, data: { shareLink } })
  }))

  return router
}