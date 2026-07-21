import { Schema, model } from 'mongoose'

const workspaceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['workspace_owner', 'member'], default: 'member' },
  }],
}, { timestamps: true })

export const Workspace = model('Workspace', workspaceSchema)
export type WorkspaceDocument = InstanceType<typeof Workspace>