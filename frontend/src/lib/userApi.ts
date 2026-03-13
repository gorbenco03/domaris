/**
 * RIVA - User/Profile API
 * User profile API client functions for Frontend
 */

import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  verificationLevel: number;
  isVerified: boolean;
  createdAt: string;
}

export interface PublicUserProfile {
  id: number;
  firstName: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  verificationLevel: number;
  rating: number;
  reviewsCount: number;
  memberSince: string;
  isVerified: boolean;
  badges: string[];
  activeListingsCount: number;
}

export interface UserListing {
  id: number;
  title: string;
  transactionType: string;
  propertyType: string;
  priceEur: number;
  city: string;
  neighborhood?: string;
  rooms: number;
  surfaceSqm: number;
  image?: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newMessages: boolean;
  viewingUpdates: boolean;
  priceAlerts: boolean;
  newListings: boolean;
  marketingEmails: boolean;
}

// ============================================================================
// PROFILE ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get current user profile
 */
export async function getCurrentProfile(): Promise<UserProfile> {
  return api.fetch<UserProfile>('/users/me');
}

/**
 * Update current user profile
 */
export async function updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
  return api.fetch<UserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  // Some backends expect 'file' instead of 'avatar'
  formData.append('file', file);
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/users/me/avatar`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('riva_access_token') || ''}`,
      },
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    console.error('Avatar upload failed:', response.status, error);
    throw { code: 'UPLOAD_ERROR', message: error.message || `Upload failed (${response.status})` };
  }
  
  const data = await response.json();
  // Backend may return { avatarUrl }, { avatar }, { url }, or { user: { avatar } }
  const avatarUrl = data.avatarUrl || data.avatar || data.url || data.user?.avatar || '';
  return { avatarUrl };
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>('/users/me/avatar', {
    method: 'DELETE',
  });
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return api.fetch<NotificationPreferences>('/users/me/notification-preferences');
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return api.fetch<NotificationPreferences>('/users/me/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

// ============================================================================
// PUBLIC PROFILE
// ============================================================================

/**
 * Get public user profile
 */
export async function getPublicProfile(userId: string | number): Promise<PublicUserProfile> {
  return api.fetch<PublicUserProfile>(`/users/${userId}`);
}

/**
 * Get public listings for a user
 */
export async function getUserListings(userId: string | number): Promise<UserListing[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await api.fetch<any>(`/users/${userId}/listings`);
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const userApi = {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  getNotificationPreferences,
  updateNotificationPreferences,
  getPublicProfile,
  getUserListings,
};

export default userApi;
