import { Router } from 'express'
import { createVersionController } from '../controllers/version.controller.js'
import type { CollaborationServer } from '../sockets/collaboration.socket.js'
import { asyncHandler } from '../utils/async-handler.js'

export function createVersionRouter(collaboration: CollaborationServer) {
  const controller = createVersionController(collaboration)
  const router = Router()

  router.get('/documents/:documentId/versions', asyncHandler(controller.listVersions))
  router.post('/documents/:documentId/versions', asyncHandler(controller.createVersion))
  router.post('/documents/:documentId/restore', asyncHandler(controller.restoreVersion))

  return router
}