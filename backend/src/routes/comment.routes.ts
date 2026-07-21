import { Router } from 'express'
import { createCommentController } from '../controllers/comment.controller.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { asyncHandler } from '../utils/async-handler.js'

export function createCommentRouter(collaboration: CollaborationServer) {
  const controller = createCommentController(collaboration)
  const router = Router()

  router.get('/documents/:documentId/comments', asyncHandler(controller.listComments))
  router.post('/documents/:documentId/comments', asyncHandler(controller.createComment))
  router.post('/comments/:commentId/replies', asyncHandler(controller.addReply))
  router.patch('/comments/:commentId', asyncHandler(controller.updateComment))

  return router
}