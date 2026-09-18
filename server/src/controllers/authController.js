import authService from '../services/authService.js';
import { generateToken, sendTokenCookie, clearTokenCookie } from '../utils/jwt.js';

/**
 * Handle new user registration.
 * Creates user, generates JWT, attaches HTTP-only cookie, and returns sanitized profile.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser({ name, email, password });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      status: 'success',
      message: 'Account registered successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user authentication and login.
 * Validates credentials, sets HTTP-only cookie, and returns profile.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser({ email, password });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user logout.
 * Clears the HTTP-only cookie.
 */
export const logout = (req, res) => {
  clearTokenCookie(res);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Retrieve profile of currently authenticated user.
 */
export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
};

/**
 * Verification endpoint protected by roleMiddleware (OWNER / ADMIN only).
 */
export const testAdminRole = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Authorized: You have accessed a role-restricted endpoint.',
    data: {
      userId: req.user._id,
      role: req.user.role,
    },
  });
};

export default {
  register,
  login,
  logout,
  getMe,
  testAdminRole,
};
