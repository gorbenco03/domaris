/**
 * IMOBI - API Types
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
  IAIRecommendation,
  IAIPriceEstimateRequest,
  IAIPriceEstimateResponse,
} from '@domaris/types';

// ============================================
// PROPERTY TYPES
// ============================================
export type {
  IPropertyListing,
  IPropertySearchParams,
  IPropertyFilters,
} from '@domaris/types';

// ============================================
// SEARCH TYPES
// ============================================
export type {
  ISavedSearch,
  ISearchResult,
} from '@domaris/types';

// ============================================
// NOTIFICATION TYPES
// ============================================
export type {
  INotification,
  INotificationSettings,
} from '@domaris/types';

// ============================================
// USER & AUTH TYPES
// ============================================
export type {
  IUser,
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
} from '@domaris/types';

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
}

export interface IRegisterPhoneRequest {
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface ILoginPhoneRequest {
  phone: string;
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

export interface IUserSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  verificationLevel: number; // 0-3
  isAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasActiveSubscription: boolean;
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
  IViewingRequest,
} from '@domaris/types';

// ============================================
// MESSAGE TYPES
// ============================================
export type {
  IMessage,
  IConversation,
} from '@domaris/types';

// ============================================
// COMMON TYPES
// ============================================
export type {
  IPaginatedResponse,
  IApiError,
} from '@domaris/types';
