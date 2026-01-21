/**
 * 🔐 AUTH GUARD - Verificare autentificare JWT
 *
 * Guard principal pentru verificarea token-urilor JWT.
 * Conform ADR-001: Nu verifică subscription, doar autentificare.
 * Pentru verificări de nivel, folosește VerificationGuard.
 */

import { IS_PUBLIC_KEY, IS_AUTH_ONLY_KEY } from '../core/decorators';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if endpoint is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Still try to get user if token is provided (for optional auth)
      try {
        const payloadJwt = await this.authService.verifyJwt(request);
        if (payloadJwt) {
          request.user = await this.authService.getUser(payloadJwt);
        }
      } catch (e) {
        // Silently ignore invalid tokens for public routes
      }
      return true;
    }

    try {
      const payloadJwt = await this.authService.verifyJwt(request);

      if (payloadJwt) {
        request.user = await this.authService.getUser(payloadJwt);
        return true;
      }

      throw new UnauthorizedException('Token validation failed');
    } catch (error: any) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: error.message || 'Authentication failed',
      });
    }
  }
}
