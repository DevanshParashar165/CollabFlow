import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireWorkspaceMember } from '../middleware/workspaceMiddleware.js';
import { getWorkspaceActivity, getProjectActivity, getTaskActivity } from '../controllers/activityController.js';

const router = express.Router();
router.get('/:workspaceId/activity', authMiddleware, requireWorkspaceMember, getWorkspaceActivity);
router.get('/:workspaceId/projects/:projectId/activity', authMiddleware, requireWorkspaceMember, getProjectActivity);
router.get('/:workspaceId/tasks/:taskId/activity', authMiddleware, requireWorkspaceMember, getTaskActivity);

export default router;