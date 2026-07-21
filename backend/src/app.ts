import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env.js'
import { requireAuth } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { authRouter } from './routes/auth.routes.js'
import { healthRouter } from './routes/health.routes.js'
import { meRouter } from './routes/me.routes.js'
import { workspaceRouter } from './routes/workspace.routes.js'
import { createDocumentRouter } from './routes/document.routes.js'
import { createCommentRouter } from './routes/comment.routes.js'
import { createVersionRouter } from './routes/version.routes.js'
import { searchRouter } from './routes/search.routes.js'
import type { CollaborationServer } from './sockets/collaboration.socket.js'

export function createApp(collaboration: CollaborationServer) {
  const app = express()

  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  app.use(healthRouter)
  app.use('/api', authRouter)
  app.use('/api', requireAuth)
  app.use('/api', meRouter)
  app.use('/api', workspaceRouter)
  app.use('/api', createDocumentRouter(collaboration))
  app.use('/api', createCommentRouter(collaboration))
  app.use('/api', createVersionRouter(collaboration))
  app.use('/api', searchRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}