import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Assumes AuthGuard has run and attached user

        if (!user) {
            throw new UnauthorizedException('Authentication required');
        }

        if (user.role !== 'admin') {
            throw new ForbiddenException('Admin privileges required');
        }

        return true;
    }
}
