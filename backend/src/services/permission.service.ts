import type { DocumentAction, DocumentRole } from '../constants/roles.js'
import { roleCapabilities } from '../constants/roles.js'
import type { DocumentDocument } from '../models/document.model.js'
import { AppError } from '../utils/app-error.js'

export function assertDocumentAccess(document: DocumentDocument, userId: string, action: DocumentAction) {
  if (document.status === 'deleted') {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
  }

  if (document.ownerId.toString() === userId) return

  const permission = document.permissions.find((item) => item.subjectId.toString() === userId)
  const role = permission?.role as DocumentRole | undefined

  if (!role || !roleCapabilities[role].includes(action)) {
    throw new AppError(403, 'PERMISSION_DENIED', 'You do not have permission to perform this action')
  }
}