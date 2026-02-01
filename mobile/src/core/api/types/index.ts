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

export interface IRegisterPhoneRequest {
  phone: string;
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

export interface ILoginPhoneRequest {
  phone: string;
  password: string;
}

export interface IVerifyPhoneOtpRequest {
  phone: string;
  code: string;
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

