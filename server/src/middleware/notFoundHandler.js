/**
 * 404 Not Found middleware for unmatched routes.
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Resource not found - ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFoundHandler;
