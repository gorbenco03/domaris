/**
 * AdminGuard tests
 * Tests: @AdminOnly() enforcement, non-admin rejection, missing user, no decorator passthrough
 */

import { AdminGuard } from './admin.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { IS_ADMIN_KEY } from './decorators';

function makeContext(user: any | null, requireAdmin: boolean): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requireAdmin) } as any;
  const request = { user };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
    __reflector: reflector,
  } as any;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new AdminGuard(reflector);
  });

  describe('when @AdminOnly() is NOT set on handler', () => {
    it('allows access regardless of user', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext(null, false);
      (ctx as any).__reflector = reflector;

      // Override internal reflector call
      const guardWithMock = new AdminGuard(reflector);
      expect(guardWithMock.canActivate(buildCtx(null, false, reflector))).toBe(true);
    });

    it('allows access for normal user (no isAdmin)', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const result = guard.canActivate(buildCtx({ id: 1, isAdmin: false }, false, reflector));
      expect(result).toBe(true);
    });
  });

  describe('when @AdminOnly() IS set', () => {
    it('throws UnauthorizedException when no user on request', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(() => guard.canActivate(buildCtx(null, true, reflector))).toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException with ADMIN_REQUIRED code for non-admin user', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(() =>
        guard.canActivate(buildCtx({ id: 42, isAdmin: false }, true, reflector)),
      ).toThrow(ForbiddenException);

      try {
        guard.canActivate(buildCtx({ id: 42, isAdmin: false }, true, reflector));
      } catch (e: any) {
        expect(e.response?.code).toBe('ADMIN_REQUIRED');
      }
    });

    it('throws ForbiddenException when isAdmin is null/undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(() =>
        guard.canActivate(buildCtx({ id: 1, isAdmin: undefined }, true, reflector)),
      ).toThrow(ForbiddenException);
    });

    it('allows access for user with isAdmin=true', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = guard.canActivate(buildCtx({ id: 99, isAdmin: true }, true, reflector));
      expect(result).toBe(true);
    });

    it('uses getAllAndOverride with both handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const handler = jest.fn();
      const cls = jest.fn();
      const ctx = {
        getHandler: () => handler,
        getClass: () => cls,
        switchToHttp: () => ({ getRequest: () => ({ user: { isAdmin: false } }) }),
      } as any;

      guard.canActivate(ctx);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_ADMIN_KEY, [handler, cls]);
    });
  });
});

/** Helper to build a minimal ExecutionContext */
function buildCtx(user: any, requireAdmin: boolean, reflector: jest.Mocked<Reflector>): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}
