import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  requireWorkspaceMember,
  requireWorkspaceRoles,
} from '../middleware/workspaceMiddleware.js';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from '../controllers/workspaceController.js';
import {
  validateCreateWorkspace,
  validateUpdateWorkspace,
  validateAddMember,
  validateUpdateMemberRole,
} from '../validators/workspaceValidators.js';

const router = express.Router();

// Workspace Core Routes
router.post('/', authMiddleware, validateCreateWorkspace, createWorkspace);
router.get('/', authMiddleware, getWorkspaces);

router.get(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceById
);

router.patch(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER', 'ADMIN'),
  validateUpdateWorkspace,
  updateWorkspace
);

router.delete(
  '/:workspaceId',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER'),
  deleteWorkspace
);

// Workspace Member Routes
router.get(
  '/:workspaceId/members',
  authMiddleware,
  requireWorkspaceMember,
  getWorkspaceMembers
);

router.post(
  '/:workspaceId/members',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER', 'ADMIN'),
  validateAddMember,
  addWorkspaceMember
);

router.patch(
  '/:workspaceId/members/:userId',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER', 'ADMIN'),
  validateUpdateMemberRole,
  updateMemberRole
);

router.delete(
  '/:workspaceId/members/:userId',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER', 'ADMIN'),
  removeWorkspaceMember
);

export default router;
