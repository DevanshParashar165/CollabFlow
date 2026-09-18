import jwt from 'jsonwebtoken';
import environment from '../config/environment.js';

export const COOKIE_NAME = 'token';

/**
 * Generate signed JWT for authenticated user.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, environment.jwtSecret, {
    expiresIn: environment.jwtExpiresIn,
  });
};

/**
 * Verify and decode JWT token.
 * Throws JsonWebTokenError or TokenExpiredError if invalid.
 *

 */
export const verifyToken = (token) => {
  return jwt.verify(token, environment.jwtSecret);
};

/**
 * Cookie options adhering to security best practices.
 */
export const getCookieOptions = () => ({
  httpOnly: true, // Prevents client-side scripts from reading the cookie (mitigates XSS)
  secure: environment.isProduction, // In production, cookie is sent only over HTTPS
  sameSite: environment.isProduction ? 'strict' : 'lax', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/',
});

/**
 * Set HTTP-only JWT authentication cookie on Express response.

 */
export const sendTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

/**
 * Clear authentication cookie upon logout.
 */
export const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: environment.isProduction,
    sameSite: environment.isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

export default {
  COOKIE_NAME,
  generateToken,
  verifyToken,
  getCookieOptions,
  sendTokenCookie,
  clearTokenCookie,
};
