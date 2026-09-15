import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

/**
 * Socket.IO client instance singleton.
 * Configured with reconnection strategies and credentials.
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Explicitly connect via hooks or lifecycle
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
