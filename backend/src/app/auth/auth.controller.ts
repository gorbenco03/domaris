/**
 * 🔐 AUTH CONTROLLER - Conform ADR-001: Model de Cont Unificat
 *
 * API Endpoints pentru autentificare:
 * - POST /auth/register - Înregistrare email/parolă
 * - POST /auth/register/phone - Înregistrare telefon (trimite OTP)
 * - POST /auth/login - Login email/parolă
 * - POST /auth/login/phone - Login telefon (trimite OTP)
 * - POST /auth/verify-phone-otp - Verificare OTP (finalizează login/register)
 * - POST /auth/oauth/google - Login Google
 * - POST /auth/oauth/apple - Login Apple
 * - POST /auth/forgot-password - Cerere reset parolă
 * - POST /auth/reset-password - Reset parolă cu cod
 * - POST /auth/verify-email - Verificare email cu cod
 * - POST /auth/verify-phone - Verificare telefon cu cod
 * - POST /auth/send-email-verification - Trimitere cod verificare email
 * - POST /auth/send-phone-verification - Trimitere cod verificare telefon
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout
 * - POST /auth/change-password - Schimbare parolă (autentificat)
 */

import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterEmailDto,
  VerifyEmailOtpDto,
  RegisterPhoneDto,
  LoginDto,
  LoginPhoneDto,
  VerifyPhoneOtpDto,
  GoogleAuthDto,
  AppleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
  SendEmailVerificationDto,
  SendPhoneVerificationDto,
  RefreshTokenDto,
  LogoutDto,
  AuthResponseDto,
  OtpSentResponseDto,
} from './dto/auth.dto';
import { Public, CurrentUserId } from '../core/decorators';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register with email (sends OTP)' })
  @ApiResponse({ status: 200, description: 'OTP sent', type: OtpSentResponseDto })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: RegisterEmailDto) {
    return this.authService.registerEmail(body);
  }

  @Public()
  @Post('verify-email-otp')
  @ApiOperation({ summary: 'Verify email OTP (completes register)' })
  @ApiResponse({ status: 200, description: 'JWT tokens', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @HttpCode(HttpStatus.OK)
  async verifyEmailOtp(@Body() body: VerifyEmailOtpDto) {
    return this.authService.verifyEmailOtp(body);
  }


  @Public()
  @Post('register/phone')
  @ApiOperation({ summary: 'Register with phone (sends OTP)' })
  @ApiResponse({ status: 200, description: 'OTP sent', type: OtpSentResponseDto })
  @ApiResponse({ status: 400, description: 'Phone already exists' })
  @HttpCode(HttpStatus.OK)
  async registerPhone(@Body() body: RegisterPhoneDto) {
    return this.authService.registerPhone(body);
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'JWT tokens', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('login/phone')
  @ApiOperation({ summary: 'Login with phone (sends OTP)' })
  @ApiResponse({ status: 200, description: 'OTP sent', type: OtpSentResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  async loginPhone(@Body() body: LoginPhoneDto) {
    return this.authService.loginPhone(body);
  }

  @Public()
  @Post('verify-phone-otp')
  @ApiOperation({ summary: 'Verify phone OTP (completes login/register)' })
  @ApiResponse({ status: 200, description: 'JWT tokens', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @HttpCode(HttpStatus.OK)
  async verifyPhoneOtp(@Body() body: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneOtp(body);
  }

  // ============================================================================
  // OAUTH
  // ============================================================================

  @Public()
  @Post('oauth/google')
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({ status: 200, description: 'JWT tokens', type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() body: GoogleAuthDto) {
    return this.authService.googleLogin(body.idToken);
  }

  @Public()
  @Post('oauth/apple')
  @ApiOperation({ summary: 'Login with Apple' })
  @ApiResponse({ status: 200, description: 'JWT tokens', type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  async appleAuth(@Body() body: AppleAuthDto) {
    return this.authService.appleLogin(body);
  }

  // ============================================================================
  // PASSWORD RESET
  // ============================================================================

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset code sent (if email exists)' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with code' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, body);
  }

  // ============================================================================
  // EMAIL/PHONE VERIFICATION
  // ============================================================================

  @Post('send-email-verification')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @HttpCode(HttpStatus.OK)
  async sendEmailVerification(@Body() body: SendEmailVerificationDto) {
    return this.authService.sendEmailVerificationCode(body.email);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }

  @Post('send-phone-verification')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send phone verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @HttpCode(HttpStatus.OK)
  async sendPhoneVerification(@Body() body: SendPhoneVerificationDto) {
    return this.authService.sendPhoneVerificationCode(body.phone);
  }

  @Public()
  @Post('verify-phone')
  @ApiOperation({ summary: 'Verify phone with code' })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @HttpCode(HttpStatus.OK)
  async verifyPhone(@Body() body: VerifyPhoneDto) {
    return this.authService.verifyPhone(body);
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUserId() userId: string,
    @Body() body: LogoutDto,
  ) {
    return this.authService.logout(body.refreshToken, userId, body.allDevices);
  }
}
