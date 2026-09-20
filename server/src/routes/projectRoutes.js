import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireWorkspaceMember, requireWorkspaceRoles } from '../middleware/workspaceMiddleware.js';
import { validateCreateProject, validateUpdateProject } from '../validators/projectValidators.js';
import {
  createProject,
  getWorkspaceProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';

const router = express.Router({ mergeParams: true });

router.post('/:workspaceId/projects', authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN'), validateCreateProject, createProject);
router.get('/:workspaceId/projects', authMiddleware, requireWorkspaceMember, getWorkspaceProjects);
router.get('/:workspaceId/projects/:projectId', authMiddleware, requireWorkspaceMember, getProjectById);
router.patch('/:workspaceId/projects/:projectId', authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN'), validateUpdateProject, updateProject);
router.delete('/:workspaceId/projects/:projectId', authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN'), deleteProject);

export default router;