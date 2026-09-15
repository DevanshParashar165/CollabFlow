/**
 * CollabFlow client application constants.
 */

export const APP_NAME = 'CollabFlow';
export const APP_DESCRIPTION = 'Real-Time Collaborative Project Management Platform';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ROUTES = {
  HOME: '/',
  NOT_FOUND: '*',
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
};
