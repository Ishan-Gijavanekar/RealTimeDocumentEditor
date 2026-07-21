import type { Request, Response } from 'express'
import { z } from 'zod'
import { User } from '../models/user.model.js'
import { loginUser, registerUser, toPublicUser } from '../services/auth.service.js'
import { AppError } from '../utils/app-error.js'

const authSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(2).max(80).optional(),
})

export async function register(req: Request, res: Response) {
  const body = authSchema.required({ displayName: true }).parse(req.body)
  const session = await registerUser({ email: body.email, password: body.password, displayName: body.displayName })
  res.status(201).json({ success: true, data: session })
}

export async function login(req: Request, res: Response) {
  const body = authSchema.pick({ email: true, password: true }).parse(req.body)
  const session = await loginUser(body)
  res.json({ success: true, data: session })
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required')
  const user = await User.findById(req.user.id)
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
  res.json({ success: true, data: { user: toPublicUser(user) } })
}