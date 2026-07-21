import type { Request, Response } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Comment } from '../models/comment.model.js'
import { Document } from '../models/document.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { AppError } from '../utils/app-error.js'
import { objectId } from '../utils/validation.js'

export function createCommentController(collaboration: CollaborationServer) {
  return {
    listComments: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'read')
      const comments = await Comment.find({ documentId }).sort({ createdAt: -1 })
      res.json({ success: true, data: { comments } })
    },

    createComment: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const documentId = objectId.parse(req.params.documentId)
      const body = z.object({ body: z.string().trim().min(1), quotedText: z.string().optional() }).parse(req.body)
      const document = await Document.findById(documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'comment')
      const mentions = Array.from(body.body.matchAll(/@([a-f\d]{24})/gi)).map((match) => match[1])
      const comment = await Comment.create({ documentId: document._id, authorId: actor.id, ...body, mentions })
      collaboration.emitCommentCreated(documentId, comment)
      res.status(201).json({ success: true, data: { comment } })
    },

    addReply: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const commentId = objectId.parse(req.params.commentId)
      const body = z.object({ body: z.string().trim().min(1) }).parse(req.body)
      const existing = await Comment.findById(commentId)
      if (!existing) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found')
      const document = await Document.findById(existing.documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'comment')
      const comment = await Comment.findByIdAndUpdate(commentId, { $push: { replies: { authorId: actor.id, body: body.body } } }, { new: true })
      collaboration.emitCommentUpdated(existing.documentId.toString(), comment)
      res.json({ success: true, data: { comment } })
    },

    updateComment: async (req: Request, res: Response) => {
      const actor = getActor(req)
      const commentId = objectId.parse(req.params.commentId)
      const body = z.object({ status: z.enum(['open', 'resolved']) }).parse(req.body)
      const existing = await Comment.findById(commentId)
      if (!existing) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found')
      const document = await Document.findById(existing.documentId)
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      await assertDocumentAccess(document, actor.id, 'comment')
      const comment = await Comment.findByIdAndUpdate(commentId, body, { new: true })
      collaboration.emitCommentUpdated(existing.documentId.toString(), comment)
      res.json({ success: true, data: { comment } })
    },
  }
}