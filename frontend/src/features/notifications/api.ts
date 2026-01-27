import { apiClient } from '@/lib/client';
import type { Notification, NotificationPreferences } from './types';

export const notificationsApi = {
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<Notification[]> => {
    const response = await apiClient.get<{ data: Notification[] }>('/notifications', { params });
    return response.data.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/notifications/read-all');
    return response.data;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/notifications/${notificationId}`);
    return response.data;
  },
};
