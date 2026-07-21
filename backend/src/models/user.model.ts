import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  avatarUrl: String,
  colorSeed: { type: String, required: true },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
}, { timestamps: true })

export const User = model('User', userSchema)
export type UserDocument = InstanceType<typeof User>