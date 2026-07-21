import { Router } from 'express'
import { z } from 'zod'
import { getActor } from '../middleware/request-context.js'
import { Comment } from '../models/comment.model.js'
import { Document } from '../models/document.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { AppError } from '../utils/app-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { objectId } from '../utils/validation.js'

export function createCommentRouter(collaboration: CollaborationServer) {
  const router = Router()

  router.get('/documents/:documentId/comments', asyncHandler(async (req, res) => {
    objectId.parse(req.params.documentId)
    const comments = await Comment.find({ documentId: req.params.documentId }).sort({ createdAt: -1 })
    res.json({ success: true, data: { comments } })
  }))

  router.post('/documents/:documentId/comments', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.documentId)
    const body = z.object({ body: z.string().trim().min(1), quotedText: z.string().optional() }).parse(req.body)
    const document = await Document.findById(req.params.documentId)
    if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    assertDocumentAccess(document, actor.id, 'comment')

    const mentions = Array.from(body.body.matchAll(/@([a-f\d]{24})/gi)).map((match) => match[1])
    const comment = await Comment.create({ documentId: document._id, authorId: actor.id, ...body, mentions })
    collaboration.emitCommentCreated(String(req.params.documentId), comment)
    res.status(201).json({ success: true, data: { comment } })
  }))

  router.post('/comments/:commentId/replies', asyncHandler(async (req, res) => {
    const actor = getActor(req)
    objectId.parse(req.params.commentId)
    const body = z.object({ body: z.string().trim().min(1) }).parse(req.body)
    const comment = await Comment.findByIdAndUpdate(req.params.commentId, {
      $push: { replies: { authorId: actor.id, body: body.body } },
    }, { new: true })

    if (!comment) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found')
    collaboration.emitCommentUpdated(comment.documentId.toString(), comment)
    res.json({ success: true, data: { comment } })
  }))

  router.patch('/comments/:commentId', asyncHandler(async (req, res) => {
    objectId.parse(req.params.commentId)
    const body = z.object({ status: z.enum(['open', 'resolved']) }).parse(req.body)
    const comment = await Comment.findByIdAndUpdate(req.params.commentId, body, { new: true })
    if (!comment) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found')
    collaboration.emitCommentUpdated(comment.documentId.toString(), comment)
    res.json({ success: true, data: { comment } })
  }))

  return router
}