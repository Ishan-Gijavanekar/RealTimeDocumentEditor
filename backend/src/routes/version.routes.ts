import { Router } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Document } from '../models/document.model.js'
import { Version } from '../models/version.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { AppError } from '../utils/app-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { objectId } from '../utils/validation.js'

export function createVersionRouter(collaboration: CollaborationServer) {
  const router = Router()

  router.get('/documents/:documentId/versions', asyncHandler(async (req, res) => {
    objectId.parse(req.params.documentId)
    const versions = await Version.find({ documentId: req.params.documentId }).sort({ createdAt: -1 })
    res.json({ success: true, data: { versions } })
  }))

  router.post('/documents/:documentId/versions', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const body = z.object({ label: z.string().trim().min(1).max(120) }).parse(req.body)
    const document = await Document.findById(req.params.documentId)
    if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(document, actor.id, 'edit')

    const version = await Version.create({
      documentId: document._id,
      label: body.label,
      contentHtml: document.contentHtml,
      title: document.title,
      createdBy: actor.id,
      updateCount: document.updateCount,
    })

    res.status(201).json({ success: true, data: { version } })
  }))

  router.post('/documents/:documentId/restore', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const body = z.object({ versionId: objectId }).parse(req.body)
    const document = await Document.findById(req.params.documentId)
    const version = await Version.findById(body.versionId)
    if (!document || !version) throw new AppError(404, 'VERSION_NOT_FOUND', 'Document or version not found')
    assertDocumentAccess(document, actor.id, 'edit')

    await Version.create({
      documentId: document._id,
      label: 'Before restore',
      contentHtml: document.contentHtml,
      title: document.title,
      createdBy: actor.id,
      updateCount: document.updateCount,
    })

    document.title = version.title
    document.contentHtml = version.contentHtml
    document.updateCount += 1
    await document.save()

    collaboration.emitDocumentPatched(String(req.params.documentId), document, actor.id)
    res.json({ success: true, data: { document } })
  }))

  return router
}