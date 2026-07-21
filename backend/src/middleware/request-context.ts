import type { Request } from 'express'
import { AppError } from '../utils/app-error.js'

export type AuthenticatedUser = {
  id: string
  email: string
  displayName: string
}

export function getActor(req: Request) {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required')
  }
  return req.user
}