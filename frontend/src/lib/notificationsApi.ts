/**
 * Notifications API
 * API functions for notifications, push tokens, and preferences
 */

import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Enum-ul legacy UPPERCASE — folosit de Navbar și alte componente vechi.
 * Tipurile reale emise de backend sunt lowercase (new_message, viewing_*, contract_*).
 * Câmpul Notification.type este `string` pentru a accepta ambele formate.
 */
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
  /**
   * Tipul notificării.
   * Valorile UPPERCASE sunt enum-ul legacy de frontend (MESSAGE, VIEWING_CONFIRMED, etc.).
   * La runtime, backend-ul poate trimite și tipuri lowercase (new_message, viewing_*, contract_*).
   * Folosiți normalizeNotificationType() pentru a normaliza înainte de a compara.
   */
  type: NotificationType;
  title: string;
  // Canonical body field (backend emits `body`, not `message`).
  body: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

/**
 * Normalizează tipul de notificare la un tip canonic lowercase pentru mapper.
 * Tratează atât tipurile UPPERCASE (enum vechi) cât și lowercase (backend real).
 */
export function normalizeNotificationType(type: string): string {
  return type.toLowerCase();
}

/** Notification display text (backend emits `body`). */
export function getNotificationText(n: Notification): string {
  return n.body || '';
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
 * Get unread notifications count.
 * There is no /notifications/unread-count route on the backend — the count is
 * derived client-side from GET /notifications (max 50).
 */
export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.isRead).length;
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
 * Get notifications by type (compară case-insensitiv)
 */
export async function getNotificationsByType(type: string): Promise<Notification[]> {
  const notifications = await getNotifications();
  const normalized = type.toLowerCase();
  return notifications.filter(n => n.type.toLowerCase() === normalized);
}

/**
 * Get only unread notifications
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.isRead);
}
