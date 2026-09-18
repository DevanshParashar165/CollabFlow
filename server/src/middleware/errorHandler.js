import environment from '../config/environment.js';
import logger from '../utils/logger.js';

/**
 * Global centralized error handler.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(environment.isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
