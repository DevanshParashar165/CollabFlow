/**
 * Centralized environment configuration.
 * Validates and exposes environment variables with safe development defaults.
 */
const environment = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/collabflow',
  jwtSecret: process.env.JWT_SECRET || 'collabflow-default-development-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = environment;
