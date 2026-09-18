/**
 * Lightweight operational API Error class.
 * Extends native Error with an HTTP statusCode property,
 * allowing Express route handlers to throw predictable errors
 * that are caught and formatted by the centralized errorHandler middleware.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
