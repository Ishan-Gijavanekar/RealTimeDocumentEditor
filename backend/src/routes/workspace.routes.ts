import { Router } from 'express'
import { Document } from '../models/document.model.js'
import { Workspace } from '../models/workspace.model.js'
import { asyncHandler } from '../utils/async-handler.js'
import { objectId } from '../utils/validation.js'

export const workspaceRouter = Router()

workspaceRouter.get('/workspaces', asyncHandler(async (_req, res) => {
  const workspaces = await Workspace.find().sort({ createdAt: 1 })
  res.json({ success: true, data: { workspaces } })
}))

workspaceRouter.get('/workspaces/:workspaceId/tree', asyncHandler(async (req, res) => {
  objectId.parse(req.params.workspaceId)
  const documents = await Document.find({ workspaceId: req.params.workspaceId, status: { $ne: 'deleted' } }).sort({ type: 1, updatedAt: -1 })
  res.json({ success: true, data: { documents } })
}))