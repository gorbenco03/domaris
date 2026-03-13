/**
 * Notifications API
 * API functions for notifications, push tokens, and preferences
 */

import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'MESSAGE'
  | 'VIEWING_CONFIRMED'
  | 'VIEWING_REMINDER'
  | 'VIEWING_CANCELLED'
  | 'NEW_PROPERTY_MATCH'
  | 'PROPERTY_STATUS_CHANGE'
  | 'FAVORITE_PRICE_DROP'
  | 'VERIFICATION_STATUS_CHANGE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message?: string;
  body?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

/** Get notification display text (API may send message or body) */
export function getNotificationText(n: Notification): string {
  return n.message || n.body || '';
}

export interface NotificationPreferences {
  push: {
    messages: boolean;
    viewings: boolean;
    propertyUpdates: boolean;
    savedSearches: boolean;
    marketing: boolean;
  };
  email: {
    messages: boolean;
    viewings: boolean;
    propertyUpdates: boolean;
    savedSearches: boolean;
    newsletter: boolean;
  };
  sms: {
    viewings: boolean;
    urgent: boolean;
  };
}

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
}

// ============================================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================================

/**
 * Get all notifications for current user
 */
export async function getNotifications(): Promise<Notification[]> {
  const response = await api.fetch<Notification[] | { data: Notification[] }>('/notifications');
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: number): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>('/notifications/read-all', {
    method: 'POST',
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await api.fetch<{ count: number }>('/notifications/unread-count');
    return response?.count ?? 0;
  } catch {
    // Fallback: fetch all and count unread
    const notifications = await getNotifications();
    return notifications.filter(n => !n.isRead).length;
  }
}

// ============================================================================
// PUSH TOKENS
// ============================================================================

/**
 * Register push notification token for web
 */
export async function registerPushToken(data: RegisterPushTokenRequest): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>('/devices/push-token', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Unregister push token (on logout)
 */
export async function unregisterPushToken(deviceId: string): Promise<{ success: boolean }> {
  return api.fetch<{ success: boolean }>(`/devices/push-token/${deviceId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

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
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get notifications by type
 */
export async function getNotificationsByType(type: NotificationType): Promise<Notification[]> {
  const notifications = await getNotifications();
  return notifications.filter(n => n.type === type);
}

/**
 * Get only unread notifications
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.isRead);
}
