import http from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { seedDemoWorkspace } from './services/seed.service.js'
import { createCollaborationServer } from './sockets/collaboration.socket.js'
import { logger } from './utils/logger.js'

export async function startServer() {
  await connectDatabase()
  await seedDemoWorkspace()

  const httpServer = http.createServer()
  const collaboration = createCollaborationServer(httpServer)
  const app = createApp(collaboration)

  httpServer.on('request', app)
  httpServer.listen(env.port, () => {
    logger.info(`API and collaboration gateway running on http://localhost:${env.port}`)
  })

  registerProcessHandlers(httpServer)
}

function registerProcessHandlers(server: http.Server) {
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received. Closing HTTP server and MongoDB connection.`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : reason })
  })
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { message: error.message })
    process.exit(1)
  })
}