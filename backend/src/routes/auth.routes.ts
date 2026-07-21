import { Router } from 'express'
import { login, me, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/async-handler.js'

export const authRouter = Router()

authRouter.post('/auth/register', asyncHandler(register))
authRouter.post('/auth/login', asyncHandler(login))
authRouter.get('/auth/me', requireAuth, asyncHandler(me))