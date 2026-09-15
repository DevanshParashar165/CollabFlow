const mongoose = require('mongoose');
const environment = require('./environment');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database using Mongoose.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(environment.mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    // Do not exit process in development to allow server to start for non-DB endpoints (e.g. /api/health)
    if (environment.isProduction) {
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

module.exports = connectDB;
