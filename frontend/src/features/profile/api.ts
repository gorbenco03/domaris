import { apiClient } from '@/lib/client';
import type { IUser } from '@domaris/types';

// Profile update data - matching backend CompleteProfileDto
export interface IUpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  preferredLanguage?: string;
}

// Notification preferences - matching backend UpdateNotificationPreferencesDto
export interface INotificationPreferencesDto {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  newMessages?: boolean;
  viewingReminders?: boolean;
  priceAlerts?: boolean;
  marketingEmails?: boolean;
}

// Public profile response
export interface IPublicProfile {
  id: number;
  firstName: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  verificationLevel: number;
  memberSince: string;
  listingsCount: number;
  averageRating?: number;
  reviewsCount?: number;
}

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<IUser> => {
    const response = await apiClient.get<IUser>('/users/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: IUpdateProfileDto): Promise<IUser> => {
    const response = await apiClient.put<IUser>('/users/me', data);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.patch<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (data: INotificationPreferencesDto): Promise<{ success: boolean }> => {
    const response = await apiClient.patch('/users/me/notifications', data);
    return response.data;
  },

  // Request data export (GDPR)
  requestDataExport: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/users/me/export');
    return response.data;
  },

  // Delete account
  deleteAccount: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.delete('/users/me');
    return response.data;
  },

  // Get public profile
  getPublicProfile: async (userId: string): Promise<IPublicProfile> => {
    const response = await apiClient.get<IPublicProfile>(`/users/${userId}`);
    return response.data;
  },

  // Get user's public listings
  getUserListings: async (userId: string): Promise<unknown[]> => {
    const response = await apiClient.get(`/users/${userId}/listings`);
    return response.data;
  },
};
