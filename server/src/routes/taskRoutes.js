import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireWorkspaceMember, requireWorkspaceRoles } from '../middleware/workspaceMiddleware.js';
import { validateCreateTask, validateUpdateTask } from '../validators/taskValidators.js';
import { createTask, getProjectTasks, getTaskById, updateTask, deleteTask } from '../controllers/taskController.js';

const router = express.Router();
const base = '/:workspaceId/projects/:projectId/tasks';

router.post(base, authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN', 'MEMBER'), validateCreateTask, createTask);
router.get(base, authMiddleware, requireWorkspaceMember, getProjectTasks);
router.get(`${base}/:taskId`, authMiddleware, requireWorkspaceMember, getTaskById);
router.patch(`${base}/:taskId`, authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN', 'MEMBER'), validateUpdateTask, updateTask);
router.delete(`${base}/:taskId`, authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN'), deleteTask);

export default router;