/**
 * AuthService tests
 * Tests: OTP generation, OTP verification (valid/invalid/attempts), validateUser,
 *        registerEmail (duplicate/missing consents), forgotPassword (no email enum),
 *        refreshToken, changePassword
 */

import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

// ─── Mock external dependencies BEFORE importing the service ─────────────────

// Mock User entity (Sequelize active record)
const mockUserFindOne = jest.fn();
const mockUserFindByPk = jest.fn();
const mockUserCreate = jest.fn();
const mockUserSave = jest.fn();

jest.mock('../db/entities/user.entity.js', () => ({
  User: {
    findOne: (...args: any[]) => mockUserFindOne(...args),
    findByPk: (...args: any[]) => mockUserFindByPk(...args),
    create: (...args: any[]) => mockUserCreate(...args),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((plain: string) => Promise.resolve(`hashed:${plain}`)),
  compare: jest.fn((plain: string, hashed: string) => Promise.resolve(hashed === `hashed:${plain}`)),
}));

// Mock email / sms / audit / consent services
const mockEmailService = {
  sendVerificationCode: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetCode: jest.fn().mockResolvedValue(undefined),
};
const mockSmsService = { sendOtpCode: jest.fn().mockResolvedValue(undefined) };
const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
  logKycApproval: jest.fn().mockResolvedValue(undefined),
};
const mockConsentService = { recordConsents: jest.fn().mockResolvedValue(undefined) };

// Mock jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn().mockResolvedValue({ payload: { sub: '1' } }),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setSubject: jest.fn().mockReturnThis(),
    setJti: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}));

// ─── Redis mock ───────────────────────────────────────────────────────────────
class MockRedis {
  private store = new Map<string, string>();

  async setex(key: string, _ttl: number, value: string) {
    this.store.set(key, value);
  }
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async del(key: string) {
    this.store.delete(key);
  }
  async incr(key: string): Promise<number> {
    const val = parseInt(this.store.get(key) ?? '0') + 1;
    this.store.set(key, val.toString());
    return val;
  }
  /** Test helper: directly set a key */
  _set(key: string, value: string) {
    this.store.set(key, value);
  }
  _get(key: string) {
    return this.store.get(key);
  }
  _clear() {
    this.store.clear();
  }
}

// ─── Import AFTER mocks are in place ─────────────────────────────────────────
import { AuthService } from './auth.service';

