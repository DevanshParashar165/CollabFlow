import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import commentRoutes from './commentRoutes.js';
import activityRoutes from './activityRoutes.js';

const router = express.Router();

// Mount foundational routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces', projectRoutes);
router.use('/workspaces', taskRoutes);
router.use('/workspaces', commentRoutes);
router.use('/workspaces', activityRoutes);
router.use('/superadmin', superAdminRoutes);

export default router;
