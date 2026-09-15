const { Server } = require('socket.io');
const environment = require('../config/environment');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO with HTTP server instance.
 * @param {import('http').Server} httpServer
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: environment.clientUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

/**
 * Get active Socket.IO server instance.
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
