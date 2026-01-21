/**
 * 📊 API COMMON TYPES - Tipuri comune pentru răspunsuri API
 */

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Parametri paginare
 */
export interface IPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Meta paginare în răspuns
 */
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

/**
 * Răspuns paginat generic
 */
export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Răspuns API standard - succes
 */
export interface IApiResponse<T = any> {
  data: T;
  meta?: Record<string, any>;
}

/**
 * Răspuns API - eroare
 */
export interface IApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    validationErrors?: IValidationError[];
  };
}

/**
 * Eroare de validare per câmp
 */
export interface IValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Răspuns simplu - confirmare acțiune
 */
export interface ISuccessResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Coduri eroare standard
 */
export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Verification
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  PHONE_NOT_VERIFIED: 'PHONE_NOT_VERIFIED',
  KYC_REQUIRED: 'KYC_REQUIRED',
  KYC_PENDING: 'KYC_PENDING',
  KYC_REJECTED: 'KYC_REJECTED',
  
  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',
  
  // OTP
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS: 'OTP_TOO_MANY_ATTEMPTS',
  
  // Property
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  PROPERTY_NOT_ACTIVE: 'PROPERTY_NOT_ACTIVE',
  NOT_PROPERTY_OWNER: 'NOT_PROPERTY_OWNER',
  
  // Messaging
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  CANNOT_MESSAGE_SELF: 'CANNOT_MESSAGE_SELF',
  
  // Viewing
  VIEWING_NOT_FOUND: 'VIEWING_NOT_FOUND',
  VIEWING_ALREADY_CONFIRMED: 'VIEWING_ALREADY_CONFIRMED',
  VIEWING_ALREADY_CANCELLED: 'VIEWING_ALREADY_CANCELLED',
  
  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
