/**
 * RIVA - User API Service
 * Handles profile and notification settings API calls
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type {
  IUpdateProfileRequest,
  IUpdateProfileResponse,
  IUpdateNotificationPreferencesRequest,
  IUpdateNotificationPreferencesResponse,
  IUpdateQuietHoursRequest,
  IUpdateQuietHoursResponse,
  IUserSession,
} from './types';

// ============================================
// PROFILE API
// ============================================

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<IUserSession> => {
  const response = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
  return response.data;
};

/**
 * Update current user profile - Sprint 1 extended
 */
export const updateProfile = async (
  data: IUpdateProfileRequest
): Promise<IUpdateProfileResponse> => {
  const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
  return response.data;
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File): Promise<{ success: boolean; avatar: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.patch(API_ENDPOINTS.USERS.UPLOAD_AVATAR, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// ============================================
// NOTIFICATION SETTINGS API
// ============================================

/**
 * Update notification preferences - Sprint 1 extended
 */
export const updateNotificationPreferences = async (
  data: IUpdateNotificationPreferencesRequest
): Promise<IUpdateNotificationPreferencesResponse> => {
  const response = await apiClient.patch(API_ENDPOINTS.USERS.NOTIFICATIONS_SETTINGS, data);
  return response.data;
};

/**
 * Update quiet hours settings - Sprint 1
 */
export const updateQuietHours = async (
  data: IUpdateQuietHoursRequest
): Promise<IUpdateQuietHoursResponse> => {
  const response = await apiClient.patch(API_ENDPOINTS.USERS.QUIET_HOURS, data);
  return response.data;
};

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE_ACCOUNT);
  return response.data;
};

/**
 * Change password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// ============================================
// PUBLIC PROFILE
// ============================================

/**
 * Get public user profile
 */
export const getPublicProfile = async (userId: string): Promise<any> => {
  const response = await apiClient.get(API_ENDPOINTS.USERS.PUBLIC_PROFILE(userId));
  return response.data;
};

/**
 * Get user's public listings
 */
export const getUserListings = async (userId: string): Promise<any[]> => {
  const response = await apiClient.get(API_ENDPOINTS.USERS.USER_LISTINGS(userId));
  return response.data;
};
