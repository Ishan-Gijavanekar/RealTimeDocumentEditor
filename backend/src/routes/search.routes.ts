import { Router } from 'express'
import { searchDocuments } from '../controllers/search.controller.js'
import { asyncHandler } from '../utils/async-handler.js'

export const searchRouter = Router()

searchRouter.get('/search', asyncHandler(searchDocuments))