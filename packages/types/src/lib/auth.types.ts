/**
 * 🔐 AUTH TYPES - Tipuri pentru autentificare și înregistrare
 *
 * Conform ADR-001: Model de Cont Unificat
 * Flow simplificat fără selecție de rol
 */

import type { IUserSession } from './user.interface.js';

// ============================================================================
// AUTH RESPONSES
// ============================================================================

/**
 * Răspuns la login/register
 */
export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: IUserSession;
}

/**
 * Răspuns la refresh token
 */
export interface IRefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// ============================================================================
// REGISTRATION DTOs
// ============================================================================

/**
 * Înregistrare cu email și parolă
 */
export interface IRegisterEmailDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Înregistrare cu telefon
 */
export interface IRegisterPhoneDto {
  phone: string;
  firstName?: string;
  lastName?: string;
}

// ============================================================================
// LOGIN DTOs
// ============================================================================

/**
 * Login cu email și parolă
 */
export interface ILoginEmailDto {
  email: string;
  password: string;
}

/**
 * Login cu telefon (trimite OTP)
 */
export interface ILoginPhoneDto {
  phone: string;
}

/**
 * Verificare OTP telefon
 */
export interface IVerifyPhoneOtpDto {
  phone: string;
  code: string;
}

/**
 * Login cu Google
 */
export interface IGoogleAuthDto {
  idToken: string;
}

/**
 * Login cu Apple
 */
export interface IAppleAuthDto {
  identityToken: string;
  authorizationCode?: string;
  fullName?: string;
  email?: string;
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request reset password
 */
export interface IForgotPasswordDto {
  email: string;
}

/**
 * Verificare cod reset password
 */
export interface IVerifyResetCodeDto {
  email: string;
  code: string;
}

/**
 * Reset password cu cod
 */
export interface IResetPasswordDto {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * Schimbare parolă (utilizator autentificat)
 */
export interface IChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// EMAIL/PHONE VERIFICATION
// ============================================================================

/**
 * Trimitere cod verificare email
 */
export interface ISendEmailVerificationDto {
  email: string;
}

/**
 * Verificare email cu cod
 */
export interface IVerifyEmailDto {
  email: string;
  code: string;
}

/**
 * Trimitere cod verificare telefon
 */
export interface ISendPhoneVerificationDto {
  phone: string;
}

/**
 * Verificare telefon cu cod
 */
export interface IVerifyPhoneDto {
  phone: string;
  code: string;
}

// ============================================================================
// TOKEN TYPES
// ============================================================================

/**
 * Payload JWT
 */
export interface IJwtPayload {
  sub: string; // user id
  email: string;
  verificationLevel: number;
  isAdmin: boolean;
  iat: number;
  exp: number;
  jti?: string;
  aud?: string;
  iss?: string;
}

/**
 * Refresh token stored
 */
export interface IRefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
  deviceId?: string;
  userAgent?: string;
  createdAt: Date;
  isRevoked: boolean;
}

// ============================================================================
// DEVICE & SESSION
// ============================================================================

/**
 * Informații despre device pentru push notifications
 */
export interface IDeviceInfo {
  deviceId: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  pushToken?: string;
  appVersion?: string;
  osVersion?: string;
  deviceModel?: string;
}

/**
 * Sesiune activă utilizator
 */
export interface IUserSessionInfo {
  id: string;
  deviceId?: string;
  platform?: string;
  lastActiveAt: Date | string;
  createdAt: Date | string;
  ipAddress?: string;
  userAgent?: string;
  isCurrent: boolean;
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * @deprecated Folosește IAuthResponse
 */
export interface LoginResponse {
  accessToken: string;
  user: any;
}

/**
 * @deprecated Folosește IRegisterEmailDto
 */
export interface RegisterDto {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'tenant' | 'landlord';
}

/**
 * @deprecated Folosește ILoginEmailDto
 */
export interface LoginDto {
  email: string;
  password?: string;
}
