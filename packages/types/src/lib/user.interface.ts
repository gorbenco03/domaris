/**
 * 👤 USER INTERFACES - Conform ADR-001: Model de Cont Unificat
 *
 * IMPORTANT: Nu mai există "role" (OWNER/SEEKER)
 * Accesul este controlat de verificationLevel
 */

import type {
  VerificationLevel,
  AuthProvider,
  KycStatus,
} from './enums.js';

// ============================================================================
// CORE USER INTERFACE
// ============================================================================

/**
 * Interfața principală User conform ADR-001
 */
export interface IUser {
  id: string;
  email: string;
  phone?: string | null;

  // Profil
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;

  // Verificare (SINGURA "poartă" pentru acces - ADR-001)
  verificationLevel: VerificationLevel;
  emailVerified: boolean;
  phoneVerified: boolean;

  // Admin flag separat (nu e rol)
  isAdmin: boolean;

  // Auth providers linked
  authProviders: AuthProvider[];
  googleId?: string | null;
  appleId?: string | null;

  // Subscription
  hasActiveSubscription: boolean;
  subscriptionExpiresAt?: Date | string | null;

  // Statistici (calculated)
  activeListingsCount: number;
  rating: number;
  reviewsCount: number;

  // Preferințe notificări
  notificationPreferences: INotificationPreferences;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  lastActiveAt?: Date | string | null;
}

/**
 * Preferințe notificări utilizator
 */
export interface INotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;

  // Granular preferences
  newMessages: boolean;
  viewingReminders: boolean;
  priceDrops: boolean;
  newListingsAlerts: boolean;
}

/**
 * Preferințe notificări default
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: INotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  marketing: false,
  newMessages: true,
  viewingReminders: true,
  priceDrops: true,
  newListingsAlerts: true,
};

// ============================================================================
// USER DTOs (Data Transfer Objects)
// ============================================================================

/**
 * Date pentru crearea unui utilizator
 */
export interface ICreateUserDto {
  email: string;
  phone?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  authProvider: AuthProvider;
  googleId?: string;
  appleId?: string;
}

/**
 * Date pentru actualizarea profilului
 */
export interface IUpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  notificationPreferences?: Partial<INotificationPreferences>;
}

/**
 * User public profile (ce văd alții)
 */
export interface IPublicUserProfile {
  id: string;
  firstName: string;
  lastName: string; // Poate fi truncat pentru privacy
  avatar?: string | null;
  bio?: string | null;
  verificationLevel: VerificationLevel;
  rating: number;
  reviewsCount: number;
  activeListingsCount: number;
  memberSince: Date | string;
  isVerified: boolean; // verificationLevel >= 2
  badges: string[];
}

/**
 * User session data (ce primește clientul la login)
 */
export interface IUserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  verificationLevel: VerificationLevel;
  isAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasActiveSubscription: boolean;
}

// ============================================================================
// KYC (Know Your Customer)
// ============================================================================

/**
 * Status KYC utilizator
 */
export interface IUserKycStatus {
  userId: string;
  status: KycStatus;
  currentLevel: VerificationLevel;
  submittedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
  documents: IKycDocument[];
  canResubmit: boolean;
  expiresAt?: Date | string | null;
}

/**
 * Document KYC
 */
export interface IKycDocument {
  id: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: Date | string;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
}

// ============================================================================
// LEGACY SUPPORT (pentru compatibilitate în timpul migrării)
// ============================================================================

/**
 * @deprecated Folosește IUser în loc
 * Interfață veche pentru compatibilitate backwards
 */
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'tenant' | 'landlord' | 'admin';
  avatar?: string;
  bio?: string;
  location?: string;
  rating?: number;
  verificationLevel?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    marketing?: boolean;
  };
}

/**
 * @deprecated
 */
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}
