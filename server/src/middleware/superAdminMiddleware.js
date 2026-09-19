import ApiError from '../utils/ApiError.js';
import { PLATFORM_ROLES } from '../models/User.js';

/**
 * Superadmin authorization middleware.
 * Verifies that the authenticated user holds platformRole === 'SUPERADMIN'.
 * Independent of workspace membership and legacy roles.
 */
export const superAdminMiddleware = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required before checking platform privileges'));
  }

  if (req.user.platformRole !== PLATFORM_ROLES.SUPERADMIN) {
    return next(
      new ApiError(403, 'Forbidden: Requires SUPERADMIN platform privileges')
    );
  }

  next();
};

export default superAdminMiddleware;
