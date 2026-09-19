import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import superAdminRoutes from './superAdminRoutes.js';

const router = express.Router();

// Mount foundational routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/superadmin', superAdminRoutes);

export default router;
