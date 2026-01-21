/**
 * 🔔 NOTIFICATION INTERFACES
 */

import type { NotificationType } from './enums.js';

// ============================================================================
// NOTIFICATION
// ============================================================================

/**
 * Notificare
 */
export interface INotification {
  id: string;
  userId: string;
  
  type: NotificationType;
  title: string;
  body: string;
  
  // Deep link
  action?: INotificationAction;
  
  // Metadata specific pe tip
  metadata?: Record<string, any>;
  
  // Status
  isRead: boolean;
  readAt?: Date | string;
  
  createdAt: Date | string;
}

/**
 * Acțiune notificare (deep link)
 */
export interface INotificationAction {
  type: 'NAVIGATE' | 'OPEN_URL' | 'NONE';
  screen?: string;
  params?: Record<string, any>;
  url?: string;
}

/**
 * Notificare în listă
 */
export interface INotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date | string;
  action?: INotificationAction;
  
  // Preview data based on type
  preview?: {
    image?: string;
    subtitle?: string;
  };
}

// ============================================================================
// PREFERENCES
// ============================================================================

/**
 * Preferințe notificări (detaliate)
 */
export interface INotificationPreferencesDetailed {
  // Canale
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Per category
  categories: {
    messages: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
    };
    viewings: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
    };
    listings: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
    };
    priceDrops: {
      enabled: boolean;
      channels: ('email' | 'push' | 'sms')[];
    };
    marketing: {
      enabled: boolean;
      channels: ('email')[];
    };
  };
  
  // Quiet hours
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;
    timezone: string;
  };
}

/**
 * Update preferences
 */
export interface IUpdateNotificationPreferencesDto {
  channels?: Partial<INotificationPreferencesDetailed['channels']>;
  categories?: Partial<INotificationPreferencesDetailed['categories']>;
  quietHours?: INotificationPreferencesDetailed['quietHours'];
}

// ============================================================================
// PUSH TOKEN
// ============================================================================

/**
 * Înregistrare push token
 */
export interface IRegisterPushTokenDto {
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceId: string;
}
