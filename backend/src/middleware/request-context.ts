import type { Request } from 'express'
import mongoose from 'mongoose'
import { DEMO_USER_ID } from '../constants/roles.js'
import { AppError } from '../utils/app-error.js'

export function getActor(req: Request) {
  const id = req.header('x-user-id') ?? DEMO_USER_ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'INVALID_ACTOR', 'The x-user-id header must be a valid MongoDB ObjectId')
  }
  return {
    id,
    displayName: req.header('x-user-name') ?? 'Demo Collaborator',
  }
}