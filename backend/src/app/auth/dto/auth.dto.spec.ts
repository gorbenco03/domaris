/**
 * Auth DTO validation tests
 * Tests: RegisterEmailDto, LoginDto, VerifyEmailOtpDto, ResetPasswordDto,
 *        ChangePasswordDto, SendPhoneVerificationDto
 * Uses class-validator to exercise decorators without NestJS framework.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  RegisterEmailDto,
  LoginDto,
  VerifyEmailOtpDto,
  ResetPasswordDto,
  ChangePasswordDto,
  SendPhoneVerificationDto,
} from './auth.dto';

async function validateDto<T extends object>(cls: new () => T, data: object) {
  const instance = plainToInstance(cls, data);
  return validate(instance as object);
}

// ─── RegisterEmailDto ────────────────────────────────────────────────────────

describe('RegisterEmailDto', () => {
  const validData = {
    email: 'user@example.com',
    password: 'Password1',
    acceptTerms: true,
    acceptPrivacy: true,
    acceptGdpr: true,
  };

  it('passes with valid data', async () => {
    const errors = await validateDto(RegisterEmailDto, validData);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid email format', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, email: 'not-an-email' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails with missing email', async () => {
    const { email, ...rest } = validData;
    const errors = await validateDto(RegisterEmailDto, rest);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails with password shorter than 8 chars', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, password: 'Ab1' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails with password missing uppercase', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, password: 'password1' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails with password missing lowercase', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, password: 'PASSWORD1' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails with password missing digit', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, password: 'PasswordX' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('fails when acceptTerms is false (not a validation error, but a boolean)', async () => {
    // class-validator checks it IS a boolean — value false is still valid type-wise
    // The actual business rejection (value=false) happens in auth.service
    const errors = await validateDto(RegisterEmailDto, { ...validData, acceptTerms: 'yes' });
    expect(errors.some((e) => e.property === 'acceptTerms')).toBe(true);
  });

  it('fails when acceptPrivacy is not a boolean', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, acceptPrivacy: 1 });
    expect(errors.some((e) => e.property === 'acceptPrivacy')).toBe(true);
  });

  it('fails when acceptGdpr is missing', async () => {
    const { acceptGdpr, ...rest } = validData as any;
    const errors = await validateDto(RegisterEmailDto, rest);
    expect(errors.some((e) => e.property === 'acceptGdpr')).toBe(true);
  });

  it('accepts optional acceptMarketing field', async () => {
    const errors = await validateDto(RegisterEmailDto, { ...validData, acceptMarketing: true });
    expect(errors).toHaveLength(0);
  });

  it('accepts optional fields absent', async () => {
    const errors = await validateDto(RegisterEmailDto, validData);
    expect(errors).toHaveLength(0);
  });
});

// ─── LoginDto ────────────────────────────────────────────────────────────────

describe('LoginDto', () => {
  const validData = { email: 'a@b.com', password: 'anypass' };

  it('passes with valid email and password', async () => {
    const errors = await validateDto(LoginDto, validData);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid email', async () => {
    const errors = await validateDto(LoginDto, { ...validData, email: 'bad' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('fails with empty password', async () => {
    const errors = await validateDto(LoginDto, { ...validData, password: '' });
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});

// ─── VerifyEmailOtpDto ────────────────────────────────────────────────────────

describe('VerifyEmailOtpDto', () => {
  const validData = { email: 'a@b.com', code: '123456' };

  it('passes with valid data', async () => {
    const errors = await validateDto(VerifyEmailOtpDto, validData);
    expect(errors).toHaveLength(0);
  });

  it('fails with code shorter than 6 chars', async () => {
    const errors = await validateDto(VerifyEmailOtpDto, { ...validData, code: '12345' });
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('fails with code longer than 6 chars', async () => {
    const errors = await validateDto(VerifyEmailOtpDto, { ...validData, code: '1234567' });
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('fails with invalid email', async () => {
    const errors = await validateDto(VerifyEmailOtpDto, { ...validData, email: 'notEmail' });
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});

// ─── ResetPasswordDto ────────────────────────────────────────────────────────

describe('ResetPasswordDto', () => {
  const validData = {
    email: 'a@b.com',
    code: '123456',
    newPassword: 'NewPass1',
  };

  it('passes with valid data', async () => {
    const errors = await validateDto(ResetPasswordDto, validData);
    expect(errors).toHaveLength(0);
  });

  it('fails with weak newPassword (no uppercase)', async () => {
    const errors = await validateDto(ResetPasswordDto, { ...validData, newPassword: 'weakpass1' });
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('fails with weak newPassword shorter than 8 chars', async () => {
    const errors = await validateDto(ResetPasswordDto, { ...validData, newPassword: 'Ab1' });
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('fails with invalid code length', async () => {
    const errors = await validateDto(ResetPasswordDto, { ...validData, code: '12' });
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });
});

// ─── ChangePasswordDto ───────────────────────────────────────────────────────

describe('ChangePasswordDto', () => {
  const validData = {
    currentPassword: 'OldPass1',
    newPassword: 'NewPass1',
  };

  it('passes with valid data', async () => {
    const errors = await validateDto(ChangePasswordDto, validData);
    expect(errors).toHaveLength(0);
  });

  it('fails with empty currentPassword', async () => {
    const errors = await validateDto(ChangePasswordDto, { ...validData, currentPassword: '' });
    expect(errors.some((e) => e.property === 'currentPassword')).toBe(true);
  });

  it('fails with weak newPassword', async () => {
    const errors = await validateDto(ChangePasswordDto, { ...validData, newPassword: 'short' });
    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });
});

// ─── SendPhoneVerificationDto ─────────────────────────────────────────────────

describe('SendPhoneVerificationDto', () => {
  it('passes with valid international phone', async () => {
    const errors = await validateDto(SendPhoneVerificationDto, { phone: '+37369123456' });
    expect(errors).toHaveLength(0);
  });

  it('passes with phone without + prefix (valid E.164 pattern)', async () => {
    const errors = await validateDto(SendPhoneVerificationDto, { phone: '37369123456' });
    expect(errors).toHaveLength(0);
  });

  it('fails with short number (too few digits)', async () => {
    const errors = await validateDto(SendPhoneVerificationDto, { phone: '+123' });
    expect(errors.some((e) => e.property === 'phone')).toBe(true);
  });

  it('fails with empty phone', async () => {
    const errors = await validateDto(SendPhoneVerificationDto, { phone: '' });
    expect(errors.some((e) => e.property === 'phone')).toBe(true);
  });

  it('fails with letters in phone number', async () => {
    const errors = await validateDto(SendPhoneVerificationDto, { phone: '+40712abc456' });
    expect(errors.some((e) => e.property === 'phone')).toBe(true);
  });
});
