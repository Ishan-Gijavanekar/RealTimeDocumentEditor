import { Router } from 'express'
import { me } from '../controllers/auth.controller.js'
import { asyncHandler } from '../utils/async-handler.js'

export const meRouter = Router()

meRouter.get('/me', asyncHandler(me))