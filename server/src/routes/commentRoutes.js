import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireWorkspaceMember, requireWorkspaceRoles } from '../middleware/workspaceMiddleware.js';
import { createComment, getTaskComments, updateComment, deleteComment } from '../controllers/commentController.js';
import { validateCreateComment, validateUpdateComment } from '../validators/commentValidators.js';

const router = express.Router();
const base = '/:workspaceId/tasks/:taskId/comments';

router.post(base, authMiddleware, requireWorkspaceMember, requireWorkspaceRoles('OWNER', 'ADMIN', 'MEMBER'), validateCreateComment, createComment);
router.get(base, authMiddleware, requireWorkspaceMember, getTaskComments);
router.patch(`${base}/:commentId`, authMiddleware, requireWorkspaceMember, validateUpdateComment, updateComment);
router.delete(`${base}/:commentId`, authMiddleware, requireWorkspaceMember, deleteComment);

export default router;