import api from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';


export const register = async (userData) => {
  const response = await api.post(API_ENDPOINTS.AUTH_REGISTER, userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post(API_ENDPOINTS.AUTH_LOGIN, credentials);
  return response.data;
};

/**
 * Sign out user by triggering server to clear the HTTP-only cookie.
 *
 */
export const logout = async () => {
  const response = await api.post(API_ENDPOINTS.AUTH_LOGOUT);
  return response.data;
};

/**
 * Fetch authenticated user profile using the HTTP-only cookie.
 *
 */
export const getMe = async () => {
  const response = await api.get(API_ENDPOINTS.AUTH_ME);
  return response.data;
};

/**
 * Test accessing the platform-role-restricted endpoint (SUPERADMIN only).
 *
 * @returns {Promise<object>}
 */
export const testAdminRole = async () => {
  const response = await api.get(API_ENDPOINTS.AUTH_ADMIN_TEST);
  return response.data;
};

export default {
  register,
  login,
  logout,
  getMe,
  testAdminRole,
};
