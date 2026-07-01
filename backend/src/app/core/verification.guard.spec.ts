/**
 * VerificationGuard tests
 * Tests: @MinVerificationLevel enforcement, insufficient level, missing user, no decorator passthrough
 */

import { VerificationGuard } from './verification.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { MIN_VERIFICATION_LEVEL_KEY } from './decorators';

describe('VerificationGuard', () => {
  let guard: VerificationGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new VerificationGuard(reflector);
  });

  function buildCtx(user: any, level: number | undefined | null): ExecutionContext {
    reflector.getAllAndOverride.mockReturnValue(level);
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as any;
  }

  describe('when @MinVerificationLevel is NOT set', () => {
    it('allows access when requiredLevel is undefined', () => {
      const ctx = buildCtx(null, undefined);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows access when requiredLevel is null', () => {
      const ctx = buildCtx(null, null);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @MinVerificationLevel(1) is set', () => {
    it('throws UnauthorizedException when no user on request', () => {
      const ctx = buildCtx(null, 1);
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException with VERIFICATION_REQUIRED for level 0 user', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 0 }, 1);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);

      try {
        guard.canActivate(ctx);
      } catch (e: any) {
        expect(e.response?.code).toBe('VERIFICATION_REQUIRED');
        expect(e.response?.requiredLevel).toBe(1);
        expect(e.response?.currentLevel).toBe(0);
      }
    });

    it('allows access for user with verificationLevel 1', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 1 }, 1);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows access for user with verificationLevel higher than required', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 3 }, 1);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @MinVerificationLevel(2) is set', () => {
    it('throws ForbiddenException for level 1 user', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 1 }, 2);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows access for level 2 user', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 2 }, 2);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('includes correct error message for level 2 requirement', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 0 }, 2);
      try {
        guard.canActivate(ctx);
      } catch (e: any) {
        expect(e.response?.message).toContain('identitate');
      }
    });
  });

  describe('when @MinVerificationLevel(3) is set', () => {
    it('throws ForbiddenException for level 2 user', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 2 }, 3);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('allows access for level 3 user', () => {
      const ctx = buildCtx({ id: 1, verificationLevel: 3 }, 3);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('treats missing verificationLevel on user as 0', () => {
      // user exists but has no verificationLevel field
      const ctx = buildCtx({ id: 1 }, 1);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('reflector is called with correct metadata key', () => {
      const handler = jest.fn();
      const cls = jest.fn();
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = {
        getHandler: () => handler,
        getClass: () => cls,
        switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
      } as any;

      guard.canActivate(ctx);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(MIN_VERIFICATION_LEVEL_KEY, [handler, cls]);
    });
  });
});
