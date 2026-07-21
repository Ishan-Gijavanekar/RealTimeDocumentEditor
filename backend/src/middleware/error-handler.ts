import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
import { AppError } from '../utils/app-error.js'
import { logger } from '../utils/logger.js'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const normalized = normalizeError(err)

  if (normalized.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed`, {
      code: normalized.code,
      message: normalized.message,
      stack: env.nodeEnv === 'development' && err instanceof Error ? err.stack : undefined,
    })
  }

  res.status(normalized.statusCode).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
  })
}

function normalizeError(err: unknown) {
  if (err instanceof AppError) return err

  if (err instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', err.flatten())
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'INVALID_ID', 'A provided identifier is not valid')
  }

  if (isMongoDuplicateKeyError(err)) {
    return new AppError(409, 'DUPLICATE_RESOURCE', 'A resource with the same unique value already exists')
  }

  return new AppError(500, 'INTERNAL_SERVER_ERROR', 'Unexpected server error')
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number } {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: number }).code === 11000
}