/**
 * IMOBI - API Client Configuration
 * Axios client with interceptors for auth and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/constants';
import { tokenManager } from '@/core/auth/tokenManager';
import { getAnonymousId } from '@/core/analytics/anonymousId';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenManager.getAccessToken();
    const anonymousId = await getAnonymousId();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (anonymousId) {
      config.headers['X-Anonymous-Id'] = anonymousId;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshed = await tokenManager.refreshTokens();
        
        if (refreshed) {
          const newToken = await tokenManager.getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await tokenManager.clearTokens();
        // TODO: Navigate to login screen
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
