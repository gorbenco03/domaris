// src/db/enums.ts
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  UNDER_MAINTENANCE = 'under_maintenance',
  UNKNOWN = 'unknown',
}

export enum PropertyType {
  STUDIO = 'studio',
  ONE_BED = 'one_bed',
  TWO_BED = 'two_bed',
  THREE_PLUS = 'three_plus',
  HOUSE = 'house',
  OTHER = 'other',
}

export enum ListingSourceType {
  FACEBOOK = 'facebook',
  OLX = 'olx',
  IMOBILIARE = 'imobiliare',
  MANUAL = 'manual',
  OTHER = 'other',
}

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
