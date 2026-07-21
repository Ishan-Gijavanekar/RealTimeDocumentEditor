import type { Request, Response } from 'express'
import { getActor } from '../middleware/request-context.js'
import { Document } from '../models/document.model.js'
import { assertWorkspaceMember } from '../services/permission.service.js'
import { objectId } from '../utils/validation.js'

export async function searchDocuments(req: Request, res: Response) {
  const actor = getActor(req)
  const query = String(req.query.q ?? '').trim()
  const workspaceId = String(req.query.workspaceId ?? '')
  if (!query || !objectId.safeParse(workspaceId).success) {
    res.json({ success: true, data: { results: [] } })
    return
  }
  await assertWorkspaceMember(workspaceId, actor.id)
  const results = await Document.find({ workspaceId, status: { $ne: 'deleted' }, $text: { $search: query } }).limit(20)
  res.json({ success: true, data: { results } })
}