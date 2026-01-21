/**
 * 🔐 VERIFICATION GUARD - Conform ADR-001: Model de Cont Unificat
 *
 * Guard pentru verificarea nivelului de acces al utilizatorului.
 * Folosește verificationLevel în loc de role.
 *
 * Usage:
 * @UseGuards(AuthGuard, VerificationGuard)
 * @MinVerificationLevel(2)  // Necesită identitate verificată
 * async createProperty() { ... }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_VERIFICATION_LEVEL_KEY } from './decorators';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required verification level from decorator
    const requiredLevel = this.reflector.getAllAndOverride<number>(
      MIN_VERIFICATION_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no level is required (decorator not used), allow access
    if (requiredLevel === undefined || requiredLevel === null) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check verification level
    const userLevel = user.verificationLevel ?? 0;

    if (userLevel < requiredLevel) {
      const messages: Record<number, string> = {
        1: 'Verifică-ți emailul sau telefonul pentru a continua.',
        2: 'Verifică-ți identitatea pentru a posta anunțuri.',
        3: 'Verifică-ți documentele de proprietate pentru acest acces.',
      };

      throw new ForbiddenException({
        code: 'VERIFICATION_REQUIRED',
        message: messages[requiredLevel] || 'Nivel de verificare insuficient.',
        requiredLevel,
        currentLevel: userLevel,
      });
    }

    return true;
  }
}
