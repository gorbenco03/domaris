// src/db/enums.ts

// ============================================================================
// PROPERTY ENUMS
// ============================================================================


export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum NotificationType {
  NEW_MATCH = 'new_match',
  PRICE_DROP = 'price_drop',
  STATUS_CHANGE = 'status_change',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}
