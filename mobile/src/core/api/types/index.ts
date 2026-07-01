/**
 * RIVA - API Types
 * Re-exports from @domaris/types for mobile app
 */

// ============================================
// AI TYPES
// ============================================
export type {
  IAIMessage,
  IAIUserPreferences,
  IAIContextOptions,
  IAIChatRequest,
  IAIChatResponse,
  IAIGenerateDescriptionRequest,
  IAIGenerateDescriptionResponse,
  IAIPropertyAnalysis,
  IAIPropertySummary,
  IAIRecommendation,
  IAIPriceEstimateRequest,
  IAIPriceEstimateResponse,
} from '@domaris/types';

// ============================================
// PROPERTY TYPES
// ============================================
export type {
  IProperty,
  IPropertyListItem,
  IPropertySearchParams,
  IPropertySearchResult,
} from '@domaris/types';

import type { IPropertyListItem } from '@domaris/types';

/**
 * Extended property list item with additional backend fields
 * used by mobile screens (legacy / flattened API response shape).
 */
export interface IPropertyListItemExtended extends IPropertyListItem {
  // Flattened characteristics
  surfaceSqm?: number;
  surface?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  balconies?: number;
  amenities?: string[];
  parkingType?: string;
  parkingSpots?: number;

  // Price fields
  priceEur?: number;
  isNegotiable?: boolean;

  // Address / location
  addressText?: string;
  address?: {
    street?: string;
    number?: string;
    building?: string;
    apartment?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Media
  images?: Array<{ id: string | number; url: string; isPrimary?: boolean; caption?: string }>;
  photos?: Array<{ id: string | number; url: string; isPrimary?: boolean; caption?: string }>;

  // Extended data
  description?: string;
  ownershipStatus?: string;
  user?: {
    id: string | number;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isVerified?: boolean;
    phone?: string;
  };
}

// ============================================
// SEARCH TYPES
// ============================================
export type {
  ISavedSearch,
} from '@domaris/types';

// ============================================
// NOTIFICATION TYPES
// ============================================
export type {
  INotification,
  INotificationPreferences,
} from '@domaris/types';

// ============================================
// USER & AUTH TYPES
// ============================================
export type {
  IUser,
  IUserSession,
} from '@domaris/types';

import type { IUserSession } from '@domaris/types';

// Sprint 1: Extended profile types
export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  phone?: string;
  // Extended address fields
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  // Social links
  socialLinks?: Record<string, string>;
}

export interface IUpdateProfileResponse {
  success: boolean;
  user: IUserSession;
}

// Sprint 1: Notification preferences with quiet hours
export interface IUpdateNotificationPreferencesRequest {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  marketing?: boolean;
  newMessages?: boolean;
  viewingReminders?: boolean;
  priceDrops?: boolean;
  newListingsAlerts?: boolean;
  quietHoursEnabled?: boolean;
}

export interface IUpdateNotificationPreferencesResponse {
  success: boolean;
  notificationPreferences: any; // Temporarily use any until INotificationPreferences is properly exported
}

// Sprint 1: Quiet hours
export interface IUpdateQuietHoursRequest {
  start?: string; // HH:mm format
  end?: string;   // HH:mm format
}

export interface IUpdateQuietHoursResponse {
  success: boolean;
  quietHours: {
    start: string;
    end: string;
  };
}

// Additional auth types based on backend DTOs
export interface ILoginEmailRequest {
  email: string;
  password: string;
}

export interface IRegisterEmailRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  /** GDPR: mandatory */
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptGdpr: boolean;
  /** GDPR: optional */
  acceptMarketing?: boolean;
  acceptAnalytics?: boolean;
}

export interface IGoogleAuthRequest {
  idToken: string;
}

export interface IAppleAuthRequest {
  identityToken: string;
  authorizationCode?: string;
  fullName?: string;
  email?: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface IVerifyEmailRequest {
  email: string;
  code: string;
}

export interface IVerifyEmailOtpRequest {
  email: string;
  code: string;
}

export interface IVerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface ILogoutRequest {
  refreshToken?: string;
  allDevices?: boolean;
}

export interface IAuthResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUserSession;
}


export interface IOtpSentResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  code?: string; // Only in development
}

// ============================================
// FAVORITE TYPES
// ============================================
export type {
  IFavorite,
} from '@domaris/types';

// ============================================
// VIEWING TYPES
// ============================================
export type {
  IViewing,
} from '@domaris/types';

// ============================================
// MESSAGE TYPES
// ============================================
export type {
  IMessage,
  IConversation,
  IConversationListItem,
  ISendMessageDto,
  ICreateConversationDto,
} from '@domaris/types';

// ============================================
// COMMON TYPES
// ============================================
export type {
  IPaginatedResponse,
  IApiError,
} from '@domaris/types';

