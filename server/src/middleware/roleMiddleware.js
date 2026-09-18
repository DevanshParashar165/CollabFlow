import ApiError from '../utils/ApiError.js';

/**
 * Reusable Role-Based Access Control (RBAC) middleware factory.
 * Enforces that the authenticated user possesses one of the authorized roles.
 *
 * Example usage:
 * router.delete('/resource', authMiddleware, authorizeRoles('OWNER', 'ADMIN'), controller);
 *
 * @param  {...string} allowedRoles - List of authorized role strings
 * @returns {import('express').RequestHandler}
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before checking permissions'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' lacks permission to perform this action`
        )
      );
    }

    next();
  };
};

export default authorizeRoles;
