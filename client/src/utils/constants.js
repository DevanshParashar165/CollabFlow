/**
 * CollabFlow client application constants.
 */

export const APP_NAME = 'CollabFlow';
export const APP_DESCRIPTION = 'Real-Time Collaborative Project Management Platform';

export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  WORKSPACES: '/workspaces',
  WORKSPACE_DETAIL: '/workspaces/:workspaceId',
  SUPERADMIN: '/superadmin',
  SUPERADMIN_USERS: '/superadmin/users',
  SUPERADMIN_WORKSPACES: '/superadmin/workspaces',
  NOT_FOUND: '*',
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  AUTH_ADMIN_TEST: '/auth/admin-test',
  WORKSPACES: '/workspaces',
  WORKSPACE_BY_ID: (id) => `/workspaces/${id}`,
  WORKSPACE_MEMBERS: (id) => `/workspaces/${id}/members`,
  WORKSPACE_MEMBER_BY_ID: (workspaceId, userId) => `/workspaces/${workspaceId}/members/${userId}`,
  PROJECTS: (workspaceId) => `/workspaces/${workspaceId}/projects`,
  PROJECT_BY_ID: (workspaceId, projectId) => `/workspaces/${workspaceId}/projects/${projectId}`,
  TASKS: (workspaceId, projectId) => `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
  TASK_BY_ID: (workspaceId, projectId, taskId) => `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
  COMMENTS: (workspaceId, taskId) => `/workspaces/${workspaceId}/tasks/${taskId}/comments`,
  COMMENT_BY_ID: (workspaceId, taskId, commentId) => `/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`,
  TASK_ACTIVITY: (workspaceId, taskId) => `/workspaces/${workspaceId}/tasks/${taskId}/activity`,
  SUPERADMIN_USERS: '/superadmin/users',
  SUPERADMIN_WORKSPACES: '/superadmin/workspaces',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATION_MARK_READ: (id) => `/notifications/${id}/read`,
  NOTIFICATION_MARK_ALL_READ: '/notifications/read-all',
  NOTIFICATION_BY_ID: (id) => `/notifications/${id}`,
};
