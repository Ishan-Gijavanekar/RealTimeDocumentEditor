import { Router } from 'express'
import { createDocumentController } from '../controllers/document.controller.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { asyncHandler } from '../utils/async-handler.js'

export function createDocumentRouter(collaboration: CollaborationServer) {
  const controller = createDocumentController(collaboration)
  const router = Router()

  router.post('/documents', asyncHandler(controller.createDocument))
  router.get('/documents/:documentId', asyncHandler(controller.getDocument))
  router.patch('/documents/:documentId', asyncHandler(controller.updateDocument))
  router.post('/documents/:documentId/duplicate', asyncHandler(controller.duplicateDocument))
  router.post('/documents/:documentId/share-links', asyncHandler(controller.createShareLink))

  return router
}