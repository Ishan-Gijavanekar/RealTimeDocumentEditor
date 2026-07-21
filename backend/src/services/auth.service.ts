import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/user.model.js'
import { AppError } from '../utils/app-error.js'

export type PublicUser = {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  colorSeed: string
}

export async function registerUser(input: { email: string; password: string; displayName: string }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() })
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'A user with this email already exists')

  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    displayName: input.displayName,
    colorSeed: pickUserColor(input.email),
  })

  return createAuthSession(user)
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash')
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  if (user.status !== 'active') throw new AppError(403, 'USER_DISABLED', 'This user account is disabled')

  return createAuthSession(user)
}

export function toPublicUser(user: { _id: unknown; email: string; displayName: string; avatarUrl?: string | null; colorSeed: string }): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    colorSeed: user.colorSeed,
  }
}

function createAuthSession(user: { _id: unknown; email: string; displayName: string; avatarUrl?: string | null; colorSeed: string }) {
  const publicUser = toPublicUser(user)
  const token = jwt.sign(
    { email: publicUser.email, displayName: publicUser.displayName },
    env.jwtSecret,
    { subject: publicUser.id, expiresIn: env.jwtExpiresIn } as jwt.SignOptions,
  )
  return { user: publicUser, token }
}

function pickUserColor(seed: string) {
  const colors = ['#2563eb', '#0f9f6e', '#b7791f', '#c2413d', '#7c3aed', '#0891b2']
  const index = Math.abs(Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0)) % colors.length
  return colors[index]
}