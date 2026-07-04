/**
 * RIVA - Notifications API
 * Notifications and push tokens API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'MESSAGE'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_REMINDER' // NEW: 1h sau 1 zi înainte
  | 'VIEWING_CANCELLED'
  | 'NEW_PROPERTY_MATCH' // NEW: Saved search match
  | 'PROPERTY_STATUS_CHANGE'
  | 'FAVORITE_PRICE_DROP'
  | 'VERIFICATION_STATUS_CHANGE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SYSTEM_ANNOUNCEMENT';

export interface INotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // Metadata pentru navigation
  isRead: boolean;
  createdAt: string;
}

/**
 * Flat notification preferences shape returned by the backend at
 * GET/PUT /users/me/notification-preferences (notification.service normalizePreferences).
 */
export interface INotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newMessages: boolean;
  viewingUpdates: boolean;
  priceAlerts: boolean;
  newListings: boolean;
  marketingEmails: boolean;
}

export interface IRegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

// ============================================================================
// NOTIFICATIONS ENDPOINTS (Authenticated)
// ============================================================================

/**
 * Get all notifications for current user
 */
export const getNotifications = async (): Promise<INotification[]> => {
  const response = await apiClient.get<INotification[]>(
    API_ENDPOINTS.NOTIFICATIONS.LIST
  );
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  id: number
): Promise<{ success: boolean }> => {
  const response = await apiClient.patch<{ success: boolean }>(
    API_ENDPOINTS.NOTIFICATIONS.READ(String(id))
  );
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{
  success: boolean;
}> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.NOTIFICATIONS.READ_ALL
  );
  return response.data;
};

// ============================================================================
// PUSH TOKENS (for FCM/APNs)
// ============================================================================

/**
 * Register push notification token
 * Call this on app start after getting permission from user
 */
export const registerPushToken = async (
  data: IRegisterPushTokenRequest
): Promise<{ success: boolean }> => {
  const response = await apiClient.post<{ success: boolean }>(
    API_ENDPOINTS.DEVICES.REGISTER_PUSH_TOKEN,
    data
  );
  return response.data;
};

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get notification preferences
 */
export const getNotificationPreferences =
  async (): Promise<INotificationPreferences> => {
    // Backend exposes preferences only at /users/me/notification-preferences
    // (same route the PUT below uses). There is no GET /notifications/settings.
    const response = await apiClient.get<INotificationPreferences>(
      '/users/me/notification-preferences'
    );
    return response.data;
  };

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<INotificationPreferences>
): Promise<INotificationPreferences> => {
  const response = await apiClient.put<INotificationPreferences>(
    '/users/me/notification-preferences',
    preferences
  );
  return response.data;
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.isRead).length;
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = async (
  type: NotificationType
): Promise<INotification[]> => {
  const notifications = await getNotifications();
  return notifications.filter((n) => n.type === type);
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const notificationsApi = {
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getNotificationsByType,

  // Push Tokens
  registerPushToken,

  // Preferences
  getNotificationPreferences,
  updateNotificationPreferences,
};

export default notificationsApi;
