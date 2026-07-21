import { Schema, model } from 'mongoose'
import { roleValues } from '../constants/roles.js'

const documentSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null, index: true },
  type: { type: String, enum: ['document', 'folder'], default: 'document' },
  title: { type: String, required: true, default: 'Untitled', trim: true, maxlength: 160 },
  contentHtml: { type: String, default: '<h1>Untitled</h1><p>Start writing...</p>' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active', index: true },
  permissionVersion: { type: Number, default: 1 },
  permissions: [{
    subjectType: { type: String, enum: ['user'], default: 'user' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: roleValues, default: 'viewer' },
  }],
  updateCount: { type: Number, default: 0 },
}, { timestamps: true })

documentSchema.index({ workspaceId: 1, parentId: 1, status: 1 })
documentSchema.index({ title: 'text', contentHtml: 'text' })

export const Document = model('Document', documentSchema)
export type DocumentDocument = InstanceType<typeof Document>