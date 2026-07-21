import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from '../config/env.js'
import { Document } from '../models/document.model.js'
import { User } from '../models/user.model.js'
import { assertDocumentAccess } from '../services/permission.service.js'
import { logger } from '../utils/logger.js'

type PresenceUser = {
  userId: string
  displayName: string
  color: string
  cursorLabel?: string
  status?: 'active' | 'idle'
  lastActivityAt?: string
}

type SocketAuthPayload = {
  sub: string
}

export type CollaborationServer = ReturnType<typeof createCollaborationServer>

export function createCollaborationServer(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  })

  io.use(async (socket, next) => {
    try {
      const token = typeof socket.handshake.auth.token === 'string' ? socket.handshake.auth.token : undefined
      if (!token) return next(new Error('Missing collaboration token'))
      const payload = jwt.verify(token, env.jwtSecret) as SocketAuthPayload
      const user = await User.findById(payload.sub)
      if (!user || user.status !== 'active') return next(new Error('Invalid collaboration token'))
      socket.data.user = {
        userId: user._id.toString(),
        displayName: user.displayName,
        color: user.colorSeed,
      } satisfies PresenceUser
      next()
    } catch {
      next(new Error('Invalid collaboration token'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('document:join', async (payload: { documentId: string }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(payload.documentId)) {
          socket.emit('collaboration:error', { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document id' })
          return
        }
        const document = await Document.findById(payload.documentId)
        if (!document) {
          socket.emit('collaboration:error', { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' })
          return
        }
        await assertDocumentAccess(document, socket.data.user.userId, 'read')
        socket.join(payload.documentId)
        socket.data.documentId = payload.documentId
        socket.to(payload.documentId).emit('presence:joined', socket.data.user)
      } catch (error) {
        emitSocketError(socket, error)
      }
    })

    socket.on('document:update', async (payload: { documentId: string; contentHtml: string; title: string; localUpdateId: string }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(payload.documentId)) {
          socket.emit('collaboration:error', { code: 'INVALID_DOCUMENT_ID', message: 'Invalid document id' })
          return
        }
        const current = await Document.findById(payload.documentId)
        if (!current) {
          socket.emit('collaboration:error', { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' })
          return
        }
        await assertDocumentAccess(current, socket.data.user.userId, 'edit')
        const document = await Document.findByIdAndUpdate(payload.documentId, {
          contentHtml: payload.contentHtml,
          title: payload.title || 'Untitled',
          $inc: { updateCount: 1 },
        }, { new: true })
        socket.emit('sync:ack', { localUpdateId: payload.localUpdateId, updateCount: document?.updateCount })
        socket.to(payload.documentId).emit('document:patched', { document, actorId: socket.data.user.userId })
      } catch (error) {
        emitSocketError(socket, error)
      }
    })

    socket.on('presence:update', (payload: { documentId: string; cursorLabel?: string; status: 'active' | 'idle' }) => {
      socket.to(payload.documentId).emit('presence:update', {
        ...socket.data.user,
        cursorLabel: payload.cursorLabel,
        status: payload.status,
        lastActivityAt: new Date().toISOString(),
      })
    })

    socket.on('disconnect', () => {
      const documentId = socket.data.documentId
      if (documentId) socket.to(documentId).emit('presence:left', socket.data.user)
    })
  })

  return {
    io,
    emitDocumentPatched(documentId: string, document: unknown, actorId: string) {
      io.to(documentId).emit('document:patched', { document, actorId })
    },
    emitCommentCreated(documentId: string, comment: unknown) {
      io.to(documentId).emit('comment:created', { comment })
    },
    emitCommentUpdated(documentId: string, comment: unknown) {
      io.to(documentId).emit('comment:updated', { comment })
    },
  }
}

function emitSocketError(socket: { emit: (event: string, payload: unknown) => void }, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected collaboration error'
  logger.error('Socket collaboration handler failed', { message })
  socket.emit('collaboration:error', { code: 'COLLABORATION_ERROR', message })
}