import type { Request, Response } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Document } from '../models/document.model.js'
import { Version } from '../models/version.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { AppError } from '../utils/app-error.js'
import { objectId } from '../utils/validation.js'

export function createVersionController(collaboration: CollaborationServer) {
  return {
    listVersions: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'read')
      const versions = await Version.find({ documentId }).sort({ createdAt: -1 })
      res.json({ success: true, data: { versions } })
    },

    createVersion: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const body = z.object({ label: z.string().trim().min(1).max(120) }).parse(req.body)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'edit')
      const version = await Version.create({ documentId: document._id, label: body.label, contentHtml: document.contentHtml, title: document.title, createdBy: actor.id, updateCount: document.updateCount })
      res.status(201).json({ success: true, data: { version } })
    },

    restoreVersion: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const body = z.object({ versionId: objectId }).parse(req.body)
      const document = await Document.findById(documentId)
      const version = await Version.findById(body.versionId)
      if (!document || !version) throw new AppError(404, 'VERSION_NOT_FOUND', 'Document or version not found')
      await assertDocumentAccess(document, actor.id, 'edit')
      await Version.create({ documentId: document._id, label: 'Before restore', contentHtml: document.contentHtml, title: document.title, createdBy: actor.id, updateCount: document.updateCount })
      document.title = version.title
      document.contentHtml = version.contentHtml
      document.updateCount += 1
      await document.save()
      collaboration.emitDocumentPatched(documentId, document, actor.id)
      res.json({ success: true, data: { document } })
    },
  }
}