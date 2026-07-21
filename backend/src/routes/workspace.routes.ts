import { Router } from 'express'
import { addWorkspaceMember, createWorkspace, getWorkspaceTree, listWorkspaceMembers, listWorkspaces } from '../controllers/workspace.controller.js'
import { asyncHandler } from '../utils/async-handler.js'

export const workspaceRouter = Router()

workspaceRouter.get('/workspaces', asyncHandler(listWorkspaces))
workspaceRouter.post('/workspaces', asyncHandler(createWorkspace))
workspaceRouter.get('/workspaces/:workspaceId/tree', asyncHandler(getWorkspaceTree))
workspaceRouter.get('/workspaces/:workspaceId/members', asyncHandler(listWorkspaceMembers))
workspaceRouter.post('/workspaces/:workspaceId/members', asyncHandler(addWorkspaceMember))