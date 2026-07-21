import { Router } from 'express'
import { Document } from '../models/document.model.js'
import { asyncHandler } from '../utils/async-handler.js'
import { objectId } from '../utils/validation.js'

export const searchRouter = Router()

searchRouter.get('/search', asyncHandler(async (req, res) => {
  const query = String(req.query.q ?? '').trim()
  const workspaceId = String(req.query.workspaceId ?? '')

  if (!query || !objectId.safeParse(workspaceId).success) {
    res.json({ success: true, data: { results: [] } })
    return
  }

  const results = await Document.find({
    workspaceId,
    status: { $ne: 'deleted' },
    $text: { $search: query },
  }).limit(20)

  res.json({ success: true, data: { results } })
}))