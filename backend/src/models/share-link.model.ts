import { Schema, model } from 'mongoose'

const shareLinkSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  token: { type: String, required: true, unique: true },
  role: { type: String, enum: ['viewer', 'commenter', 'editor'], default: 'viewer' },
  expiresAt: Date,
  revokedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const ShareLink = model('ShareLink', shareLinkSchema)