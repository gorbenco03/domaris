/**
 * 🛡️ ADMIN GUARD - Verificare privilegii administrator
 *
 * Conform ADR-001: Folosește isAdmin flag în loc de role
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_ADMIN_KEY } from './decorators';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if @AdminOnly() decorator is used
    const requireAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If not required, allow access
    if (!requireAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // ADR-001: Check isAdmin flag instead of role
    if (!user.isAdmin) {
      throw new ForbiddenException({
        code: 'ADMIN_REQUIRED',
        message: 'Admin privileges required',
      });
    }

    return true;
  }
}
