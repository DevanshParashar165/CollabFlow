/**
 * CollabFlow client application constants.
 */

export const APP_NAME = 'CollabFlow';
export const APP_DESCRIPTION = 'Real-Time Collaborative Project Management Platform';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  NOT_FOUND: '*',
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  AUTH_ADMIN_TEST: '/auth/admin-test',
};
