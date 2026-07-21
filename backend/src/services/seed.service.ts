import { DEMO_USER_ID } from '../constants/roles.js'
import { Document } from '../models/document.model.js'
import { User } from '../models/user.model.js'
import { Workspace } from '../models/workspace.model.js'

export async function seedDemoWorkspace() {
  const user = await User.findByIdAndUpdate(DEMO_USER_ID, {
    email: 'demo@example.com',
    displayName: 'Demo Collaborator',
    colorSeed: '#2563eb',
    status: 'active',
  }, { upsert: true, new: true, setDefaultsOnInsert: true })

  let workspace = await Workspace.findOne({ slug: 'demo-workspace' })
  if (!workspace) {
    workspace = await Workspace.create({
      name: 'Product Docs',
      slug: 'demo-workspace',
      ownerUserId: user._id,
      members: [{ userId: user._id, role: 'workspace_owner' }],
    })
  }

  const existing = await Document.countDocuments({ workspaceId: workspace._id, status: { $ne: 'deleted' } })
  if (existing > 0) return

  const folder = await Document.create({
    workspaceId: workspace._id,
    type: 'folder',
    title: 'Launch Planning',
    contentHtml: '',
    ownerId: user._id,
    permissions: [{ subjectId: user._id, role: 'owner' }],
  })

  await Document.create({
    workspaceId: workspace._id,
    parentId: folder._id,
    type: 'document',
    title: 'Realtime Collaboration Brief',
    ownerId: user._id,
    permissions: [{ subjectId: user._id, role: 'owner' }],
    contentHtml: '<h1>Realtime Collaboration Brief</h1><p>Use this space to plan product notes with collaborators. Changes, comments, versions, and presence update live.</p><ul><li>Draft the launch narrative</li><li>Tag open questions</li><li>Create a named version before sharing</li></ul>',
  })
}