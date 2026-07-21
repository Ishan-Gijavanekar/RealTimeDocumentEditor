import type { AuthenticatedUser } from '../middleware/request-context.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export {}