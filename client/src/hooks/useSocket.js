import { useEffect, useState } from 'react';
import { socket } from '../socket/socket';

/**
 * Custom hook to interact with the Socket.IO client instance.
 * Automatically tracks connection status.
 */
export const useSocket = (autoConnect = false) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (autoConnect && !socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (autoConnect) {
        socket.disconnect();
      }
    };
  }, [autoConnect]);

  return {
    socket,
    isConnected,
    connect: () => socket.connect(),
    disconnect: () => socket.disconnect(),
  };
};

export default useSocket;