// ─── Test suite ──────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let redis: MockRedis;

  const AUTH_OPTIONS = {
    secret: 'test-secret-32-chars-xxxxxxxxxx',
    expiresIn: 3600,
    type: 'user',
  };

  beforeEach(() => {
    redis = new MockRedis();
    service = new AuthService(
      AUTH_OPTIONS as any,
      redis as any,
      mockEmailService as any,
      mockSmsService as any,
      mockAuditService as any,
      mockConsentService as any,
    );
    jest.clearAllMocks();
  });

  // ─── validateUser ─────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns user when email and password match', async () => {
      const fakeUser = { id: 1, email: 'a@b.com', password: 'hashed:correct' };
      mockUserFindOne.mockResolvedValue(fakeUser);

      const result = await service.validateUser('a@b.com', 'correct');
      expect(result).toBe(fakeUser);
    });

    it('returns null when user not found', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const result = await service.validateUser('no@user.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const fakeUser = { id: 1, email: 'a@b.com', password: 'hashed:correct' };
      mockUserFindOne.mockResolvedValue(fakeUser);

      const result = await service.validateUser('a@b.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns null when user has no password (OAuth account)', async () => {
      const fakeUser = { id: 1, email: 'a@b.com', password: null };
      mockUserFindOne.mockResolvedValue(fakeUser);

      const result = await service.validateUser('a@b.com', 'anypass');
      expect(result).toBeNull();
    });
  });

  // ─── registerEmail ────────────────────────────────────────────────────────

  describe('registerEmail', () => {
    const validDto = {
      email: 'test@example.com',
      password: 'Password1',
      firstName: 'Ion',
      lastName: 'Popescu',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptGdpr: true,
    };

    it('throws BadRequestException with EMAIL_ALREADY_EXISTS when email taken', async () => {
      mockUserFindOne.mockResolvedValue({ id: 1 });

      await expect(service.registerEmail(validDto as any)).rejects.toThrow(BadRequestException);
      try {
        await service.registerEmail(validDto as any);
      } catch (e: any) {
        expect(e.response?.code).toBe('EMAIL_ALREADY_EXISTS');
      }
    });

    it('throws BadRequestException with CONSENTS_REQUIRED when acceptTerms=false', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const dto = { ...validDto, acceptTerms: false };

      await expect(service.registerEmail(dto as any)).rejects.toThrow(BadRequestException);
      try {
        await service.registerEmail(dto as any);
      } catch (e: any) {
        expect(e.response?.code).toBe('CONSENTS_REQUIRED');
      }
    });

    it('throws BadRequestException when acceptPrivacy=false', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const dto = { ...validDto, acceptPrivacy: false };

      await expect(service.registerEmail(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when acceptGdpr=false', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const dto = { ...validDto, acceptGdpr: false };

      await expect(service.registerEmail(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('stores pending registration in Redis and calls email service', async () => {
      mockUserFindOne.mockResolvedValue(null);

      const result = await service.registerEmail(validDto as any);

      expect(result.success).toBe(true);
      expect(result.expiresIn).toBe(600);
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalledWith(
        validDto.email,
        expect.any(String),
        validDto.firstName,
      );

      // Pending data should be in Redis
      const pendingKey = `pending_register:email:${validDto.email}`;
      const stored = redis._get(pendingKey);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.email).toBe(validDto.email);
      expect(parsed.consents.acceptTerms).toBe(true);
    });

    it('returns code in dev mode (NODE_ENV != production)', async () => {
      process.env.NODE_ENV = 'development';
      mockUserFindOne.mockResolvedValue(null);

      const result = await service.registerEmail(validDto as any);
      expect(result.code).toBeDefined();

      delete process.env.NODE_ENV;
    });

    it('does NOT return code in production mode', async () => {
      process.env.NODE_ENV = 'production';
      mockUserFindOne.mockResolvedValue(null);

      const result = await service.registerEmail(validDto as any);
      expect((result as any).code).toBeUndefined();

      process.env.NODE_ENV = 'test';
    });
  });

  // ─── OTP verification (via private methods tested through verifyEmailOtp) ──

  describe('verifyEmailOtp', () => {
    const email = 'otp@test.com';
    const otpKey = `otp:register:email:${email}`;
    const attemptsKey = `otp_attempts:register:email:${email}`;
    const pendingKey = `pending_register:email:${email}`;

    const pendingData = JSON.stringify({
      email,
      password: 'hashed:Password1',
      firstName: 'Ion',
      lastName: 'Pop',
      consents: { acceptTerms: true, acceptPrivacy: true, acceptGdpr: true },
    });

    beforeEach(() => {
      redis._clear();
    });

    it('throws BadRequestException OTP_INVALID when code is wrong', async () => {
      redis._set(otpKey, '123456');
      redis._set(attemptsKey, '0');
      redis._set(pendingKey, pendingData);

      await expect(
        service.verifyEmailOtp({ email, code: '999999' }),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.verifyEmailOtp({ email, code: '999999' });
      } catch (e: any) {
        expect(e.response?.code).toBe('OTP_INVALID');
      }
    });

    it('throws BadRequestException OTP_TOO_MANY_ATTEMPTS after 5 wrong tries', async () => {
      redis._set(otpKey, '123456');
      redis._set(attemptsKey, '5'); // already at max
      redis._set(pendingKey, pendingData);

      await expect(
        service.verifyEmailOtp({ email, code: '123456' }),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.verifyEmailOtp({ email, code: '123456' });
      } catch (e: any) {
        expect(e.response?.code).toBe('OTP_TOO_MANY_ATTEMPTS');
      }
    });

    it('throws BadRequestException when OTP is expired (not in Redis)', async () => {
      // No OTP in redis — simulates expiry
      redis._set(attemptsKey, '0');
      redis._set(pendingKey, pendingData);

      await expect(
        service.verifyEmailOtp({ email, code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException REGISTRATION_EXPIRED when pending data is gone', async () => {
      // OTP is valid but pendingKey was not set (e.g. expired separately)
      redis._set(otpKey, '123456');
      redis._set(attemptsKey, '0');
      // Deliberately NOT setting pendingKey

      // First call: OTP is valid (redis has it), but pending is missing → REGISTRATION_EXPIRED
      try {
        await service.verifyEmailOtp({ email, code: '123456' });
        fail('Should have thrown');
      } catch (e: any) {
        // Code flow: verifyOtp succeeds (deletes the key), then checks pendingKey → not found
        expect(e.response?.code).toBe('REGISTRATION_EXPIRED');
      }
    });

    it('creates user and returns auth response on valid OTP', async () => {
      redis._set(otpKey, '123456');
      redis._set(attemptsKey, '0');
      redis._set(pendingKey, pendingData);

      // No existing user
      mockUserFindOne.mockResolvedValue(null);

      const mockUser = {
        id: 10,
        email,
        firstName: 'Ion',
        lastName: 'Pop',
        verificationLevel: 1,
        isAdmin: false,
        emailVerified: true,
        phoneVerified: false,
        toSessionData: jest.fn().mockReturnValue({ id: 10, email }),
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockUserCreate.mockResolvedValue(mockUser);

      const result = await service.verifyEmailOtp({ email, code: '123456' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          verificationLevel: 1,
          emailVerified: true,
          isAdmin: false,
        }),
      );
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns success even when email does not exist (prevent enumeration)', async () => {
      mockUserFindOne.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'ghost@example.com' });

      expect(result.success).toBe(true);
      // Should NOT have sent an actual email
      expect(mockEmailService.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('sends reset email when user exists', async () => {
      const user = { id: 1, email: 'user@example.com', firstName: 'Ion' };
      mockUserFindOne.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: 'user@example.com' });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendPasswordResetCode).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
        'Ion',
      );
    });

    it('response message is identical whether user exists or not', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const res1 = await service.forgotPassword({ email: 'no@user.com' });

      mockUserFindOne.mockResolvedValue({ id: 1, email: 'has@user.com', firstName: 'Ana' });
      const res2 = await service.forgotPassword({ email: 'has@user.com' });

      expect(res1.message).toBe(res2.message);
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('throws NotFoundException when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);
      await expect(
        service.changePassword(99, { currentPassword: 'Old1', newPassword: 'New1pass' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user has no password (OAuth)', async () => {
      mockUserFindByPk.mockResolvedValue({ id: 1, password: null });
      await expect(
        service.changePassword(1, { currentPassword: 'any', newPassword: 'New1pass' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException INVALID_CREDENTIALS when current password wrong', async () => {
      mockUserFindByPk.mockResolvedValue({ id: 1, password: 'hashed:correct' });
      await expect(
        service.changePassword(1, { currentPassword: 'wrong', newPassword: 'NewPass1' } as any),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.changePassword(1, { currentPassword: 'wrong', newPassword: 'NewPass1' } as any);
      } catch (e: any) {
        expect(e.response?.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('updates password and returns success when credentials are correct', async () => {
      const mockUser = {
        id: 1,
        password: 'hashed:correct',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockUserFindByPk.mockResolvedValue(mockUser);

      const result = await service.changePassword(1, {
        currentPassword: 'correct',
        newPassword: 'NewPass1',
      } as any);

      expect(result.success).toBe(true);
      expect(mockUser.password).toBe('hashed:NewPass1');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('throws UnauthorizedException when refresh token not in Redis', async () => {
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user from Redis not found in DB', async () => {
      redis._set('refresh:valid-token', '42');
      mockUserFindByPk.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns new accessToken when refresh token is valid', async () => {
      redis._set('refresh:valid-token', '1');
      const mockUser = {
        id: 1,
        toSessionData: jest.fn().mockReturnValue({ id: 1, email: 'a@b.com' }),
      };
      mockUserFindByPk.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBe(AUTH_OPTIONS.expiresIn);
    });
  });

  // ─── OTP generation: range check ─────────────────────────────────────────

  describe('OTP generation (via registerEmail)', () => {
    it('generates 6-digit numeric OTP', async () => {
      mockUserFindOne.mockResolvedValue(null);
      process.env.NODE_ENV = 'development';

      const result = await service.registerEmail({
        email: 'gen@test.com',
        password: 'Password1',
        acceptTerms: true,
        acceptPrivacy: true,
        acceptGdpr: true,
      } as any);

      expect(result.code).toMatch(/^\d{6}$/);
      const code = parseInt(result.code!, 10);
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThan(1000000);

      process.env.NODE_ENV = 'test';
    });
  });
});
