import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

/**
 * Pre-configured Axios instance for CollabFlow API communication.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for logging / token injection
api.interceptors.request.use(
  (config) => {
    // Auth token will be attached here in authentication task
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

/**
 * Fetch health status of the backend API.
 */
export const checkApiHealth = async () => {
  const response = await api.get(API_ENDPOINTS.HEALTH);
  return response.data;
};

export default api;
