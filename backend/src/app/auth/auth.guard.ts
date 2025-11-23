import { IS_PUBLIC_KEY, IS_AUTH_ONLY_KEY } from '../core/decorators';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { User } from '../db/entities/user.entity.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isAuthOnly = this.reflector.getAllAndOverride<boolean>(
      IS_AUTH_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    try {
      const payloadJwt = await this.authService.verifyJwt(request);

      if (payloadJwt) {
        request.user = await this.authService.getUser(payloadJwt);

        // If endpoint is AuthOnly, skip subscription check
        if (isAuthOnly) {
          return true;
        }

        // If Redis subscription status is null, check database instead
        if (!request.user.subscriptionStatus) {
          try {
            const user = await User.findByPk(request.user.sub);
            if (user && user.hasActiveSubscription) {
              return true;
            } else {
              return false;
            }
          } catch (dbError) {
            // If database check fails, fall back to Redis status
            return !!request.user.subscriptionStatus;
          }
        }

        // Use Redis subscription status if available
        return !!request.user.subscriptionStatus;
      }

      return false;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
