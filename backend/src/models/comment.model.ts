import mongoose, { Schema, model } from 'mongoose'

const commentSchema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  threadId: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId(), index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  quotedText: String,
  anchorJson: Schema.Types.Mixed,
  status: { type: String, enum: ['open', 'resolved'], default: 'open', index: true },
  replies: [{
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }],
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

export const Comment = model('Comment', commentSchema)
export type CommentDocument = InstanceType<typeof Comment>