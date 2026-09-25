import api from '../../services/api.js';
import { API_ENDPOINTS } from '../../utils/constants.js';

export const listNotifications = async ({
  workspaceId,
  isRead,
  page = 1,
  limit = 20,
} = {}) => {
  const params = { page, limit };
  if (workspaceId) params.workspaceId = workspaceId;
  if (isRead !== undefined && isRead !== null && isRead !== '') {
    params.isRead = isRead;
  }
  const response = await api.get(API_ENDPOINTS.NOTIFICATIONS, { params });
  return response.data.data;
};

export const getUnreadCount = async (workspaceId) => {
  const params = {};
  if (workspaceId) params.workspaceId = workspaceId;
  const response = await api.get(API_ENDPOINTS.NOTIFICATION_UNREAD_COUNT, {
    params,
  });
  return response.data.data.unreadCount;
};

export const markAsRead = async (notificationId) => {
  const response = await api.patch(
    API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId)
  );
  return response.data.data.notification;
};

export const markAllAsRead = async (workspaceId) => {
  const response = await api.patch(
    API_ENDPOINTS.NOTIFICATION_MARK_ALL_READ,
    workspaceId ? { workspaceId } : {}
  );
  return response.data.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await api.delete(
    API_ENDPOINTS.NOTIFICATION_BY_ID(notificationId)
  );
  return response.data;
};

export default {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
