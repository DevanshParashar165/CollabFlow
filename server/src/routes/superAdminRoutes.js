import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import superAdminMiddleware from '../middleware/superAdminMiddleware.js';
import {
  getPlatformUsers,
  getPlatformWorkspaces,
} from '../controllers/superAdminController.js';

const router = express.Router();

// Apply authMiddleware and superAdminMiddleware to all superadmin endpoints
router.use(authMiddleware, superAdminMiddleware);

router.get('/users', getPlatformUsers);
router.get('/workspaces', getPlatformWorkspaces);

export default router;
