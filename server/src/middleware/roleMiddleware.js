import ApiError from '../utils/ApiError.js';

/**
 * Platform-level Role-Based Access Control (RBAC) middleware factory.
 * Enforces that the authenticated user possesses one of the authorized platform roles.
 *
 * Example usage:
 * router.get('/admin-test', authMiddleware, authorizePlatformRoles('SUPERADMIN'), controller);
 *
 * @param  {...string} allowedRoles - List of authorized platform role strings (e.g. 'SUPERADMIN')
 * @returns {import('express').RequestHandler}
 */
export const authorizePlatformRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions'));
    }

    if (!allowedRoles.includes(req.user.platformRole)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Platform role '${req.user.platformRole}' lacks permission to perform this action`
        )
      );
    }

    next();
  };
};

// Aliases for compatibility
export const authorizeRoles = authorizePlatformRoles;
export default authorizePlatformRoles;
