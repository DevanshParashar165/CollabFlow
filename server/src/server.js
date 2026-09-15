require('dotenv').config();

const http = require('http');
const app = require('./app');
const environment = require('./config/environment');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');
const logger = require('./utils/logger');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start Server
const startServer = async () => {
  // Connect to Database
  await connectDB();

  server.listen(environment.port, () => {
    logger.info(`CollabFlow server running in ${environment.nodeEnv} mode on port ${environment.port}`);
    logger.info(`Health check available at http://localhost:${environment.port}/api/health`);
  });
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down CollabFlow server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if not closed
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
