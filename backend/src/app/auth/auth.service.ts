/**
 * 🔐 AUTH SERVICE - Conform ADR-001: Model de Cont Unificat
 *
 * Serviciu de autentificare cu suport pentru:
 * - Email/Password login & register
 * - Phone/OTP login & register
 * - Google OAuth
 * - Apple OAuth
 * - Password reset flow
 * - Email/Phone verification
 */

import { extractHeaderToken, genHex, getJti } from '../core/helper';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { jwtVerify, SignJWT } from 'jose';
import { User } from '../db/entities/user.entity.js';
import { type AuthModuleOptions } from './auth.module.js';
import {
  RegisterDto,
  RegisterPhoneDto,
  LoginDto,
  LoginPhoneDto,
  VerifyPhoneOtpDto,
  AppleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { EmailService } from '../core/email/email.service';
import { SmsService } from '../core/sms/sms.service';

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    @Inject('AUTH_OPTIONS') private readonly options: AuthModuleOptions,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  // ============================================================================
  // EMAIL/PASSWORD AUTH
  // ============================================================================

  /**
   * Înregistrare cu email și parolă
   * ADR-001: Nu mai setăm role, verificationLevel începe de la 0
   */
  async register(data: RegisterDto) {
    try {
      console.log('📝 Register attempt for:', data.email);

      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new BadRequestException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Un cont cu acest email există deja',
        });
      }

      console.log('✅ Email not taken, creating user...');

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await User.create({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        verificationLevel: 0,
        emailVerified: false,
        phoneVerified: false,
        isAdmin: false,
      });

      console.log('✅ User created with ID:', user.id);

      // Send verification email (async)
      this.sendEmailVerificationCode(data.email).catch(console.error);

      // Auto-login after register
      console.log('🔐 Generating auth response...');
      const response = await this.createAuthResponse(user);
      console.log('✅ Auth response generated successfully');

      return response;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  }

  /**
   * Validare credențiale
   */
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  /**
   * Login cu email și parolă
   */
  async login(user: User) {
    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    return this.createAuthResponse(user);
  }

  // ============================================================================
  // PHONE/OTP AUTH
  // ============================================================================

  /**
   * Înregistrare cu telefon (pasul 1 - trimite OTP)
   */
  async registerPhone(data: RegisterPhoneDto) {
    const existingUser = await User.findOne({ where: { phone: data.phone } });
    if (existingUser) {
      throw new BadRequestException({
        code: 'PHONE_ALREADY_EXISTS',
        message: 'Un cont cu acest număr de telefon există deja',
      });
    }

    // Store pending registration data
    const pendingKey = `pending_register:${data.phone}`;
    await this.redisClient.setex(
      pendingKey,
      OTP_EXPIRY_SECONDS,
      JSON.stringify({
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    );

    return this.sendPhoneOtp(data.phone);
  }

  /**
   * Login cu telefon (trimite OTP)
   */
  async loginPhone(data: LoginPhoneDto) {
    const user = await User.findOne({ where: { phone: data.phone } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Nu există un cont cu acest număr de telefon',
      });
    }

    return this.sendPhoneOtp(data.phone);
  }

  /**
   * Verificare OTP telefon (finalizare login/register)
   */
  async verifyPhoneOtp(data: VerifyPhoneOtpDto) {
    const isValid = await this.verifyOtp(`phone:${data.phone}`, data.code);
    if (!isValid) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Cod invalid sau expirat',
      });
    }

    // Check if this is a registration or login
    const pendingKey = `pending_register:${data.phone}`;
    const pendingData = await this.redisClient.get(pendingKey);

    let user: User;

    if (pendingData) {
      // This is a registration
      const { firstName, lastName } = JSON.parse(pendingData);

      user = await User.create({
        phone: data.phone,
        firstName,
        lastName,
        verificationLevel: 1, // ADR-001: Phone verified = level 1
        phoneVerified: true,
        emailVerified: false,
        isAdmin: false,
      });

      // Clean up pending data
      await this.redisClient.del(pendingKey);
    } else {
      // This is a login
      const existingUser = await User.findOne({ where: { phone: data.phone } });
      if (!existingUser) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'Utilizator negăsit',
        });
      }

      // Ensure phone is verified
      if (!existingUser.phoneVerified) {
        existingUser.phoneVerified = true;
        if (existingUser.verificationLevel < 1) {
          existingUser.verificationLevel = 1;
        }
        await existingUser.save();
      }

      user = existingUser;
    }

    user.lastActiveAt = new Date();
    await user.save();

    return this.createAuthResponse(user);
  }

  // ============================================================================
  // OAUTH
  // ============================================================================

  /**
   * Login cu Google
   */
  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid Google Token');

      const { email, sub: googleId, given_name, family_name } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user - ADR-001: No role selection
        user = await User.create({
          email,
          googleId,
          firstName: given_name,
          lastName: family_name,
          verificationLevel: 1, // Google verified = level 1
          emailVerified: true, // Google confirms email
          phoneVerified: false,
          isAdmin: false,
        });
      } else if (!user.googleId) {
        // Link existing account
        user.googleId = googleId;
        if (!user.emailVerified) {
          user.emailVerified = true;
          if (user.verificationLevel < 1) {
            user.verificationLevel = 1;
          }
        }
        await user.save();
      }

      user.lastActiveAt = new Date();
      await user.save();

      return this.createAuthResponse(user);
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  /**
   * Login cu Apple
   */
  async appleLogin(data: AppleAuthDto) {
    try {
      const { identityToken, fullName, email: providedEmail } = data;

      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: true,
      });

      const { email, sub: appleId } = payload;
      const userEmail = email || providedEmail;

      if (!userEmail) {
        throw new BadRequestException('Email is required');
      }

      let user = await User.findOne({ where: { email: userEmail } });

      if (!user) {
        // Name is only sent on first login by Apple
        const firstName = fullName ? fullName.split(' ')[0] : 'Apple User';
        const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : '';

        user = await User.create({
          email: userEmail,
          appleId,
          firstName,
          lastName,
          verificationLevel: 1, // Apple verified = level 1
          emailVerified: true, // Apple confirms email
          phoneVerified: false,
          isAdmin: false,
        });
      } else if (!user.appleId) {
        user.appleId = appleId;
        if (!user.emailVerified) {
          user.emailVerified = true;
          if (user.verificationLevel < 1) {
            user.verificationLevel = 1;
          }
        }
        await user.save();
      }

      user.lastActiveAt = new Date();
      await user.save();

      return this.createAuthResponse(user);
    } catch (error) {
      console.error('Apple Auth Error:', error);
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  // ============================================================================
  // PASSWORD RESET
  // ============================================================================

  /**
   * Trimitere email pentru reset parolă
   */
  async forgotPassword(data: ForgotPasswordDto) {
    const user = await User.findOne({ where: { email: data.email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message: 'Dacă există un cont cu acest email, vei primi un cod de resetare',
        expiresIn: OTP_EXPIRY_SECONDS,
      };
    }

    const code = await this.generateAndStoreOtp(`reset:${data.email}`);

    // Send password reset email
    await this.emailService.sendPasswordResetCode(data.email, code, user.firstName);

    // In development, return the code
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      success: true,
      message: 'Dacă există un cont cu acest email, vei primi un cod de resetare',
      expiresIn: OTP_EXPIRY_SECONDS,
      ...(isDev && { code }), // Only in dev
    };
  }

  /**
   * Resetare parolă cu cod
   */
  async resetPassword(data: ResetPasswordDto) {
    const isValid = await this.verifyOtp(`reset:${data.email}`, data.code);
    if (!isValid) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Cod invalid sau expirat',
      });
    }

    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilizator negăsit',
      });
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    await user.save();

    // Clear the OTP
    await this.redisClient.del(`otp:reset:${data.email}`);

    return { success: true, message: 'Parola a fost resetată cu succes' };
  }

  /**
   * Schimbare parolă (utilizator autentificat)
   */
  async changePassword(userId: string | number, data: ChangePasswordDto) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    if (!user.password) {
      throw new BadRequestException(
        'Contul tău folosește autentificare socială. Setează o parolă din setări.',
      );
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException({
        code: 'INVALID_CREDENTIALS',
        message: 'Parola curentă este incorectă',
      });
    }

    user.password = await bcrypt.hash(data.newPassword, 10);
    await user.save();

    return { success: true, message: 'Parola a fost schimbată cu succes' };
  }

  // ============================================================================
  // EMAIL/PHONE VERIFICATION
  // ============================================================================

  /**
   * Trimitere cod verificare email
   */
  async sendEmailVerificationCode(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email-ul este deja verificat' };
    }

    const code = await this.generateAndStoreOtp(`email:${email}`);

    // Send verification email
    await this.emailService.sendVerificationCode(email, code, user.firstName);

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      success: true,
      message: 'Cod de verificare trimis',
      expiresIn: OTP_EXPIRY_SECONDS,
      ...(isDev && { code }),
    };
  }

  /**
   * Verificare email cu cod
   */
  async verifyEmail(data: VerifyEmailDto) {
    const isValid = await this.verifyOtp(`email:${data.email}`, data.code);
    if (!isValid) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Cod invalid sau expirat',
      });
    }

    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    user.emailVerified = true;
    if (user.verificationLevel < 1) {
      user.verificationLevel = 1;
    }
    await user.save();

    await this.redisClient.del(`otp:email:${data.email}`);

    return { 
      success: true, 
      message: 'Email verificat cu succes',
      verificationLevel: user.verificationLevel,
    };
  }

  /**
   * Trimitere cod verificare telefon
   */
  async sendPhoneVerificationCode(phone: string) {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      throw new NotFoundException('Utilizator cu acest telefon nu a fost găsit');
    }

    if (user.phoneVerified) {
      return { success: true, message: 'Telefonul este deja verificat' };
    }

    return this.sendPhoneOtp(phone);
  }

  /**
   * Verificare telefon cu cod
   */
  async verifyPhone(data: VerifyPhoneDto) {
    const isValid = await this.verifyOtp(`phone:${data.phone}`, data.code);
    if (!isValid) {
      throw new BadRequestException({
        code: 'OTP_INVALID',
        message: 'Cod invalid sau expirat',
      });
    }

    const user = await User.findOne({ where: { phone: data.phone } });
    if (!user) {
      throw new NotFoundException('Utilizator negăsit');
    }

    user.phoneVerified = true;
    if (user.verificationLevel < 1) {
      user.verificationLevel = 1;
    }
    await user.save();

    await this.redisClient.del(`otp:phone:${data.phone}`);

    return {
      success: true,
      message: 'Telefon verificat cu succes',
      verificationLevel: user.verificationLevel,
    };
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    const userId = await this.redisClient.get(`refresh:${refreshToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.genToken(user.id, user.toSessionData());

    return {
      accessToken,
      expiresIn: this.options.expiresIn || 3600,
    };
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken?: string, userId?: string | number, allDevices = false) {
    if (refreshToken) {
      await this.redisClient.del(`refresh:${refreshToken}`);
    }

    if (allDevices && userId) {
      // TODO: Implement revoking all tokens for user
      // This would require storing refresh tokens with user association
    }

    return { success: true, message: 'Logged out successfully' };
  }

  // ============================================================================
  // JWT HELPERS
  // ============================================================================

  async genToken(
    user_id: string | number,
    data: any,
    type = this.options.type || 'user',
  ) {
    const token_id = genHex();
    return this.signJwt(data, { type, token_id, sub_id: user_id });
  }

  async verifyJwt(req: any) {
    const token = extractHeaderToken(req);

    if (!token) return null;

    try {
      const secret = new TextEncoder().encode(this.options.secret);
      return await jwtVerify(token, secret);
    } catch (error) {
      // We don't log here anymore to avoid noise on public routes
      // Higher level components (like Guards) can log if needed
      throw error;
    }
  }

  private async signJwt(
    data: any,
    opts: {
      type: string;
      token_id: string;
      sub_id: string | number;
      audience?: string;
    },
  ) {
    const secret = new TextEncoder().encode(this.options.secret);
    const signJwt = new SignJWT(data)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(opts.type)
      .setSubject(opts.sub_id.toString());

    if (opts.token_id) signJwt.setJti(getJti(opts.token_id));

    if (opts.audience || this.options.audience)
      signJwt.setAudience(opts.audience || this.options.audience);

    if (this.options.expiresIn)
      signJwt.setExpirationTime(`${this.options.expiresIn}s`);

    return signJwt.sign(secret);
  }

  async getUser(payloadJwt: any) {
    try {
      const userId = payloadJwt.payload.sub;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Return session data with fresh verification status
      return {
        ...user.toSessionData(),
        id: user.id,
        sub: user.id,
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      throw new UnauthorizedException('Invalid user');
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Create standard auth response
   */
  private async createAuthResponse(user: User) {
    const sessionData = user.toSessionData();
    const accessToken = await this.genToken(user.id, sessionData);
    const refreshToken = genHex(64);

    // Store refresh token
    await this.redisClient.setex(
      `refresh:${refreshToken}`,
      30 * 24 * 60 * 60, // 30 days
      user.id.toString(),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.options.expiresIn || 3600,
      user: sessionData,
    };
  }

  /**
   * Send OTP to phone
   */
  private async sendPhoneOtp(phone: string) {
    const code = await this.generateAndStoreOtp(`phone:${phone}`);

    // Send SMS with OTP code
    await this.smsService.sendOtpCode(phone, code);

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      success: true,
      message: 'Cod de verificare trimis',
      expiresIn: OTP_EXPIRY_SECONDS,
      ...(isDev && { code }),
    };
  }

  /**
   * Generate OTP and store in Redis
   */
  private async generateAndStoreOtp(key: string): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${key}`;
    const attemptsKey = `otp_attempts:${key}`;

    await this.redisClient.setex(otpKey, OTP_EXPIRY_SECONDS, code);
    await this.redisClient.setex(attemptsKey, OTP_EXPIRY_SECONDS, '0');

    return code;
  }

  /**
   * Verify OTP
   */
  private async verifyOtp(key: string, code: string): Promise<boolean> {
    const otpKey = `otp:${key}`;
    const attemptsKey = `otp_attempts:${key}`;

    // Check attempts
    const attempts = parseInt((await this.redisClient.get(attemptsKey)) || '0');
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({
        code: 'OTP_TOO_MANY_ATTEMPTS',
        message: 'Prea multe încercări. Solicită un nou cod.',
      });
    }

    const storedCode = await this.redisClient.get(otpKey);

    if (!storedCode) {
      return false;
    }

    if (storedCode !== code) {
      await this.redisClient.incr(attemptsKey);
      return false;
    }

    // Clear on success
    await this.redisClient.del(otpKey);
    await this.redisClient.del(attemptsKey);

    return true;
  }
}
