import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'
import { asyncHandler } from '../utils/async-handler.js'

type JwtPayload = {
  sub: string
  email: string
  displayName: string
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Missing bearer token')

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, env.jwtSecret) as JwtPayload
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired authentication token')
  }

  const user = await User.findById(payload.sub)
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'USER_INACTIVE', 'User does not exist or is inactive')
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
  }
  next()
})