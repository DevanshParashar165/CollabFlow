import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireWorkspaceMember, requireWorkspaceRoles } from '../middleware/workspaceMiddleware.js';
import { validateGenerateProjectTasks } from '../validators/aiValidators.js';
import { generateProjectTaskSuggestions } from '../controllers/aiController.js';

const router = express.Router({ mergeParams: true });

router.post(
  '/:workspaceId/projects/:projectId/ai/generate-tasks',
  authMiddleware,
  requireWorkspaceMember,
  requireWorkspaceRoles('OWNER', 'ADMIN', 'MEMBER'),
  validateGenerateProjectTasks,
  generateProjectTaskSuggestions
);

export default router;
