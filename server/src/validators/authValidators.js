import ApiError from '../utils/ApiError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates user registration payload.
 * Enforces field presence, length limits, and email formatting.
 * Registration never accepts a client-supplied platform role, preventing privilege escalation.
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new ApiError(400, 'Name must be at least 2 characters long'));
  }

  if (name.trim().length > 50) {
    return next(new ApiError(400, 'Name cannot exceed 50 characters'));
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return next(new ApiError(400, 'Please provide a valid email address'));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new ApiError(400, 'Password must be at least 6 characters long'));
  }

  next();
};

/**
 * Validates user login payload.
 * Ensures presence of both email and password credentials.
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return next(new ApiError(400, 'Please provide your email address'));
  }

  if (!password || typeof password !== 'string') {
    return next(new ApiError(400, 'Please provide your password'));
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
};
