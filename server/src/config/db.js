import mongoose from 'mongoose';
import environment from './environment.js';
import logger from '../utils/logger.js';

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

export { connectDB };
export default connectDB;
