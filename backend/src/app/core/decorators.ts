/**
 * 🎨 DECORATORS - Decoratoare personalizate pentru NestJS
 *
 * Includes:
 * - @Public() - Endpoint accesibil fără autentificare
 * - @AuthOnly() - Necesită doar autentificare, fără verificări adiționale
 * - @MinVerificationLevel(n) - Necesită nivel minim de verificare (ADR-001)
 * - @AdminOnly() - Necesită flag isAdmin
 * - @CurrentUser() - Extrage utilizatorul din request
 */

import { SetMetadata, createParamDecorator, ExecutionContext, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

// ============================================================================
// METADATA KEYS
// ============================================================================

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_AUTH_ONLY_KEY = 'isAuthOnly';
export const MIN_VERIFICATION_LEVEL_KEY = 'minVerificationLevel';
export const IS_ADMIN_KEY = 'isAdmin';

// ============================================================================
// BASIC DECORATORS
// ============================================================================

/**
 * Marchează un endpoint ca public (nu necesită autentificare)
 *
 * @example
 * @Public()
 * @Get('properties')
 * listProperties() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Marchează un endpoint ca necesitând doar autentificare
 * (fără verificări adiționale de nivel)
 */
export const AuthOnly = () => SetMetadata(IS_AUTH_ONLY_KEY, true);

// ============================================================================
// VERIFICATION LEVEL DECORATOR (ADR-001)
// ============================================================================

/**
 * Setează nivelul minim de verificare necesar pentru endpoint
 *
 * Levels:
 * - 0: Cont nou (doar autentificat)
 * - 1: Email/Telefon verificat
 * - 2: Identitate verificată (poate posta)
 * - 3: Proprietar verificat
 *
 * @example
 * @MinVerificationLevel(2)
 * @Post('properties')
 * createProperty() { ... }
 */
export const MinVerificationLevel = (level: 0 | 1 | 2 | 3) =>
  SetMetadata(MIN_VERIFICATION_LEVEL_KEY, level);

/**
 * Shorthand decorators pentru niveluri comune
 */
export const RequireEmailVerified = () => MinVerificationLevel(1);
export const RequireIdentityVerified = () => MinVerificationLevel(2);
export const RequirePropertyVerified = () => MinVerificationLevel(3);

// ============================================================================
// ADMIN DECORATOR
// ============================================================================

/**
 * Marchează un endpoint ca necesar flag isAdmin
 */
export const AdminOnly = () => SetMetadata(IS_ADMIN_KEY, true);

// ============================================================================
// PARAM DECORATORS
// ============================================================================

/**
 * Extrage utilizatorul curent din request
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * // Sau pentru un câmp specific
 * @Get('me/id')
 * getId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);

/**
 * Extrage ID-ul utilizatorului curent
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.sub;
  },
);

// ============================================================================
// COMBINED DECORATORS (cu Swagger docs)
// ============================================================================

/**
 * Decorator combinat pentru endpoint-uri care necesită postare de anunțuri
 */
export function RequireCanPost() {
  return applyDecorators(
    MinVerificationLevel(2),
    ApiForbiddenResponse({
      description: 'Verificare identitate necesară pentru a posta anunțuri',
    }),
  );
}

/**
 * Decorator combinat pentru endpoint-uri care necesită contact
 */
export function RequireCanContact() {
  return applyDecorators(
    MinVerificationLevel(1),
    ApiForbiddenResponse({
      description: 'Verificare email/telefon necesară pentru a contacta',
    }),
  );
}

/**
 * Decorator combinat pentru endpoint-uri admin
 */
export function RequireAdmin() {
  return applyDecorators(
    AdminOnly(),
    ApiForbiddenResponse({
      description: 'Privilegii de administrator necesare',
    }),
  );
}
