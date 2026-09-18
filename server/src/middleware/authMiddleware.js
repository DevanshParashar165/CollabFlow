import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';
import { getUserById } from '../services/authService.js';
import ApiError from '../utils/ApiError.js';

/**
 * Authentication middleware.
 * Intercepts incoming HTTP requests to verify the presence and validity
 * of the JWT stored inside the secure HTTP-only cookie.
 * Attaches the authenticated user to `req.user`.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Authentication session expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid authentication token.');
    }

    if (!decoded?.id) {
      throw new ApiError(401, 'Invalid token payload structure.');
    }

    // Load active user profile from database
    const user = await getUserById(decoded.id);

    // Attach authenticated user to request context for downstream handlers
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
