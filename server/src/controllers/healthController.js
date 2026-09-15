/**
 * Health check controller.
 * Returns operational status, uptime, and timestamp.
 */
const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'CollabFlow API is healthy and operational',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
};

module.exports = {
  getHealth,
};
