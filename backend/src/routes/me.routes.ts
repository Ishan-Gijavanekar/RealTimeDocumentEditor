import { Router } from 'express'
import { getActor } from '../middleware/request-context.js'
import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/async-handler.js'

export const meRouter = Router()

meRouter.get('/me', asyncHandler(async (req, res) => {
  const actor = getActor(req)
  const user = await User.findById(actor.id)
  res.json({ success: true, data: { user } })
}))