/**
 * IMOBI - Auth API
 * Authentication API client functions
 */

import { apiClient } from '@/core/api/client';
import { API_ENDPOINTS } from '@/core/api/endpoints';
import type {
  ILoginEmailRequest,
  IRegisterEmailRequest,
  IRegisterPhoneRequest,
  ILoginPhoneRequest,
  IVerifyPhoneOtpRequest,
  IGoogleAuthRequest,
  IAppleAuthRequest,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IChangePasswordRequest,
  IVerifyEmailRequest,
  IVerifyPhoneRequest,
  IRefreshTokenRequest,
  ILogoutRequest,
  IAuthResponseData,
  IOtpSentResponse,
} from '@/core/api/types';

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register with email and password
 */
export const registerWithEmail = async (
  data: IRegisterEmailRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    API_ENDPOINTS.AUTH.REGISTER,
    data
  );
  return response.data;
};

/**
 * Register with phone (sends OTP)
 */
export const registerWithPhone = async (
  data: IRegisterPhoneRequest
): Promise<IOtpSentResponse> => {
  const response = await apiClient.post<IOtpSentResponse>(
    `${API_ENDPOINTS.AUTH.REGISTER}/phone`,
    data
  );
  return response.data;
};

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Login with email and password
 */
export const loginWithEmail = async (
  data: ILoginEmailRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    API_ENDPOINTS.AUTH.LOGIN,
    data
  );
  return response.data;
};

/**
 * Login with phone (sends OTP)
 */
export const loginWithPhone = async (
  data: ILoginPhoneRequest
): Promise<IOtpSentResponse> => {
  const response = await apiClient.post<IOtpSentResponse>(
    `${API_ENDPOINTS.AUTH.LOGIN}/phone`,
    data
  );
  return response.data;
};

/**
 * Verify phone OTP (completes login/register)
 */
export const verifyPhoneOtp = async (
  data: IVerifyPhoneOtpRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    API_ENDPOINTS.AUTH.VERIFY_OTP,
    data
  );
  return response.data;
};

// ============================================================================
// OAUTH
// ============================================================================

/**
 * Login with Google
 */
export const loginWithGoogle = async (
  data: IGoogleAuthRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    '/auth/oauth/google',
    data
  );
  return response.data;
};

/**
 * Login with Apple
 */
export const loginWithApple = async (
  data: IAppleAuthRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    '/auth/oauth/apple',
    data
  );
  return response.data;
};

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request password reset (sends email with code)
 */
export const forgotPassword = async (
  data: IForgotPasswordRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Reset password with code
 */
export const resetPassword = async (
  data: IResetPasswordRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    data
  );
  return response.data;
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (
  data: IChangePasswordRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/change-password',
    data
  );
  return response.data;
};

// ============================================================================
// EMAIL/PHONE VERIFICATION
// ============================================================================

/**
 * Send email verification code
 */
export const sendEmailVerification = async (
  email: string
): Promise<IOtpSentResponse> => {
  const response = await apiClient.post<IOtpSentResponse>(
    '/auth/send-email-verification',
    { email }
  );
  return response.data;
};

/**
 * Verify email with code
 */
export const verifyEmail = async (
  data: IVerifyEmailRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/verify-email',
    data
  );
  return response.data;
};

/**
 * Send phone verification code
 */
export const sendPhoneVerification = async (
  phone: string
): Promise<IOtpSentResponse> => {
  const response = await apiClient.post<IOtpSentResponse>(
    '/auth/send-phone-verification',
    { phone }
  );
  return response.data;
};

/**
 * Verify phone with code
 */
export const verifyPhone = async (
  data: IVerifyPhoneRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    '/auth/verify-phone',
    data
  );
  return response.data;
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Refresh access token
 */
export const refreshAccessToken = async (
  data: IRefreshTokenRequest
): Promise<IAuthResponseData> => {
  const response = await apiClient.post<IAuthResponseData>(
    API_ENDPOINTS.AUTH.REFRESH,
    data
  );
  return response.data;
};

/**
 * Logout (revoke refresh token)
 */
export const logout = async (
  data?: ILogoutRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.LOGOUT,
    data || {}
  );
  return response.data;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
  return response.data;
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const authApi = {
  // Registration
  registerWithEmail,
  registerWithPhone,

  // Login
  loginWithEmail,
  loginWithPhone,
  verifyPhoneOtp,

  // OAuth
  loginWithGoogle,
  loginWithApple,

  // Password
  forgotPassword,
  resetPassword,
  changePassword,

  // Verification
  sendEmailVerification,
  verifyEmail,
  sendPhoneVerification,
  verifyPhone,

  // Token
  refreshAccessToken,
  logout,
  getCurrentUser,
};

export default authApi;
