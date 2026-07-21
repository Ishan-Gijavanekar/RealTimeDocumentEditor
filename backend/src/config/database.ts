import mongoose from 'mongoose'
import net from 'node:net'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export async function connectDatabase() {
  try {
    logger.info(`Connecting to MongoDB at ${maskMongoUri(env.mongoUri)}`)
    await assertMongoEndpointReachable(env.mongoUri)
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    })
    logger.info('MongoDB connected')
  } catch (error) {
    printMongoConnectionHelp(error)
    process.exitCode = 1
    throw error
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

async function assertMongoEndpointReachable(uri: string) {
  const endpoint = parseMongoEndpoint(uri)
  if (!endpoint) return

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection(endpoint)
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error(`Timed out connecting to ${endpoint.host}:${endpoint.port}`))
    }, 1500)

    socket.once('connect', () => {
      clearTimeout(timer)
      socket.end()
      resolve()
    })

    socket.once('error', (error) => {
      clearTimeout(timer)
      socket.destroy()
      reject(error)
    })
  })
}

function parseMongoEndpoint(uri: string) {
  if (uri.startsWith('mongodb+srv://')) return null

  try {
    const parsed = new URL(uri)
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 27017),
    }
  } catch {
    return null
  }
}

function printMongoConnectionHelp(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown MongoDB connection error'
  logger.error('MongoDB connection failed', {
    reason: message,
    configuredUri: maskMongoUri(env.mongoUri),
    fix: [
      'Start MongoDB locally on port 27017, or',
      'Set MONGO_URI in backend/.env to your MongoDB Atlas/local connection string.',
      'Example: MONGO_URI=mongodb://127.0.0.1:27017/realtime_document_editor',
    ],
  })
}

function maskMongoUri(uri: string) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@/]+)@/i, '$1$2:***@')
}