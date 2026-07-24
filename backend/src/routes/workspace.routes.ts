import { Router } from 'express'
import { addWorkspaceMember, createWorkspace, deleteWorkspace, getWorkspaceTree, listWorkspaceMembers, listWorkspaces, updateWorkspace } from '../controllers/workspace.controller.js'
import { asyncHandler } from '../utils/async-handler.js'

export const workspaceRouter = Router()

workspaceRouter.get('/workspaces', asyncHandler(listWorkspaces))
workspaceRouter.post('/workspaces', asyncHandler(createWorkspace))
workspaceRouter.patch('/workspaces/:workspaceId', asyncHandler(updateWorkspace))
workspaceRouter.delete('/workspaces/:workspaceId', asyncHandler(deleteWorkspace))
workspaceRouter.get('/workspaces/:workspaceId/tree', asyncHandler(getWorkspaceTree))
workspaceRouter.get('/workspaces/:workspaceId/members', asyncHandler(listWorkspaceMembers))
workspaceRouter.post('/workspaces/:workspaceId/members', asyncHandler(addWorkspaceMember))