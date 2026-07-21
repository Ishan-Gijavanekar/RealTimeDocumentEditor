import { Schema, model } from 'mongoose'

const versionSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  contentHtml: { type: String, required: true },
  title: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updateCount: { type: Number, default: 0 },
}, { timestamps: true })

export const Version = model('Version', versionSchema)