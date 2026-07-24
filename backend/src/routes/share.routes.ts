import { Router } from 'express'
import { acceptShareLink, getShareLink } from '../controllers/share.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/async-handler.js'

export const shareRouter = Router()

shareRouter.get('/share-links/:token', asyncHandler(getShareLink))
shareRouter.post('/share-links/:token/accept', requireAuth, asyncHandler(acceptShareLink))