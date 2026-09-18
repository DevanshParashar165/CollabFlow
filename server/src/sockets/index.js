import { Server } from 'socket.io';
import environment from '../config/environment.js';
import logger from '../utils/logger.js';

let io = null;


export const initSocket = (httpServer) => {
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
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket first.');
  }
  return io;
};

export default {
  initSocket,
  getIO,
};
