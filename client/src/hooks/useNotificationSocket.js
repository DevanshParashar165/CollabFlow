import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socket, connectSocket } from '../socket/socket';
import {
  notificationReceivedFromSocket,
  unreadCountUpdatedFromSocket,
  fetchNotifications,
  fetchUnreadCount,
  resetNotifications,
} from '../features/notifications/notificationSlice';

export default function useNotificationSocket() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const userId = user?._id?.toString?.() || user?._id;

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined;

    // Fetch initial notifications and badge count on authenticated load
    dispatch(fetchUnreadCount());
    dispatch(fetchNotifications({ page: 1, limit: 20 }));

    const onNotificationNew = (payload) => {
      dispatch(notificationReceivedFromSocket(payload));
    };

    const onUnreadCount = (payload) => {
      dispatch(unreadCountUpdatedFromSocket(payload));
    };

    // Ensure single shared socket is connected
    if (!socket.connected) {
      connectSocket();
    }

    // Bind listeners for real-time notification events
    socket.on('notification:new', onNotificationNew);
    socket.on('notification:unreadCount', onUnreadCount);

    return () => {
      socket.off('notification:new', onNotificationNew);
      socket.off('notification:unreadCount', onUnreadCount);
      dispatch(resetNotifications());
    };
  }, [dispatch, isAuthenticated, userId]);
}
