import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  testAdminRole,
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
} from '../validators/authValidators.js';
import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Public Authentication Routes
 */
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

/**
 * Authenticated User Route
 */
router.get('/me', authMiddleware, getMe);

/**
 * Role-Restricted Test Route (Requires OWNER or ADMIN role)
 */
router.get(
  '/admin-test',
  authMiddleware,
  authorizeRoles('OWNER', 'ADMIN'),
  testAdminRole
);

export default router;
