/**
 * 🔐 AUTH DTOs - Data Transfer Objects pentru Autentificare
 *
 * Conform ADR-001: Model de Cont Unificat
 * - Nu mai există selecție de rol la înregistrare
 * - Suport pentru phone login și OTP
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsNotEmpty,
} from 'class-validator';

// ============================================================================
// REGISTRATION DTOs
// ============================================================================

/**
 * Înregistrare cu email - Pas 1 (trimite OTP)
 * NOTE: Nu mai există userType/role conform ADR-001
 */
export class RegisterEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalid' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Parola trebuie să aibă minim 8 caractere' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Parola trebuie să conțină cel puțin o literă mare, una mică și o cifră',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'Ion' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Popescu' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

/**
 * Înregistrare cu email - Pas 2 (verificare OTP)
 */
export class VerifyEmailOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}


/**
 * Înregistrare cu telefon (trimite OTP)
 */
export class RegisterPhoneDto {
  @ApiProperty({ example: '+40712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Număr de telefon invalid' })
  phone!: string;

  @ApiPropertyOptional({ example: 'Ion' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Popescu' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

// ============================================================================
// LOGIN DTOs
// ============================================================================

/**
 * Login cu email și parolă
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalid' })
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Parola este obligatorie' })
  password!: string;
}

/**
 * Login cu telefon (trimite OTP)
 */
export class LoginPhoneDto {
  @ApiProperty({ example: '+40712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Număr de telefon invalid' })
  phone!: string;
}

/**
 * Verificare OTP telefon (pentru login sau verificare)
 */
export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '+40712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

// ============================================================================
// OAUTH DTOs
// ============================================================================

/**
 * Login cu Google
 */
export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID Token' })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

/**
 * Login cu Apple
 */
export class AppleAuthDto {
  @ApiProperty({ description: 'Apple Identity Token' })
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  @ApiPropertyOptional({ description: 'Authorization code (optional)' })
  @IsString()
  @IsOptional()
  authorizationCode?: string;

  @ApiPropertyOptional({ description: 'User full name (only on first login)' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'User email (only on first login)' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

// ============================================================================
// PASSWORD RESET DTOs
// ============================================================================

/**
 * Cerere reset parolă (trimite email)
 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email invalid' })
  email!: string;
}

/**
 * Verificare cod reset password
 */
export class VerifyResetCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

/**
 * Reset parolă cu cod
 */
export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Parola trebuie să aibă minim 8 caractere' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Parola trebuie să conțină cel puțin o literă mare, una mică și o cifră',
  })
  newPassword!: string;
}

/**
 * Schimbare parolă (utilizator autentificat)
 */
export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Parola trebuie să aibă minim 8 caractere' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Parola trebuie să conțină cel puțin o literă mare, una mică și o cifră',
  })
  newPassword!: string;
}

// ============================================================================
// EMAIL/PHONE VERIFICATION DTOs
// ============================================================================

/**
 * Trimitere cod verificare email
 */
export class SendEmailVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

/**
 * Verificare email cu cod
 */
export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

/**
 * Trimitere cod verificare telefon
 */
export class SendPhoneVerificationDto {
  @ApiProperty({ example: '+40712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Număr de telefon invalid' })
  phone!: string;
}

/**
 * Verificare telefon cu cod
 */
export class VerifyPhoneDto {
  @ApiProperty({ example: '+40712345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

// ============================================================================
// TOKEN DTOs
// ============================================================================

/**
 * Refresh access token
 */
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

/**
 * Logout (revoke token)
 */
export class LogoutDto {
  @ApiPropertyOptional({ description: 'Refresh token to revoke' })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Logout from all devices' })
  @IsOptional()
  allDevices?: boolean;
}

// ============================================================================
// RESPONSE DTOs (for Swagger documentation)
// ============================================================================

/**
 * Date utilizator în sesiune
 */
export class UserSessionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({ enum: [0, 1, 2, 3] })
  verificationLevel!: number;

  @ApiProperty()
  isAdmin!: boolean;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;

  @ApiProperty()
  hasActiveSubscription!: boolean;
}

/**
 * Răspuns autentificare
 */
export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  expiresIn!: number;

  @ApiProperty()
  user!: UserSessionDto;
}

/**
 * Răspuns OTP trimis
 */
export class OtpSentResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty({ description: 'Time until code expires (seconds)' })
  expiresIn!: number;

  @ApiPropertyOptional({ description: 'For testing only - not in production' })
  code?: string;
}
